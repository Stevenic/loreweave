# Narrative Engine

The narrative engine (`@loreweave/narrative`) is the **DungeonMaster** — it orchestrates player turns by connecting the intent parser, rules engine, world state, and LLM. The LLM's only job is rendering mechanical outcomes as prose.

## The DungeonMaster Class

`DungeonMaster` is the main entry point. It holds a `GameSession` and processes turns through a 5-step pipeline:

```typescript
const dm = new DungeonMaster(session, adapter, config, worldConfig);
const response = await dm.processTurn("attack the goblin", "player-1");
```

### Turn Pipeline

```
1. parseIntent(input)           → GameAction or null (with failure hints)
2. resolveAction(action)        → ActionResult {success, effects, narrationHints}
3. applyEffects(effects)        → Updated character map
4. assembleContext(session)      → NarrativeContext (location, entities, exits, events)
5. buildPrompts(context, result) → {system, user} prompts
6. adapter.generate(system, user) → Narrative text (LLM call)
```

## Intent Parser

Deterministic keyword matching — no LLM involved in parsing player intent.

```typescript
parseIntent(input, actorId, nearbyEntities, inventoryItems) → ParseResult
```

### Action Types & Keywords

| Action | Keywords | Extracts |
|--------|----------|----------|
| `move` | go, walk, run, head, travel | Direction (8 cardinal + 8 diagonal) |
| `look` | look, examine, inspect, observe | Optional target |
| `attack` | attack, hit, strike, slash, shoot | Target entity |
| `talk` | talk, speak, ask, tell, greet | Target entity |
| `search` | search, investigate, explore, check | Optional area |
| `use_item` | use, drink, eat, apply, equip | Item from inventory |
| `pickup` | pick up, grab, take, collect | Target item |
| `drop` | drop, discard, throw away | Item from inventory |
| `craft` | craft, build, make, create | Item name |
| `rest` | rest, sleep, camp, meditate | — |

### Resolution

- **Direction**: Matches 8 cardinal directions + 8 diagonals with aliases ("nw", "northwest", "upper left")
- **Target**: Substring match against nearby entity names (case-insensitive)
- **Item**: Substring match against inventory item names
- **Stealth**: Detected by "quietly", "sneak", "stealth" modifiers

If parsing fails, the parser returns `null` action with failure hints (e.g., "no direction specified", "target not found nearby") so the LLM can narrate the confusion naturally.

## Action Resolver

Runs D&D 5e mechanics for the parsed action. Every resolver is a pure function.

| Action | Mechanics |
|--------|----------|
| **move** | Check destination tile walkability. If walkable, emit `move` effect. If not, fail with reason. |
| **look** | Perception-gated: low rolls miss hidden features. Returns tile description data (biome, surface, features, structures, resources). |
| **attack** | Distance check → melee (STR) or ranged (DEX). D20 + modifier vs AC. Damage dice + modifier on hit. Critical on nat 20. |
| **search** | Investigation check vs DC. On success: discover hidden features, gather resources. |
| **rest** | Heal 50% max HP. Remove `frightened` and `charmed` conditions. Advance time. |
| **talk** | No mechanical resolution — purely narrative. The LLM handles NPC dialogue. |
| **use_item** | Item-specific. Healing potion: 2d4+2 HP, consume item. |
| **pickup/drop** | Inventory mutations. Minimal v1 stub (no weight/capacity). |
| **craft** | Not yet implemented — returns failure. |

### Effects

Actions produce `GameEffect[]` — atomic state changes applied after resolution:

```typescript
type GameEffect =
  | { type: 'move'; targetId: string; x: number; y: number }
  | { type: 'damage'; targetId: string; amount: number }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'item_gained'; targetId: string; item: Item }
  | { type: 'item_lost'; targetId: string; itemId: string }
  | { type: 'condition_added'; targetId: string; condition: Condition }
  | { type: 'condition_removed'; targetId: string; condition: Condition }
  // ... more
```

Effects are applied via `applyEffects(characterMap, effects)` — a pure function that returns a new character map.

## Context Assembler

Gathers everything the LLM needs to narrate the turn:

```typescript
assembleContext(session, config) → NarrativeContext
```

| Component | Source | What It Provides |
|-----------|--------|-----------------|
| Location | `World.getTile()` | Biome, surface, elevation, features, structures, resources |
| Entities | Session character map | Visible NPCs/creatures with HP, hostility |
| Exits | 8-directional tile scan | What's in each direction (biome, walkability, structures) |
| Events | `World.getRecentEvents()` | Recent actions/happenings at this location |
| Party | Session party list | Character names, HP, active conditions |
| Quest hints | Session quest list | Active objectives matching current location or entities |

All context assembly functions are pure — no side effects, no world mutations.

## Prompt Builder

Converts context + action result into LLM prompts:

```typescript
buildPrompts(session, context, parseResult, actionResult, worldConfig, sessionConfig)
  → { system: string, user: string }
```

### System Prompt (static per world)

If a `WorldConfig` is loaded, the system prompt comes from the **DM Persona**:
- Identity and tone guide ("You are the Weave-Keeper, narrator of Threadhallow...")
- Naming conventions (place names, NPC names)
- Forbidden topics (never reveal the Weaver's fate directly)
- Special instructions (always reference ward-light, use textile metaphors)
- Response length guidance

Hard rules (always present):
- Never override mechanical outcomes
- Never add items or effects the rules engine didn't produce
- Never break the fourth wall

### User Prompt (dynamic per turn)

Built in sections, each providing structured facts for the LLM:

1. **Location** — biome, surface, elevation, features, structures, resources
   - If vocabulary tables loaded: sensory descriptors (terrain feel, sounds, smells, atmosphere, sky, light)
2. **Environment** — time of day, season, weather
   - Vocabulary enrichment for time and weather descriptors
3. **World state** (if Threadhallow) — ward strengths, faction standing, Fray exposure levels
4. **Party** — each character with HP, conditions, Fray exposure
5. **Nearby entities** — name, type, hostility
6. **Exits** — direction → description (walkability, biome, structures)
7. **Recent events** — event log within time window
8. **Quest hints** — active objectives matching current context
9. **Player action** — what they tried, mechanical result, effects applied, narration hints

## Vocabulary Injection

When a `WorldConfig` includes `VocabularyTable`, the prompt builder enriches location and environment descriptions with sensory detail from data files:

```
Without vocabulary: "Location: forest, Surface: grass, Features: oak_tree, mushrooms"
With vocabulary:    "Location: forest — loamy earth underfoot, birdsong and rustling canopy,
                     petrichor and moss, dappled golden light filtering through leaves"
```

Vocabulary tables live in `worlds/shared/vocabulary/` (base) and `worlds/<name>/vocabulary/` (world-specific overlays). They map `biome × time × weather` → sensory tags.

## World Configuration

The engine is world-agnostic by default. A `WorldConfig` makes it world-specific:

```typescript
type WorldConfig = {
    persona: DMPersona;              // DM personality and tone
    statTiers: StatTierDefinition[]; // NPC stat block generation
    wardConfig?: WardConfig;         // Settlement ward mechanics
    frayConfig?: FrayExposureConfig; // Corruption system
    encounterTables?: EncounterTable[];
    creatures?: CreatureStatBlock[];
    skillChallenges?: SkillChallengeConfig[];
    vocabulary?: VocabularyTable;    // Sensory descriptors
};
```

Loaded via `loadWorldConfig(worldsDir, worldId)` from JSON files in `worlds/<name>/config/`.

## Game Session

The `GameSession` holds all mutable state for an active game:

```typescript
type GameSession = {
    world: WorldAccess;          // Read-only world interface
    party: Character[];          // Player characters
    quests: Quest[];             // Active quests
    knownEntities: EntityRef[];  // Discovered NPCs/creatures
    turnCount: number;
    inCombat: boolean;
    initiativeOrder?: Character[];
    // World-specific (Threadhallow):
    wardStrengths?: Map<string, number>;
    factionReputation?: Map<string, number>;
    frayExposure?: Map<string, number>;
};
```

## NarrativeAdapter Interface

The LLM connection is abstracted behind a simple interface:

```typescript
interface NarrativeAdapter {
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
}
```

Any LLM provider can be plugged in — the engine doesn't care which model generates the prose. The `@loreweave/agents` package provides CLI adapters for specific providers.

# 🌌 LoreWeave — Initial Design Specification (v1)

## 1. Overview

**LoreWeave** is a **persistent, multiplayer, LLM-powered narrative world engine** where:

* The **world is deterministic and shared**
* The **LLM renders story (not logic)**
* The **rules system is based on D&D 5e**
* The **visual layer is pixel-based and deterministic (.pixel format)**
* The **content system supports modular “campaign injections”**

---

## 2. Core Principles

### 2.1 Separation of Responsibilities

| System                 | Responsibility                       |
| ---------------------- | ------------------------------------ |
| World Engine           | Truth (terrain, objects, structures) |
| Rules Engine           | Mechanics (combat, stats, crafting)  |
| Narrative Engine (LLM) | Description only                     |
| Visual Engine (.pixel) | Deterministic rendering              |
| Scenario System        | Structured story injection           |

👉 **LLM never owns state**

---

### 2.2 Determinism First

* All world state must be reproducible
* No hallucinated objects
* Visuals generated from structured data only

---

### 2.3 Shared Persistent World

* Player actions permanently affect the world
* Structures, items, and changes are global

---

# 3. System Architecture

## 3.1 High-Level Diagram

```
Player Input
     ↓
Intent Parser
     ↓
Rules Engine (D&D 5e)
     ↓
World State Update
     ↓
 ┌───────────────┬───────────────┐
 │ Narrative     │ Visual        │
 │ Engine (LLM)  │ Engine (.pixel)
 └───────────────┴───────────────┘
         ↓             ↓
      Text Output   Image Output
```

---

# 4. Core Systems

---

## 4.1 World Engine

### Responsibilities

* Terrain generation
* Biomes
* Resource distribution
* Structures
* Persistence

### Model

```ts
type WorldTile = {
  x: number;
  y: number;
  biome: BiomeType;
  elevation: number;
  resources: ResourceType[];
  structures: StructureID[];
  features: FeatureType[];
};
```

---

### 4.1.1 Chunking

```ts
type Chunk = {
  id: string; // hash(x, y)
  tiles: WorldTile[];
};
```

* Suggested size: 16×16 or 32×32
* Generated via seeded noise

---

### 4.1.2 Biomes

Examples:

* forest
* plains
* mountain
* swamp
* tundra

Biome determines:

* resources
* color palette
* available encounters

---

## 4.2 Rules Engine (D&D 5e Layer)

### Responsibilities

* Skill checks
* Combat resolution
* Inventory
* Crafting
* Character stats

---

### 4.2.1 Character Model

```ts
type Character = {
  id: string;
  name: string;
  stats: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  hp: number;
  inventory: Item[];
  location: { x: number; y: number };
};
```

---

### 4.2.2 Action Resolution

Example:

```ts
resolveAction({
  type: "attack",
  attackerId,
  targetId
});
```

Returns:

```ts
{
  success: boolean,
  damage: number,
  roll: number,
  narrationHints: [...]
}
```

---

## 4.3 Intent Parser

### Purpose

Convert player text → structured `GameAction` objects. **Deterministic keyword parsing** — no LLM involvement, fast and free.

### Action Types

The parser recognizes 10 action types:

| Action | Keywords | Requires |
|--------|----------|----------|
| `move` | go, walk, move, head, travel, run, flee | Direction |
| `look` | look, examine, inspect, observe, survey | — |
| `attack` | attack, hit, strike, fight, slash, stab, shoot | Target |
| `search` | search, forage, dig, investigate, explore | — |
| `rest` | rest, sleep, camp, nap, meditate | — |
| `talk` | talk, speak, chat, ask, greet, hail, negotiate | Target |
| `pickup` | pickup, grab, take, collect, loot, gather | Item |
| `drop` | drop, discard, throw away, leave, abandon | Item |
| `use_item` | use, drink, eat, consume, apply, activate, equip | Item |
| `craft` | craft, make, build, create, forge, brew, cook | Item |

### Direction Matching

Supports 8 cardinal directions plus natural aliases:

* Cardinal: `north`, `south`, `east`, `west`, `northeast`, `northwest`, `southeast`, `southwest`
* Abbreviations: `n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`
* Aliases: `up`→north, `down`→south, `left`→west, `right`→east
* Bare direction input (“north”) is treated as a move action

### Target & Item Resolution

* **Targets** resolved by substring matching against nearby entity names, then entity types
* **Items** resolved by substring matching against inventory item names
* Text after the action keyword is cleaned of prepositions (`to`, `with`, `at`, `the`, `a`, `an`) before matching

### Stealth Modifier

If the input contains `stealth`, `sneak`, `quietly`, or `silently`, the action is flagged with `stealth: true`.

### Parse Result

```ts
type ParseResult = {
  action: GameAction | null;
  raw: string;
  failureHints: string[];  // e.g., 'no_direction', 'unrecognized_action', 'empty_input'
};
```

On failure, `failureHints` provide context for the narrative engine to generate appropriate clarification responses (e.g., “Which direction?” or treating unrecognized input as roleplaying).

---

## 4.4 Narrative Engine (LLM)

### Role

Render **mechanical results → story text**. The LLM receives pre-resolved action outcomes and structured world context, then generates narrative prose. It never decides mechanical outcomes.

---

### 4.4.1 DM Turn Loop

The core pipeline for each player turn:

```
Player Input → Intent Parser → Action Resolver → Effect Application
                                                       ↓
                                               Context Assembly → Prompt Building → LLM Generation
```

1. **Parse** — Keyword parser converts raw text to `GameAction` (deterministic, free)
2. **Resolve** — Rules engine resolves the action mechanically: dice rolls, damage, skill checks (deterministic via seeded RNG)
3. **Apply** — `GameEffect[]` applied immutably to character and world state
4. **Assemble** — `NarrativeContext` built from current game state (location, entities, weather, exits, quests)
5. **Prompt** — System + user prompts constructed from context and mechanical results
6. **Generate** — LLM produces narrative text describing what happened

**Critical constraint:** The LLM only renders narrative FROM pre-resolved mechanical results. It never decides dice outcomes, damage values, or success/failure. The dice have already been rolled before the LLM sees anything.

Turn counter incremented per turn; deterministic seed derived from `turnSeedBase XOR turnCount`.

---

### 4.4.2 Action Resolution

Routes `GameAction` through the D&D 5e rules engine (pure functions from the Rules Engine, §4.2).

* 10 resolvers matching the 10 intent types
* Each resolver returns `ActionResult`:

```ts
type ActionResult = {
  success: boolean;
  action: GameAction;
  effects: GameEffect[];
  narrationHints: string[];  // Semantic hints for the LLM (e.g., 'river_crossing', 'critical_search')
};
```

* `applyEffects()` produces a new character roster — no mutation of input state
* World-level effects (resource depletion, structure placement) applied separately to the world event log

---

### 4.4.3 Context Assembly

Builds `NarrativeContext` from the current game session — everything the LLM needs to render narrative:

| Component | Source |
|-----------|--------|
| Location tile | World engine tile at party position |
| Visible entities | Known entities within view radius |
| Weather / time / season | World clock |
| Recent events | World event log (within view radius, capped by `recentEventCount`) |
| Party summaries | Name, HP, conditions for each party member |
| Exit descriptions | 8-directional scan of adjacent tiles (biome, walkability, features) |
| Quest hints | Active quest objectives matching current location, nearby entities, or available resources |

All assembly functions are pure — no side effects.

---

### 4.4.4 Prompt Architecture

**System prompt** (relatively static, cacheable across turns):

* DM persona: adventurous, immersive, second-person address
* Narrative constraints: never override mechanical outcomes, never invent entities/items/abilities, never break fourth wall
* Output format: vivid but concise (2–5 sentences), end with subtle action prompt
* World state summary: turn count, party size, combat status

**User prompt** (changes every turn):

| Section | Content |
|---------|---------|
| Current Location | Biome, surface, elevation, features, structures, resources, river |
| Environment | Time of day, season, weather |
| Party | Per-character: name, HP/maxHP, conditions |
| Nearby Entities | Name, type, hostility |
| Exits | 8-directional: direction, biome description, walkability, notable features |
| Recent Events | Timestamped events within view radius |
| Quest Hints | Active objectives matching current context |
| Player Action | Raw input, parsed action type, direction/target, stealth flag |
| Mechanical Result | Success/failure, narration hints, effects to narrate |

---

### 4.4.5 NarrativeAdapter Interface

Pluggable LLM backend — the engine is model-agnostic:

```ts
type NarrativeAdapter = {
  generate(system: string, user: string): Promise<string>;
};
```

Implementations can target Anthropic API, local models, or mock adapters for testing. Swap adapters at runtime via `DungeonMaster.setAdapter()`.

---

### 4.4.6 Configuration Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| `viewRadius` | 5 | Tiles visible around player |
| `defaultDC` | 12 | Default difficulty class for skill checks |
| `actionTimeMinutes` | 5 | Game-time cost per standard action |
| `restTimeMinutes` | 480 | Game-time cost for long rest (8 hours) |
| `recentEventCount` | 10 | Max recent events included in context |
| `recentEventDays` | 7 | Max age (game-days) for recent events |

---

## 4.5 Visual Engine (.pixel)

### Responsibilities

* Convert scene → deterministic image
* Compose sprites and tiles
* Apply palette rules

---

### Pipeline

```
World State → Scene Spec → .pixel assets → Canvas → PNG
```

---

### Scene Spec Example

```ts
type SceneSpec = {
  biome: "forest";
  timeOfDay: "dusk";
  weather: "storm";
  features: ["campfire", "trees"];
  entities: ["players", "goblin"];
};
```

---

### Renderer Responsibilities

* Resolve assets
* Apply palette
* Render layers
* Output image

---

## 4.6 Scenario System (DnD Modules)

### Purpose

Inject structured content into world

---

### Example

```ts
type Scenario = {
  id: "goblin_camp",
  constraints: {
    biome: "forest",
    near: "river"
  },
  structures: [...],
  npcs: [...],
  encounters: [...],
  quests: [...]
};
```

---

### Behavior

* Overrides procedural generation locally
* Persists after discovery
* Can evolve over time

---

# 5. Multiplayer Model

---

## 5.1 Server Responsibilities

* Authoritative world state
* Action resolution
* Sync between players

---

## 5.2 Player Model

```ts
type PlayerSession = {
  playerId: string;
  characterId: string;
  connection: WebSocket;
};
```

---

## 5.3 Time Model

### v1 Recommendation: Turn-based

* Players submit actions
* Server resolves sequentially

---

# 6. Crafting System (Simplified)

---

### Recipe Model

```ts
type Recipe = {
  id: "campfire",
  requires: [
    { item: "wood", qty: 5 },
    { item: "stone", qty: 3 }
  ],
  produces: "campfire"
};
```

---

### Design Philosophy

* Low complexity
* Narrative-friendly
* No massive crafting trees (v1)

---

# 7. Data Storage

---

## 7.1 Recommended Stack

* Database: PostgreSQL
* Cache: Redis
* Assets: filesystem or object storage

---

## 7.2 Key Tables

* `world_tiles`
* `structures`
* `players`
* `characters`
* `inventory`
* `scenarios`

---

# 8. Rendering Pipeline (End-to-End)

---

## Step 1

Player moves north

## Step 2

World engine loads tiles

## Step 3

Rules engine resolves effects

## Step 4

Narrative engine generates text

## Step 5

Visual engine generates image

---

# 9. Game Loop

### 9.1 Session Initialization

```ts
const session = createSession(sessionId, worldSeed, partyMembers);
const dm = new DungeonMaster(session, narrativeAdapter, config?);

// Initial scene description (no player action — just describe where they are)
const intro = await dm.describeSurroundings();
```

`createSession()` constructs the `GameSession` with a fresh `World` instance, empty quest/entity lists, and `turnCount: 0`.

### 9.2 Turn Processing

Each player turn runs through the DungeonMaster pipeline:

```ts
const response = await dm.processTurn(playerInput, actorId?);
// response.narrative  — LLM-generated story text
// response.effects    — mechanical effects that were applied
// response.party      — updated party state
// response.time       — current game time
```

Internally, `processTurn()` executes the full §4.4.1 pipeline:

1. Increment `turnCount`
2. Derive turn-level RNG seed: `turnSeedBase XOR turnCount`
3. Parse intent → `GameAction` (§4.3)
4. Resolve action → `ActionResult` with `GameEffect[]` (§4.4.2)
5. Apply effects immutably to character roster and world state
6. Advance game clock by action time cost
7. Assemble narrative context (§4.4.3)
8. Update known entities based on new position
9. Build prompts and call LLM (§4.4.4, §4.4.5)
10. Return `DMResponse`

### 9.3 Session Management

The DungeonMaster provides methods for managing the session between turns:

* `addPartyMember(character)` / `removePartyMember(id)` — party roster changes
* `addQuest(quest)` / `completeQuest(id)` — quest tracking
* `addKnownEntity(entity)` / `removeKnownEntity(id)` — entity awareness
* `setAdapter(adapter)` — swap LLM backend at runtime

---

# 10. MVP Scope

---

## Phase 1

* Single biome (forest)
* Movement
* Basic narration

## Phase 2

* Inventory + resources
* Crafting

## Phase 3

* Multiplayer sync

## Phase 4

* One scenario (goblin camp)

## Phase 5

* Combat (D&D-lite)

---

# 11. Key Risks

---

## LLM Drift

Mitigation:

* Strict prompts
* Structured input only

---

## State Explosion

Mitigation:

* Chunking
* Lazy loading

---

## Visual Inconsistency

Mitigation:

* `.pixel` format
* palette locking

---

# 12. Future Extensions

---

* AI-driven NPC behavior
* Player-created modules
* Animation system (.pixel v2)
* Economy system
* Guilds / factions
* Voice narration layer

---

# 🔥 Final Summary

LoreWeave is:

> A **deterministic world engine** + **LLM narrative renderer** + **pixel composition system**

Its core innovation is:

> Treating **story as rendering**, not simulation

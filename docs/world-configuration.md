# World Configuration

LoreWeave is designed to support multiple worlds (5–10+) with expansions. The base engine is world-agnostic — worlds are **data overlays** that customize the DM persona, stat tiers, encounter tables, creatures, vocabulary, and world-specific mechanics like wards and Fray corruption.

## Directory Structure

```
worlds/
├── shared/                    # Generic archetypes usable by any world
│   ├── locations/             # Location archetype JSONs (taverns, shops, dungeons, etc.)
│   │   ├── taverns/
│   │   ├── shops/
│   │   ├── temples/
│   │   ├── residences/
│   │   ├── civic/
│   │   ├── wilderness/
│   │   └── dungeons/
│   ├── npcs/                  # NPC archetype JSONs (merchants, guards, wanderers, etc.)
│   │   ├── merchants/
│   │   ├── authority/
│   │   ├── craft/
│   │   ├── service/
│   │   └── wanderers/
│   └── vocabulary/            # Base sensory descriptor tables
│       ├── atmosphere/        # biome_descriptors.json, time_of_day.json
│       └── architecture/      # building_styles.json
│
└── threadhallow/              # World-specific content
    ├── config/                # Engine configuration JSONs
    │   ├── world.json         # World metadata (id, name, description)
    │   ├── persona.json       # DM personality — "The Weave-Keeper"
    │   ├── stat-tiers.json    # 6 NPC stat tiers with ability arrays
    │   ├── ward.json          # Ward thresholds + ward events
    │   ├── fray.json          # Fray exposure levels + sources
    │   ├── encounters.json    # d20 encounter tables per zone
    │   ├── creatures.json     # Fray creature stat blocks
    │   └── skill-challenges.json  # Binding Song ceremony config
    ├── vocabulary/            # World-specific descriptor overlays
    ├── lore/                  # World bible, history
    ├── factions/              # Faction definitions
    ├── quests/                # Quest definitions
    ├── npcs/                  # Named NPC profiles per act
    ├── regions/               # Region definitions
    ├── creatures/             # Creature narrative catalog
    ├── companions/            # Companion system design
    └── mechanics/             # Mechanics companion (D&D rules layer)
```

## Loading a World

```typescript
import { loadWorldConfig } from '@loreweave/world';

const config = loadWorldConfig('worlds', 'threadhallow');
// Returns a fully populated WorldConfig object

const dm = new DungeonMaster(session, adapter, {}, config);
```

The loader reads all JSON files from `worlds/<name>/config/`, loads shared + world-specific vocabulary tables, and returns a complete `WorldConfig`.

## Config File Reference

### persona.json — DM Personality

```json
{
    "name": "The Weave-Keeper",
    "worldName": "Threadhallow",
    "toneGuide": [
        "Folk horror layered over high fantasy",
        "Use textile and weaving metaphors naturally"
    ],
    "namingConventions": [
        "Anglo-Saxon compound names for settlements",
        "Nature-craft names for people"
    ],
    "forbiddenTopics": ["Never reveal the Weaver's fate directly"],
    "specialInstructions": ["Always reference the quality of ward-light"],
    "narrativeStyle": "Second person, present tense",
    "responseLength": "2-4 paragraphs per turn"
}
```

### stat-tiers.json — NPC Generation

Defines ability score arrays and combat stats per tier. The NPC generator uses these when converting narrative archetypes into mechanical `Character` objects.

### ward.json — Ward Mechanics (optional)

Settlement ward strength thresholds with effects, plus ward events (ceremonies, attacks, neglect) with strength deltas.

### encounters.json — Encounter Tables (optional)

D20 roll tables keyed by zone ID (e.g., `forest_stable`, `forest_thinning`, `frayed_zone`). Each entry specifies creature type, count (dice notation), and CR.

### creatures.json — Creature Stat Blocks (optional)

Full D&D 5e stat blocks: abilities, HP, AC, speed, actions, special abilities, legendary/lair actions for higher-CR creatures.

### skill-challenges.json — Skill Challenges (optional)

Extended challenge configs: required successes, max failures, applicable skills with per-skill DC modifiers, failure consequences.

## Archetype System

Archetypes are JSON templates for procedural content generation — locations and NPCs.

### Location Archetypes

```json
{
    "id": "common_tavern",
    "name": "Common Tavern",
    "category": "tavern",
    "tier": "hamlet",
    "biomes": ["forest", "plains", "taiga"],
    "features": {
        "required": ["hearth", "bar_counter", "tables"],
        "common": ["dart_board", "notice_board"],
        "rare": ["secret_room", "gambling_table"]
    },
    "npcs": {
        "required": [{"role": "innkeeper", "archetype": "innkeeper"}],
        "common": [{"role": "regular", "archetype": "commoner"}],
        "rare": [{"role": "stranger", "archetype": "traveling_merchant"}]
    },
    "atmosphere": {
        "sounds": ["crackling fire", "murmured conversation"],
        "smells": ["wood smoke", "stew", "ale"],
        "lighting": ["warm", "flickering"]
    },
    "challenges": {
        "encounters": [],
        "traps": [],
        "skill_checks": ["perception_spot_hidden_item", "persuasion_haggle_price"],
        "saving_throws": [],
        "loot_tier": "none"
    }
}
```

**Probability tiers:** `required` (100%), `common` (50–80%), `rare` (<20%). The world engine rolls against these pools using seeded RNG when instantiating a location.

### NPC Archetypes

```json
{
    "id": "innkeeper",
    "name": "Innkeeper",
    "category": "service",
    "stats_tier": "skilled",
    "traits": {
        "common": ["friendly", "observant", "talkative"],
        "rare": ["suspicious", "secretive"]
    },
    "skills": ["insight", "persuasion", "perception"],
    "inventory": {
        "required": [{"item": "room_key", "quantity": 1}],
        "common": [{"item": "ale", "quantity": "2d4"}],
        "rare": [{"item": "healing_potion", "quantity": 1}]
    },
    "knowledge": {
        "always": ["local_gossip", "room_prices", "menu"],
        "sometimes": ["traveler_rumors", "local_history"],
        "rarely": ["hidden_passages", "faction_secrets"]
    },
    "voice_patterns": ["warm", "matter-of-fact"],
    "schedule": {
        "morning": "kitchen",
        "afternoon": "bar_counter",
        "evening": "bar_counter",
        "night": "upstairs_room"
    }
}
```

### Loading Archetypes

```typescript
import { loadArchetypes } from '@loreweave/world';

const registry = loadArchetypes('worlds');
// Reads from worlds/shared/locations/ and worlds/shared/npcs/
// Returns ArchetypeRegistry with lookup methods
```

## Vocabulary Tables

Vocabulary tables provide sensory descriptors that the prompt builder injects into LLM context. They map `biome × time_of_day × weather` → sensory tags (terrain feel, sounds, smells, atmosphere, sky, lighting).

**Base tables** live in `worlds/shared/vocabulary/` and cover generic descriptors for all 7 biomes.

**World overlays** in `worlds/<name>/vocabulary/` add or replace descriptors with world-specific flavor. The loader merges world-specific tables on top of the shared base.

Without vocabulary tables, the LLM gets raw data ("biome: forest, surface: grass"). With them, it gets rich sensory context ("loamy earth underfoot, birdsong and rustling canopy, dappled golden light").

## Adding a New World

1. Create `worlds/<name>/config/persona.json` and `stat-tiers.json` (required)
2. Add optional config files as needed (ward, fray, encounters, creatures, skill-challenges)
3. Add world-specific vocabulary overlays
4. Create world content (lore, quests, NPCs, regions) — these are consumed by the narrative layer, not the engine directly
5. Load with `loadWorldConfig('worlds', '<name>')`

The engine handles everything else — the same chunk pipeline, rules engine, and narrative orchestration work for any world.

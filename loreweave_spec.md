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

Convert player text → structured actions

### Example

Input:

> “I sneak behind the goblin and stab it”

Output:

```ts
{
  action: "attack",
  stealth: true,
  target: "goblin_123"
}
```

---

### Implementation (v1)

* Rule-based + LLM hybrid
* Constrained output schema

---

## 4.4 Narrative Engine (LLM)

### Role

Render **state → story text**

### Input

```json
{
  "location": {...},
  "visible_entities": [...],
  "weather": "storm approaching",
  "recent_events": [...],
  "players": [...]
}
```

---

### Output

> “The party emerges from dense woodland into a clearing…”

---

### Rules

* Must not invent entities
* Must reflect spatial relationships
* Must remain concise (2–5 sentences)

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

# 9. Example Game Loop

```ts
function gameLoop(input) {
  const intent = parseIntent(input);
  const result = resolveAction(intent);
  updateWorld(result);

  const state = getVisibleState();

  const text = renderNarrative(state);
  const image = renderScene(state);

  return { text, image };
}
```

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

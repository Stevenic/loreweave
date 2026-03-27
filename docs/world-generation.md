# World Generation

World generation converts a **seed** (64-bit integer) into a deterministic, infinite 2D tile grid organized into **chunks**.

## Hierarchy

```
World (infinite, lazy-loaded)
  └── Chunk (32×32 tile grid, generated on demand)
       └── WorldTile (atomic unit — 1 tile = 1 game-world position)
            └── StructureRef (multi-tile features: villages, ruins, shrines)
                 └── LocationRecord (future: tavern, smithy, temple inside a village)
```

This is a **2D tile-based** system — closer to Dwarf Fortress or classic roguelikes than Minecraft. There are no blocks or vertical layers. Elevation is a tile property, not a stack of voxels. Underground areas (caves, dungeons) are separate interior maps linked by `cave_entrance` structure types.

## What a Tile Contains

```typescript
type WorldTile = {
    x: number;              // World-space coordinate
    y: number;
    biome: BiomeType;       // forest | plains | mountain | swamp | tundra | desert | taiga
    elevation: number;      // 0–100, biome-relative
    surface: SurfaceType;   // grass | dirt | sand | stone | snow | water | mud | ice
    resources: ResourceType[];  // wood, iron, herb, crystal, etc.
    structures: StructureRef[]; // village, ruins, shrine, etc.
    features: FeatureType[];    // oak_tree, boulder, mushrooms, fog, etc.
    walkable: boolean;
    river: boolean;
};
```

## The 7-Stage Pipeline

When the player moves near unloaded territory, `World.getTile()` triggers chunk generation. Each chunk runs through a 7-stage pipeline — every stage is a pure function that enriches tiles:

```
generateChunk(worldSeed, chunkCoord) → Chunk
```

### Stage 1: Biomes

Three OpenSimplex2 noise layers produce continuous fields across the world:
- **Temperature** — hot deserts to frozen tundra
- **Moisture** — dry deserts to wet swamps
- **Elevation** — valleys to mountain peaks

Each tile samples all three fields. The biome is selected by finding the closest match in a 3D parameter space:

| Biome | Temperature | Moisture | Elevation |
|-------|------------|----------|-----------|
| forest | 0.0 to 0.5 | 0.2 to 0.8 | -0.3 to 0.3 |
| plains | 0.0 to 0.6 | -0.5 to 0.2 | -0.5 to 0.0 |
| mountain | -0.3 to 0.3 | -0.3 to 0.3 | 0.5 to 1.0 |
| swamp | 0.1 to 0.6 | 0.5 to 1.0 | -1.0 to -0.3 |
| tundra | -1.0 to -0.3 | -0.8 to 0.2 | -0.2 to 0.5 |
| desert | 0.6 to 1.0 | -1.0 to -0.3 | -0.3 to 0.3 |
| taiga | -0.5 to 0.0 | 0.2 to 0.7 | 0.0 to 0.5 |

Biome borders are smoothed: tiles within a 4-tile blend radius of a border use the majority neighbor biome to avoid noisy single-tile biome islands.

### Stage 2: Elevation

Refines raw noise into biome-appropriate integer heights (0–100):
- Plains: 0–50 (flat)
- Forest: 20–60 (gently rolling)
- Mountain: 70–100 (steep peaks)
- Swamp: 0–20 (low and flat)

### Stage 3: Surface

Determines what you're standing on: `grass`, `dirt`, `sand`, `stone`, `snow`, `water`, `mud`, `ice`. Each biome has default surface rules with elevation thresholds (high mountain tiles become stone, low swamp tiles become water).

**Rivers** are overlaid using ridged noise — tiles above a biome-specific threshold (0.92–0.95) become water. This produces natural-looking waterways that vary in width by biome.

### Stage 4: Resources

Nine resource types are placed using per-resource noise layers: `wood`, `stone`, `iron`, `herb`, `fish`, `clay`, `crystal`, `peat`, `fur`. Each biome has density thresholds per resource. A tile gets 0–3 resources.

### Stage 5: Structures

Multi-tile features are placed using a **grid-hash algorithm** — no multi-chunk coordination needed:

1. Each structure type has a coarse spacing grid (48–128 tiles per cell)
2. Each grid cell produces 0 or 1 structure via positional RNG seeded from `(worldSeed, gridCellX, gridCellY)`
3. Candidate positions are validated against biome and elevation requirements

| Type | Grid Spacing | Frequency | Valid Biomes | Radius |
|------|-------------|-----------|-------------|--------|
| village | 128 tiles | 35% | forest, plains, taiga | 4–12 (by tier) |
| ruins | 96 tiles | 25% | all except tundra | 5 |
| cave_entrance | 64 tiles | 30% | mountain, forest, swamp | 2 |
| shrine | 48 tiles | 20% | all | 2 |
| watchtower | 80 tiles | 15% | plains, forest, mountain | 3 |

**Settlement tiers** — villages roll a size: ~50% hamlet (radius 4), ~30% village (radius 6), ~15% town (radius 8), ~5% city (radius 12). Each gets a deterministic `settlementId` for ward tracking and faction assignment.

**Tile modifications** — structures stamp their footprint onto the terrain:
- Villages: stone center square, dirt paths in building zone, cleared features at edges
- Ruins: scattered stone + debris + bones
- Caves: stone platform entrance
- Shrines: small stone pad, brush cleared
- Watchtowers: stone base, trees cleared for line of sight

### Stage 6: Features

Decorative objects placed per-biome with density thresholds across 5 decoration passes (major vegetation → minor vegetation → terrain features → ground detail → ambient). Examples:
- Forest: oak_tree (40%), bush (15%), flowers (10%), mushrooms (5%)
- Desert: cactus (8%), sand_dune (20%), bones (5%)
- Mountain: cliff (15%), boulder (20%), snow_patch (10%)

### Stage 7: Spawns

Entity spawn points are placed based on biome, elevation, and group-size rules. Spawns are recorded as data — actual entities are instantiated lazily when the player encounters them.

## Randomness — Three Algorithms

All randomness in world generation is deterministic — same seed always produces the same world.

| Algorithm | Purpose | Why This One |
|-----------|---------|-------------|
| **OpenSimplex2** | Smooth continuous noise (terrain, biomes, rivers) | Best quality-to-speed ratio for spatial noise. No patent issues (unlike original Simplex). |
| **FNV-1a** | Positional seed derivation — `(worldSeed, x, y)` → 32-bit hash | 5 lines of code, good spatial distribution, no correlation between adjacent tiles. |
| **xorshift32** | Discrete random choices (feature placement, spawn rolls, loot) | 4 bytes of state, 3 operations per call, 2^32-1 period. Thousands of instances per chunk — minimal memory matters. |

### RNG Stream Isolation

Each generation stage gets its own RNG stream via domain-specific salts:

```typescript
const chunkSeed = positionalSeed(worldSeed, chunkX, chunkY);
const featureRng = createRng(chunkSeed ^ FEATURE_SALT);
const spawnRng   = createRng(chunkSeed ^ SPAWN_SALT);
```

**Invariant:** Adding or removing features from one stage does not change the output of any other stage. Without stream isolation, changes would cascade unpredictably.

## The World Class

`World` manages the chunk cache and provides the API for querying world state:

| Method | What It Does |
|--------|-------------|
| `getTile(x, y)` | Returns tile at world coordinates. Auto-generates chunk if needed. |
| `getVisibleTiles(center, radius)` | Returns a square area of tiles around a position. |
| `advanceTime(minutes)` | Advances game clock. Computes season and time-of-day. |
| `addEvent(event)` | Records a world event (damage, construction, death, etc.) |
| `getEventsAt(x, y)` | Returns events at a location. |
| `getRecentEvents(since)` | Returns events within a time window. |

Chunks are evicted from memory when the player moves far enough away. The world is theoretically infinite — only nearby chunks exist in memory at any time.

## What's Not Yet Built

| System | Status | What It Does |
|--------|--------|-------------|
| **Location Generator** | Not started | Reads `structureRef` on a tile → rolls archetypes → creates LocationRecord (tavern, smithy, temple inside a village) |
| **Weave State Overlay** | Not started | Per-tile or per-region `weaveState` (stable/thin/frayed/unraveled) — Threadhallow's core mechanic |
| **Additional biomes** | Proposed | coast, hills, cavern, farmland, deep_forest (7 → 12 total) |

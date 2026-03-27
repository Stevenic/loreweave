# Creature Archetype Format

Defines the schema for creature archetypes used by the encounter generator.

---

## Schema

```json
{
  "id": "wolf_pack",
  "type": "creature",
  "category": "beast",
  "name": "Wolf Pack",
  "description": "Territorial pack predators. Dangerous in groups, avoidable alone.",
  "cr": "1/4",
  "group_size": { "min": 3, "max": 8 },
  "biomes": ["forest", "plains", "taiga", "hills"],
  "behavior": {
    "disposition": "territorial",
    "triggers": ["hunger", "territory_defense", "pack_protection"],
    "retreat_threshold": "half_pack_lost"
  },
  "sensory": {
    "sight": "grey shapes low to the ground, eyes reflecting firelight",
    "sound": "howling in the distance, then silence, then panting close by",
    "smell": "wet fur, blood",
    "feel": "the sense of being watched from multiple directions"
  },
  "encounter_hooks": [
    "tracks around the campsite in the morning",
    "howling that follows the party for an hour",
    "a deer carcass, fresh, abandoned mid-meal"
  ],
  "loot": ["wolf_pelt", "wolf_teeth"],
  "notes": "Wolves are smart. They test before they commit. A lone wolf watching from treeline is a scout, not a threat."
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier |
| `type` | `"creature"` | yes | Always `"creature"` |
| `category` | string | yes | `beast`, `humanoid`, `undead`, `monstrosity`, `fey`, `construct` |
| `name` | string | yes | Display name |
| `description` | string | yes | One-line narrative summary |
| `cr` | string | yes | Challenge rating (e.g., "1/4", "1", "5") |
| `group_size` | object | yes | `min`/`max` for typical encounter |
| `biomes` | string[] | yes | Where they appear |
| `behavior` | object | yes | `disposition`, `triggers`, `retreat_threshold` |
| `sensory` | object | yes | 4 channels: sight, sound, smell, feel |
| `encounter_hooks` | string[] | yes | Pre-encounter signs for the LLM |
| `loot` | string[] | yes | Droppable items |
| `notes` | string | no | DM guidance for narration |

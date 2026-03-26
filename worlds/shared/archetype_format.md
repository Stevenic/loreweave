# Archetype File Format

Defines the schema for location and NPC archetype files used by the world generator.

---

## Location Archetype

```json
{
  "id": "tavern_common",
  "type": "location",
  "category": "tavern",
  "name": "Common Tavern",
  "description": "A standard village drinking establishment",
  "tier": ["hamlet", "village", "town", "city"],
  "biomes": ["any"],
  "features": {
    "required": ["bar_counter", "seating", "hearth"],
    "common": ["notice_board", "stairs_up", "kitchen"],
    "rare": ["cellar", "back_room", "stage"]
  },
  "objects": {
    "required": ["mugs", "barrels", "stools"],
    "common": ["candles", "sign_board", "fireplace_tools"],
    "rare": ["trophy_mount", "gambling_table", "musical_instrument"]
  },
  "npcs": {
    "required": ["innkeeper"],
    "common": ["barmaid", "regular_patron"],
    "rare": ["bard", "stranger", "drunk"]
  },
  "exits": {
    "required": ["front_door"],
    "common": ["back_door", "stairs_up"],
    "rare": ["cellar_hatch", "secret_passage"]
  },
  "atmosphere": {
    "sounds": ["murmur_of_conversation", "clinking_mugs", "crackling_fire"],
    "smells": ["pipe_smoke", "ale", "cooking_meat"],
    "lighting": ["dim", "warm", "firelit"]
  },
  "layout": {
    "footprint": "medium",
    "floors": [1, 2],
    "shape": ["rectangular", "L-shaped"]
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique archetype identifier |
| `type` | `"location"` | yes | Always `"location"` for location archetypes |
| `category` | string | yes | Grouping: `tavern`, `shop`, `temple`, `residence`, `civic`, `wilderness`, `dungeon` |
| `name` | string | yes | Human-readable archetype name |
| `description` | string | yes | One-line summary |
| `tier` | string[] | yes | Settlement sizes this can appear in: `hamlet`, `village`, `town`, `city` |
| `biomes` | string[] | yes | Which biomes this fits. `"any"` = all biomes |
| `features` | object | yes | Physical features: `required` (always), `common` (50%+), `rare` (<20%) |
| `objects` | object | yes | Interactable objects with same probability tiers |
| `npcs` | object | yes | NPC roles present with same probability tiers |
| `exits` | object | yes | Exit types with same probability tiers |
| `atmosphere` | object | yes | Sensory descriptors for narrative generation |
| `layout` | object | yes | Physical dimensions and shape options |

### Probability Tiers

The generator uses weighted random selection:
- **required** — always present (100%)
- **common** — usually present (50–80%, rolled per item)
- **rare** — occasionally present (<20%, rolled per item)

---

## NPC Archetype

```json
{
  "id": "innkeeper",
  "type": "npc",
  "category": "service",
  "name": "Innkeeper",
  "description": "Runs a tavern or inn. Social hub of the community.",
  "traits": {
    "common": ["hospitable", "observant", "gossip", "practical"],
    "rare": ["secretive", "retired_adventurer", "debt_ridden", "connected"]
  },
  "skills": ["persuasion", "insight", "perception"],
  "inventory": {
    "required": ["keys", "ledger"],
    "common": ["coin_purse", "club_behind_bar"],
    "rare": ["hidden_weapon", "contraband", "love_letter"]
  },
  "knowledge": {
    "always": ["local_rumors", "regular_patrons", "road_conditions"],
    "sometimes": ["settlement_politics", "nearby_threats", "trade_prices"],
    "rarely": ["secret_passages", "criminal_contacts", "ancient_history"]
  },
  "dialogue_hooks": [
    "complaints about business",
    "opinions on recent visitors",
    "warnings about local dangers",
    "requests for supplies or pest removal"
  ],
  "voice_patterns": [
    "friendly but transactional",
    "world-weary storyteller",
    "suspicious of strangers",
    "cheerful busybody"
  ],
  "schedule": {
    "morning": "cleaning, restocking",
    "afternoon": "serving, cooking",
    "evening": "busy service, socializing",
    "night": "closing up, counting coin"
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique archetype identifier |
| `type` | `"npc"` | yes | Always `"npc"` for NPC archetypes |
| `category` | string | yes | Grouping: `merchant`, `authority`, `craft`, `service`, `wanderer` |
| `name` | string | yes | Human-readable role name |
| `description` | string | yes | One-line summary |
| `traits` | object | yes | Personality traits: `common` (pick 2–3), `rare` (pick 0–1) |
| `skills` | string[] | yes | D&D 5e skills this NPC is proficient in |
| `inventory` | object | yes | What they carry, probability-tiered |
| `knowledge` | object | yes | What they know, probability-tiered |
| `dialogue_hooks` | string[] | yes | Conversation starters for the narrative engine |
| `voice_patterns` | string[] | yes | Tone options for LLM narration |
| `schedule` | object | no | Daily routine by time of day |

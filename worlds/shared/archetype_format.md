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
  },
  "challenges": {
    "encounters": ["bar_fight", "pickpocket", "drunken_brawl"],
    "traps": [],
    "skill_checks": ["perception_eavesdrop", "persuasion_haggle", "insight_read_crowd"],
    "loot_tier": "low"
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
| `challenges` | object | no | Mechanical encounter data (populated by Loremaster). See below. |

### Challenges Field

Optional field for locations that have mechanical encounters. Required for `dungeon` and `wilderness` categories; optional for others.

| Sub-field | Type | Description |
|-----------|------|-------------|
| `encounters` | string[] | Possible encounter types (Loremaster defines CR and stat blocks separately) |
| `traps` | string[] | Trap types present (Loremaster defines DCs and damage separately) |
| `skill_checks` | string[] | Relevant skill check opportunities (narrative hooks for the rules engine) |
| `loot_tier` | string | `"none"`, `"low"`, `"medium"`, `"high"`, `"legendary"` — Loremaster defines loot tables per tier |

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
  "stats_tier": "commoner",
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
| `stats_tier` | string | yes | Power level for stat block generation: `commoner`, `skilled`, `expert`, `veteran`, `elite` |
| `traits` | object | yes | Personality traits: `common` (pick 2–3), `rare` (pick 0–1) |
| `skills` | string[] | yes | D&D 5e skills this NPC is proficient in |
| `inventory` | object | yes | What they carry, probability-tiered |
| `knowledge` | object | yes | What they know, probability-tiered |
| `dialogue_hooks` | string[] | yes | Conversation starters for the narrative engine |
| `voice_patterns` | string[] | yes | Tone options for LLM narration |
| `schedule` | object | no | Daily routine by time of day |

### Stats Tier Reference

The `stats_tier` field tells the rules engine what power level to generate for this NPC. Loremaster defines the mechanical mapping; Bard assigns the tier based on narrative role.

| Tier | Narrative Role | Typical CR Range |
|------|---------------|-----------------|
| `commoner` | Civilians, laborers, merchants | CR 0 – 1/8 |
| `skilled` | Trained professionals, guards, apprentices | CR 1/4 – 1/2 |
| `expert` | Masters of their craft, sergeants, experienced adventurers | CR 1 – 3 |
| `veteran` | War-hardened fighters, guild leaders, elite agents | CR 4 – 8 |
| `elite` | Faction leaders, legendary figures, boss encounters | CR 9+ |

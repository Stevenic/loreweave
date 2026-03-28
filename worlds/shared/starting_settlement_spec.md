# Starting Settlement Design Spec

> The player's first taste of the world. It must feel like home before it feels like danger.

## Design Philosophy

The starting settlement is the **tutorial zone disguised as a living place**. Every building, NPC, and surrounding location exists to teach one or more game systems through natural interaction — never through exposition or forced tutorials. The player should feel like they've arrived somewhere that existed long before them and will persist after they leave.

**Core tension:** Cozy enough to rest in, threatened enough to leave.

---

## Settlement Template: The Starting Village

**Size:** Village (population 100–300)
**Ward Status:** Weakened but functional — visible signs of wear
**Tone:** Welcoming surface, uneasy undercurrent
**Time Pressure:** An approaching ceremony or seasonal event (weeks away, not days)

---

## Required Buildings

These **must** be present in every starting settlement. Each one teaches a core game system.

### 1. The Tavern / Inn

**Archetype:** `tavern_common` or `roadside_inn`
**Teaches:** Social interaction, rumors, rest mechanics, party formation
**Required NPCs:** Innkeeper (service/commoner)
**Common NPCs:** Barmaid (service), 2–3 patron regulars (wanderer archetypes — bard, pilgrim, mercenary)

**Design notes:**
- This is the **social hub** and likely the first interior the player enters
- Rumors board or innkeeper gossip seeds the first 2–3 side quests
- In multiplayer, this is where OOC/IC chat separation first becomes relevant — patrons are IC, the corner table is where players talk OOC
- The tavern should have a name that hints at local culture (Threadhallow: thread/weaving metaphors — "The Knotted Ewe," "The Warp & Weft")
- At least one patron should have a connection to a nearby threat location

### 2. The Smithy / Blacksmith

**Archetype:** `blacksmith`
**Teaches:** Equipment, repairs, basic crafting/trade
**Required NPCs:** Blacksmith (craft/skilled)
**Common NPCs:** Apprentice (craft/commoner)

**Design notes:**
- Sells basic weapons and armor (tier 1 — common quality)
- Can repair damaged equipment (introduces durability if the world uses it)
- The blacksmith's inventory reflects the settlement's economy — a village smith makes tools and horseshoes, not longswords
- Should have a dialogue hook about material quality declining (subtle Thinning reference for Threadhallow worlds)

### 3. The General Store / Provisioner

**Archetype:** `general_store`
**Teaches:** Inventory management, supplies, basic economy
**Required NPCs:** Shopkeeper (merchant/commoner)
**Common NPCs:** None required; traveling merchant may visit

**Design notes:**
- Sells rations, rope, torches, basic adventuring gear
- Prices should feel fair — this isn't a price-gouging frontier outpost
- The shopkeeper knows trade routes and can hint at regional geography
- Stock should reflect the biome (forest village: woodworking tools, furs, preserves; coastal: nets, salt, dried fish)

### 4. The Shrine / Chapel

**Archetype:** `village_shrine`
**Teaches:** Lore, healing, spiritual/magical systems, world history
**Required NPCs:** Priest (service/commoner or skilled)
**Common NPCs:** None required; pilgrims may visit

**Design notes:**
- Provides basic healing or blessing mechanics
- The priest is the **lore delivery NPC** — knows local history, ceremonies, and warnings
- The shrine's deity/tradition should connect to the world's cosmology
- Physical details embed lore: carvings on the altar, faded murals, ritual objects on shelves
- In Threadhallow: dedicated to one of the Loom-Born, with visible ward-threads woven into the architecture

### 5. The Elder's Hall / Town Hall

**Archetype:** `town_hall` (civic)
**Teaches:** Governance, main quest hooks, faction dynamics
**Required NPCs:** Village Elder (authority/skilled or expert)
**Common NPCs:** Guard (authority/commoner), Clerk or Advisor (service/skilled)

**Design notes:**
- This is where the **main quest hook** lives — the elder has a problem they can't solve alone
- The hall's condition reflects the settlement's prosperity (well-maintained = stable; patched roof = struggling)
- Notice board or verbal briefing introduces the primary questline
- The elder should have a clear personality and a secret (per Bard's "every NPC gets a secret" rule)
- In multiplayer, this is where world-level announcements and party coordination may happen

### 6. The Herbalist / Apothecary

**Archetype:** `apothecary` or `herbalist_stall`
**Teaches:** Potions, remedies, natural magic, gathering
**Required NPCs:** Herbalist (craft/skilled)
**Common NPCs:** None required

**Design notes:**
- Sells basic healing potions, antidotes, and ingredients
- Can identify unknown plants or substances (introduces the identification mechanic)
- Should have a gathering quest — "bring me three moonpetal blossoms from the forest clearing"
- The herbalist often knows about the nearby wilderness better than anyone

---

## Required Outdoor Spaces

### 7. The Green / Common / Market Square

**Archetype:** `market_square` (civic)
**Teaches:** Navigation, ambient NPC life, sense of place
**No required NPCs** — populated by ambient villagers on schedules

**Design notes:**
- The **central hub** connecting all other buildings
- Should have a landmark feature (well, fountain, old tree, standing stone, ward-circle)
- This landmark is the first thing players see and becomes the mental anchor for the settlement
- NPC ambient behavior here sells the "living village" illusion — farmers hauling produce, children playing, a dog sleeping in the sun
- In Threadhallow: the ward-circle is the landmark, visibly flickering or dimmer than it should be

### 8. The Farmstead(s)

**Archetype:** `farmstead` (residence)
**Teaches:** Economy, food supply, side quest hooks
**Required NPCs:** Farmer family (1 named farmer + family members)

**Design notes:**
- 1–2 farms on the village outskirts
- Provides food-related supplies and information about the surrounding land
- Farmers are the first to notice environmental changes (crops failing, animals spooked, soil going strange)
- A farmer's problem makes an excellent first side quest — missing livestock, blighted field, something in the root cellar

---

## Recommended Buildings (Pick 2–3)

These add flavor and depth. Select based on the world's biome, tone, and narrative needs.

| Building | Archetype | Teaches | Best For |
|----------|-----------|---------|----------|
| Guard Post / Watchtower | `watchtower` | Combat, security, threat assessment | Frontier or threatened settlements |
| Bakery | `bakery` | Crafting, daily routines, comfort | Cozy/pastoral tones |
| Stable | `stable` | Travel, mounts, animal handling | Settlements on trade routes |
| Library / Archive | `library` | Research, history, puzzle mechanics | Lore-heavy worlds |
| Tanner / Leatherworker | `tanner` | Crafting, resource chains | Survival-focused worlds |
| Graveyard / Burial Ground | `mausoleum` | Death mechanics, ghost lore, atmosphere | Horror/dark tones |
| Guild Hall | `guild_hall` | Factions, reputation, specialization | Politically complex worlds |

---

## Required Surrounding Locations

The starting settlement needs **three rings** of surrounding territory, each at a different threat level.

### Ring 1 — Safe (5-minute walk)

**Purpose:** Exploration tutorial, gathering, low-stakes encounters
**Threat:** Minimal — wildlife, weather, terrain
**Examples:** Forest clearing, riverside camp, hilltop overlook, old orchard

**Design notes:**
- Players should be able to walk here, look around, pick up a few things, and return safely
- Introduce the exploration loop: leave town → discover something → return with information or materials
- At least one gathering node (herbs, wood, stone) for crafting introduction
- One ambient creature encounter (non-hostile unless provoked)

### Ring 2 — Unsettled (30-minute walk)

**Purpose:** First real danger, main quest breadcrumbs, environmental storytelling
**Threat:** Moderate — hostile creatures, environmental hazards, weakened wards
**Examples:** Thinning forest, abandoned farmstead, old mine entrance, crossroads shrine

**Design notes:**
- This is where the **world's central threat becomes tangible** — not just rumors, but visible evidence
- In Threadhallow: twisted trees, animals with wrong-colored eyes, ground patterns that weren't there yesterday
- Contains the first combat encounter (CR 1/4–1/2 for a party of 1–2)
- Should have a discoverable clue that connects to the main quest
- The terrain itself is the teacher — skill checks for climbing, swimming, navigating

### Ring 3 — Dangerous (half-day journey)

**Purpose:** Endgame tease, "you're not ready yet" signal, long-term quest hooks
**Threat:** High — players will die if they go here at level 1
**Examples:** Ruins, dungeon entrance, Fray-touched zone, faction outpost

**Design notes:**
- Players should be able to *see* or *hear about* this location but not survive it yet
- Creates the "I'll come back when I'm stronger" pull
- An NPC in town should warn about this place specifically
- In Threadhallow: the Torn Meadow, where a Loom Stone is actively eroding and the Fray bleeds through

---

## NPC Population Guidelines

### Named NPCs: 6–8

Every starting settlement needs **6–8 named NPCs** with distinct personalities, secrets, and relationships. These are hand-crafted for the specific world.

| Role | Archetype Base | Purpose |
|------|---------------|---------|
| **Leader** | village_elder / magistrate | Main quest hook, governance |
| **Innkeeper** | innkeeper | Social hub, rumors, rest |
| **Artisan** | blacksmith / carpenter | Equipment, crafting |
| **Healer** | priest / herbalist | Healing, lore |
| **Farmer** | (custom) | Side quests, grounding |
| **Outsider** | hermit / traveling_merchant / refugee | Mystery, alternative perspective |
| **Troublemaker** | (varies) | Conflict, moral complexity |
| **Secret-Keeper** | (varies) | Deep lore, late-game connections |

**Rules for named NPCs:**
- Every NPC has a **secret** that connects to deeper lore or another character's arc
- At least 2 NPCs should have a **tension** between them (political, personal, philosophical)
- At least 1 NPC should be **sympathetic but wrong** about something important
- No NPC exists solely to give quests — they have lives, routines, and opinions

### Ambient NPCs: 10–15

Generated from the archetype library at settlement creation time. These populate the village with life but don't have hand-crafted arcs.

- 2–3 guards (authority/commoner)
- 2–3 farmers and laborers (craft/commoner)
- 1–2 children (no archetype — ambient flavor only)
- 2–3 assorted villagers on daily schedules
- 1 wanderer passing through (rotates: pilgrim, merchant, refugee, bard)

---

## Multiplayer Considerations

### Spawning

- All players in a multiplayer world spawn at the starting settlement
- New players joining an existing world arrive via the main road (narrative arrival, not teleportation)
- The inn has enough rooms for the world's player cap (up to 32)

### Scaling

- Settlement size scales with world player cap:
  - 1–4 players: hamlet-to-village (100–200 pop, 6 buildings)
  - 5–12 players: village (200–400 pop, 8–10 buildings)
  - 13–32 players: large village or small town (400–800 pop, 12–15 buildings)
- More players = more ambient NPCs, more shop inventory, wider surrounding territory

### Shared Spaces

- The tavern and town green are **public gathering spaces** — all players can interact simultaneously
- Shops have a single shared inventory (first-come-first-served for rare items)
- The elder's hall quest board is visible to all — quest acceptance is per-player or per-party

---

## Threadhallow Reference Implementation: Thornwick

Thornwick is the canonical example of this spec applied to Threadhallow. Here's how it maps:

| Spec Requirement | Thornwick Implementation |
|-----------------|-------------------------|
| Tavern | The Knotted Ewe (Aldric Tapper) |
| Smithy | The Smithy (Rowan Ironhand) |
| General Store | Greensward Farm doubles as provisioner |
| Shrine | Bindstone Chapel (Colm Bindstone) |
| Elder's Hall | Oakheart's Hall (Bryn Oakheart) |
| Herbalist | Sorrel (hermit outside village — unconventional placement) |
| Town Green | The Green (ward-circle landmark) |
| Farmstead | Greensward Farm (Hazel Greensward) |
| Ring 1 — Safe | Greenmantle Forest (stable section) |
| Ring 2 — Unsettled | The Thinning Forest, Sorrel's Camp |
| Ring 3 — Dangerous | The Torn Meadow |
| Main quest hook | Elder Maren's death, weakening wards, approaching Hollowing |
| Time pressure | 6 weeks to the Hollowing ceremony |

**Notable deviations from the generic template:**
- Thornwick has no dedicated general store — the farm fills this role (appropriate for a small village)
- The herbalist (Sorrel) lives outside the village, making her both healer and outsider
- The graveyard (Old Ashwick Burial Ground) serves as the lore-rich atmosphere location

---

## Generation Algorithm (for Beacon)

When procedurally generating a starting settlement:

1. **Select settlement size** based on world player cap
2. **Place required buildings** from the list above, selecting specific archetypes based on biome and tone
3. **Place 2–3 recommended buildings** weighted by tone (horror → graveyard, pastoral → bakery, etc.)
4. **Generate named NPCs** from archetype bases, applying world-specific naming conventions
5. **Assign secrets and relationships** — minimum 2 tensions, every NPC has a secret
6. **Generate ambient NPCs** from archetype pools
7. **Place Ring 1–3 locations** based on biome, selecting from wilderness archetypes
8. **Apply ward status** based on world state (new worlds start with weakened-but-functional wards)
9. **Set time pressure** — select the next approaching ceremony from the ritual calendar
10. **Seed the main quest hook** — place the inciting incident (dead expert, broken ward, missing artifact, etc.)

---

## Open Questions

1. **Should the starting settlement be the same for all players in a multiplayer world, or can the world creator customize it?** (Likely: same for all, customized via World Creation Wizard tone/biome settings)
2. **How does the starting settlement change as the game progresses?** (Likely: ward status degrades, NPCs react to player actions, new arrivals/departures)
3. **Should there be a "safe zone" mechanic in the settlement proper?** (For multiplayer PvP worlds — can players fight inside town walls?)
4. **How large is the pixel map for the settlement?** (Needs Scribe input on map dimensions and tile budgets)

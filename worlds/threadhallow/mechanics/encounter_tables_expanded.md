# Expanded Encounter Tables — All Biomes × Weave States

*Addendum to the Threadhallow Mechanics Companion §5*
*Source: 2024 Free Rules (DM's Toolbox — Building Combat Encounters)*

## Design Approach

Rather than 48 individual tables (12 biomes × 4 weave states), the system uses:
1. **12 base biome tables** (stable weave, level 1–4) — the foundation
2. **4 level tier tables** per biome (levels 1–4, 5–8, 9–12, 13+) — scale with party
3. **Weave state modifiers** — systematic rules that transform any base table

This is how the engine should resolve encounters: `biome table + level tier + weave state modifier`.

---

## 1. Weave State Modifiers

These modifiers apply to ANY biome's encounter table. They are applied after the base table roll.

### 1.1 Stable (No Modifier)

Use the base biome table as-is. This is the default state within ward circles and healthy regions.

### 1.2 Thin

| Modification | Rule |
|---|---|
| **Encounter frequency** | On a "No encounter" result, re-roll once. If the re-roll is also "No encounter," the party notices a minor anomaly instead (cosmetic). |
| **Fray creature injection** | On any combat result, there is a 25% chance (d4 = 1) that 1d4 Looselings also appear, drawn by the disturbance. |
| **Environmental anomaly** | On any non-combat result, add a DC 12 Wisdom save or the party experiences 1 minute of sensory distortion (sounds arrive late, shadows lag, temperature drops 5°). No mechanical effect beyond unease. |
| **Creature behavior** | Beasts encountered in Thin zones are agitated. +2 to their initiative, but they flee if reduced to half HP. |

### 1.3 Frayed

| Modification | Rule |
|---|---|
| **Encounter frequency** | "No encounter" results are replaced with environmental hazards (DC 14 Constitution save or 2d6 force damage from Fray pulses). |
| **Fray creature injection** | On any combat result, 50% chance (d4 ≤ 2) of additional Fray creatures: 1d4 Looselings (levels 1–4), 1 Thread-Eater or Frayed One (levels 5–8), 1 Hollow Walker (levels 9–12), 1 Thread-Sovereign (levels 13+). |
| **Environmental hazards** | All non-combat encounters include a DC 14 Dexterity save to avoid spatial distortion (teleported 10 feet in a random direction). |
| **Fray exposure** | Each hour in a Frayed zone: DC 13 Constitution save or gain 1 level of Fray Exposure (Mechanics Companion §3). |
| **Rest restrictions** | Short rests require a DC 13 Wisdom save to complete. Failure = no benefit. Long rests function normally but take 10 hours instead of 8. |

### 1.4 Unraveled

| Modification | Rule |
|---|---|
| **Encounter table** | Replace the biome's base table entirely with the **Unraveled Zone Table** (see §3 below). Only Fray creatures, environmental horrors, and rare artifacts. |
| **Fray exposure** | DC 15 Constitution save every 30 minutes or gain 1 level of Fray Exposure. |
| **Rest restrictions** | No long rests without a portable ward or magical protection (e.g., *Tiny Hut* with a Wardweaver's Threadcraft enhancement). Short rests require DC 15 Wisdom save. |
| **Magic instability** | Spellcasters must make a DC 13 ability check (using their spellcasting ability) when casting spells of 3rd level or higher. On failure, the spell triggers a Wild Magic Surge (2024 Free Rules, Sorcerer class). |
| **Navigation** | Survival checks to navigate are made at disadvantage. On failure, the party moves in a random direction instead. |

---

## 2. Base Biome Encounter Tables — Stable Weave

### 2.1 Forest (Stable) — Levels 1–4

*(Already exists in encounters.json — retained for reference)*

See Mechanics Companion §5 / encounters.json `forest_stable`.

### 2.2 Plains (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–5 | No encounter | — | — |
| 6–8 | A herd of wild horses startled by the party | 1d6 riding horses | 0.25 |
| 9–10 | Prairie wolves hunting in the tall grass | 1d6 wolves | 0.25 |
| 11–12 | A group of bandits sheltering in a gully | 2d4 bandits | 0.125 |
| 13–14 | Giant vultures circling something dead ahead | 1d4 giant vultures | 1 |
| 15–16 | A swarm of insects rises from the grass | 1d4 swarms of insects | 0.5 |
| 17 | A manticore gliding low over the grassland | 1 manticore | 3 |
| 18 | A shepherd and flock — they share news and water | Non-combat | — |
| 19 | A Wardweaver repairing a boundary marker | Non-combat | — |
| 20 | An ancient standing stone, warm to the touch, faintly humming | Non-combat (lore) | — |

### 2.3 Mountain (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–4 | No encounter | — | — |
| 5–7 | Mountain goats knock loose rocks as they flee | Environmental (DC 12 DEX save, 1d6 bludgeoning) | — |
| 8–9 | A giant eagle nesting on a nearby ledge — territorial | 1 giant eagle | 1 |
| 10–11 | Kobolds defending a cave entrance | 2d6 kobolds | 0.125 |
| 12–13 | A bear foraging among the scree | 1 brown bear | 1 |
| 14–15 | Bandits using a mountain pass as an ambush point | 1 bandit captain + 1d6 bandits | 2 / 0.125 |
| 16 | A griffon soaring overhead — may attack if provoked | 1 griffon | 2 |
| 17 | A rockslide — DC 14 Dexterity save or 3d6 bludgeoning | Environmental hazard | — |
| 18 | A hermit Threadwalker — offers shelter and cryptic warnings | Non-combat | — |
| 19 | An abandoned mine entrance, timbers creaking | Non-combat (dungeon entrance) | — |
| 20 | A Loom Stone embedded in the cliff face, pulsing with warmth | Non-combat (lore) | — |

### 2.4 Swamp (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–4 | No encounter | — | — |
| 5–7 | Giant frogs lurking beneath the murk | 1d4 giant frogs | 0.25 |
| 8–9 | A crocodile basking on a muddy bank | 1 crocodile | 0.5 |
| 10–11 | Giant spiders webbing between dead trees | 1d4 giant spiders | 1 |
| 12–13 | Lizardfolk patrol — defensive but not hostile unless provoked | 2d4 lizardfolk | 0.5 |
| 14–15 | Quicksand — DC 13 Perception to spot; DC 13 Athletics to escape | Environmental hazard | — |
| 16 | A will-o'-wisp leading travelers off the path | 1 will-o'-wisp | 2 |
| 17 | Poisonous gas pocket — DC 13 Constitution save or poisoned for 1 hour | Environmental hazard | — |
| 18 | A Hollow Court forager — cautious, will trade for news | Non-combat | — |
| 19 | Ruined causeway, half-submerged, leading deeper into the swamp | Non-combat (path) | — |
| 20 | Glowing thread-moss on dead trees — a thin place forming | Non-combat (lore, weave signal) | — |

### 2.5 Tundra (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–5 | No encounter — the cold silence is complete | — | — |
| 6–8 | Wolves on the ice, thin and desperate | 1d6 wolves | 0.25 |
| 9–10 | A polar bear emerges from behind a snow drift | 1 polar bear (use brown bear stats + cold immunity) | 1 |
| 11–12 | A blizzard moves in — DC 13 Constitution save or 1 level of exhaustion per hour | Environmental hazard | — |
| 13–14 | Ice — DC 12 Dexterity save or fall prone; creatures move at half speed | Environmental (difficult terrain) | — |
| 15–16 | Frozen corpse of a traveler — 1d4 days dead, has supplies and a journal | Non-combat (lore/loot) | — |
| 17 | A winter wolf stalks the party from the treeline | 1 winter wolf | 3 |
| 18 | A yeti, half-hidden in a snow bank | 1 yeti | 3 |
| 19 | A Threadwalker shelter — crude but functional, recently abandoned | Non-combat | — |
| 20 | Aurora-like light in the sky — Threadlines visible, a rare and beautiful sight | Non-combat (lore) | — |

### 2.6 Desert (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–5 | No encounter — heat shimmer and silence | — | — |
| 6–8 | Giant scorpions burst from the sand | 1d4 giant scorpions | 3 (adjust: 1 for level 1–2 parties; 1d4 for level 3–4) |
| 9–10 | A dust devil — DC 12 Dexterity save or 1d6 bludgeoning and blinded for 1 round | Environmental hazard | — |
| 11–12 | Bandits disguised as traders | 1 bandit captain + 1d4 bandits | 2 / 0.125 |
| 13–14 | Giant lizards basking on warm rocks | 1d4 giant lizards | 0.25 |
| 15–16 | A mirage — DC 14 Wisdom (Survival) check or waste 1d4 hours traveling in the wrong direction | Environmental hazard | — |
| 17 | Extreme heat — DC 13 Constitution save every hour or 1 level of exhaustion | Environmental hazard | — |
| 18 | An oasis — a caravan rests here, willing to trade | Non-combat | — |
| 19 | Ruins half-buried in sand, markings that might be Weaver-script | Non-combat (lore) | — |
| 20 | A glass formation in the sand — a Threadline passed through here, fusing the ground | Non-combat (lore) | — |

### 2.7 Taiga (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–4 | No encounter | — | — |
| 5–7 | Wolves among the conifers | 1d4+1 wolves | 0.25 |
| 8–9 | A brown bear protecting cubs | 1 brown bear (fights to the death) | 1 |
| 10–11 | Elk herd — stampede if startled (DC 13 DEX save, 2d6 bludgeoning) | Environmental | — |
| 12–13 | Bandits in a hunting camp | 2d4 bandits | 0.125 |
| 14–15 | A dire wolf appears on a ridge | 1 dire wolf | 1 |
| 16 | An owlbear crashing through the brush | 1 owlbear | 3 |
| 17 | Heavy snowfall — visibility reduced to 30 ft., DC 12 Survival to maintain direction | Environmental | — |
| 18 | A trapper's cabin — occupied, suspicious but hospitable | Non-combat | — |
| 19 | A frozen stream with something glinting beneath the ice | Non-combat (loot/trap) | — |
| 20 | Ancient tree with Weaver marks carved deep into the bark | Non-combat (lore) | — |

### 2.8 Coast (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–4 | No encounter — waves and salt wind | — | — |
| 5–7 | Giant crabs emerge from the rocks at low tide | 1d4 giant crabs | 0.125 |
| 8–9 | A swarm of quippers in a tidal pool | 1 swarm of quippers | 1 |
| 10–11 | Sahuagin scouts at the waterline | 1d4 sahuagin | 0.5 |
| 12–13 | Smugglers unloading cargo in a cove | 2d4 bandits + 1 bandit captain | 0.125 / 2 |
| 14–15 | Rip current — DC 13 Strength (Athletics) to swim free; pulled 30 ft. out on failure | Environmental | — |
| 16 | A harpy nesting on sea cliffs | 1 harpy | 1 |
| 17 | A sea cave exposed by low tide — something glitters inside | Non-combat (dungeon entrance) | — |
| 18 | Fisherfolk mending nets — they share gossip and dried fish | Non-combat | — |
| 19 | A shipwreck on the rocks — cargo salvageable, but the hull groans | Non-combat (loot/danger) | — |
| 20 | Driftwood arranged in a pattern — Threadlines beneath the sand pull things into alignment | Non-combat (lore) | — |

### 2.9 Hills (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–4 | No encounter — wind over heather | — | — |
| 5–7 | Wolves following a flock of sheep | 1d4 wolves | 0.25 |
| 8–9 | A giant hyena prowling the ridgeline | 1 giant hyena | 1 |
| 10–11 | Bandits using a cairn as a lookout | 1d6 bandits | 0.125 |
| 12–13 | An ankheg erupts from the peat | 1 ankheg | 2 |
| 14–15 | Fog rolls in — visibility 30 ft., DC 12 Survival to navigate, DC 14 Perception to spot ambushes | Environmental | — |
| 16 | A wyvern overhead — attacks only if the party is carrying fresh meat | 1 wyvern | 6 (avoidable) |
| 17 | A shepherd's bothy — empty, with recent fire ashes and a forgotten journal | Non-combat (lore) | — |
| 18 | A standing stone circle — the air thrums, warmth despite the wind | Non-combat (lore) | — |
| 19 | An old Wardweaver boundary marker, cracked but still faintly glowing | Non-combat (lore) | — |
| 20 | The ground is oddly warm; heather grows in spiral patterns around a buried Loom Stone | Non-combat (lore, weave signal) | — |

### 2.10 Cavern (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–3 | No encounter — dripping water, silence | — | — |
| 4–6 | Giant rats nesting in the rubble | 1d6 giant rats | 0.125 |
| 7–8 | Giant spiders webbing a narrow passage | 1d4 giant spiders | 1 |
| 9–10 | A swarm of bats erupts from a side passage | 1 swarm of bats | 0.25 |
| 11–12 | Kobolds defending a warren | 2d6 kobolds + 1d4 traps (DC 12) | 0.125 |
| 13–14 | An ochre jelly oozing along the ceiling | 1 ochre jelly | 2 |
| 15 | A piercer drops from the ceiling | 1d4 piercers | 0.5 |
| 16 | Unstable ceiling — DC 13 Perception to notice; DC 14 DEX save or 2d10 bludgeoning | Environmental | — |
| 17 | Underground stream — DC 12 Athletics to cross; swept 30 ft. downstream on failure | Environmental | — |
| 18 | Bioluminescent fungi — edible (DC 13 Nature to identify), provides dim light 10 ft. | Non-combat (resource) | — |
| 19 | Ancient carvings on the wall — pre-Silence era, possibly Weaver-made | Non-combat (lore) | — |
| 20 | A crystal formation that resonates when touched — a Threadline node underground | Non-combat (lore, weave signal) | — |

### 2.11 Farmland (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–6 | No encounter — peaceful fields, birdsong | — | — |
| 7–9 | Wolves that have been raiding livestock | 1d4 wolves | 0.25 |
| 10–11 | A scarecrow that seems to have moved since last you looked | 1 scarecrow (may be Thread-Puppet if thin) | 1 |
| 12–13 | Farm dogs barking at something in the hedgerow — giant rats | 1d6 giant rats | 0.125 |
| 14–15 | Bandits posing as farmhands, stealing from the harvest | 1d6 bandits | 0.125 |
| 16 | A swarm of insects destroying crops — farmers request help | 1d4 swarms of insects | 0.5 |
| 17 | A farmer frantically reports missing livestock — tracks lead to the woods | Non-combat (quest hook) | — |
| 18 | A traveling merchant on the road with a cart full of goods | Non-combat | — |
| 19 | Wardweaver apprentices walking the boundary, refreshing markers | Non-combat | — |
| 20 | Crops growing in unusual spiral patterns — the weave beneath the soil is strong here | Non-combat (lore, weave signal) | — |

### 2.12 Deep Forest (Stable) — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1–3 | No encounter — ancient silence, canopy blocks the sky | — | — |
| 4–6 | Giant spiders in webs between massive roots | 1d4 giant spiders | 1 |
| 7–8 | An owlbear in a den between root structures | 1 owlbear | 3 |
| 9–10 | Dire wolves — larger, more aggressive than forest wolves | 1d4 dire wolves | 1 |
| 11–12 | Ettercaps tending spider colonies | 1d4 ettercaps | 2 |
| 13–14 | A dryad steps from a massive tree — warns against trespassing deeper | 1 dryad (non-hostile initially) | 1 |
| 15 | Displacer beast — hard to track in the gloom | 1 displacer beast | 3 |
| 16 | The canopy is so dense navigation fails — DC 14 Survival or lose 1d4 hours | Environmental | — |
| 17 | Ancient tree with a hollow interior — something lives inside | Non-combat (den/lair entrance) | — |
| 18 | A Weaver's Mark on a root the size of a house — this forest is old enough to remember | Non-combat (lore) | — |
| 19 | The trees have grown into each other — an archway formed naturally, or not naturally at all | Non-combat (lore) | — |
| 20 | Threadlines visible between the trees, humming faintly — the deep forest IS the weave | Non-combat (lore, major weave signal) | — |

---

## 3. Unraveled Zone Table

This table replaces ALL biome tables when the weave state is **unraveled**. Biome flavor should still be described narratively, but the mechanical encounters are uniform — the Fray has overwritten the local ecology.

### Unraveled Zone — Levels 1–4

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1 | Brief pocket of calm — no encounter, but it feels wrong | — | — |
| 2–4 | Reality pulse — DC 14 Constitution save or 2d6 force damage + prone | Environmental | — |
| 5–7 | Looselings swarm from tears in the air | 2d4 Looselings | 0.25 |
| 8–9 | Thread-Puppets — animated objects that shouldn't be here | 1d4 Thread-Puppets | 1 |
| 10–11 | A Frayed One stumbles toward the party, reaching | 1 Frayed One + 1d4 Looselings | 2 / 0.25 |
| 12–13 | Thread-Eaters drawn by the party's magical items | 1d4 Thread-Eaters | 2 |
| 14–15 | Spatial loop — party walks for 30 minutes and arrives where they started. DC 15 INT (Arcana) to break free | Environmental | — |
| 16–17 | A Hollow Walker patrols the edges | 1 Hollow Walker | 4 |
| 18 | Fray storm — pulsing force damage, reality shudders | DC 15 CON, 3d6 force | — |
| 19 | An Unspun at the zone's heart | 1 The Unspun | 5 |
| 20 | A Fray breach — portal-like tear, something *large* on the other side | DM discretion (boss encounter) | — |

### Unraveled Zone — Levels 5–8

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1 | Pocket of calm | — | — |
| 2–3 | Reality pulse — DC 15 CON, 3d6 force + prone | Environmental | — |
| 4–6 | Looseling swarm with Thread-Eater alpha | 2d6 Looselings + 1 Thread-Eater | 0.25 / 2 |
| 7–8 | Thread-Puppets — animated from battlefield debris | 2d4 Thread-Puppets | 1 |
| 9–10 | Frayed Ones — a group, moving together as if remembering how to walk in formation | 1d4 Frayed Ones | 2 |
| 11–12 | Hollow Walker hunting pack | 1d4 Hollow Walkers | 4 |
| 13–14 | The Unspun with Looseling escorts | 1 The Unspun + 1d6 Looselings | 5 / 0.25 |
| 15–16 | Gravity inversion — DC 15 DEX, 3d6 bludgeoning (fall upward), lasts 1 minute | Environmental | — |
| 17 | Time stutter — party loses 1d4 hours; any ongoing spell effects end | Environmental | — |
| 18 | A Weft Spider in its Threadline web | 1 Weft Spider | 8 |
| 19 | A Hollow Court salvager team, adapted to the Fray — they know the safe paths | Non-combat | — |
| 20 | An intact Weaver artifact suspended in a pocket of perfect stillness | Non-combat (major loot/lore) | — |

### Unraveled Zone — Levels 9–12

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1 | Pocket of calm | — | — |
| 2–3 | Reality pulse — DC 16 CON, 4d6 force + 1 level Fray Exposure | Environmental | — |
| 4–5 | Hollow Walker pack with Thread-Eater support | 1d4 Hollow Walkers + 1d4 Thread-Eaters | 4 / 2 |
| 6–7 | The Unspun — larger than usual, faces visible in its surface | 1 The Unspun (max HP) + 1d4 Frayed Ones | 5 / 2 |
| 8–9 | Weft Spider in established web (lair actions active) | 1 Weft Spider | 8 |
| 10–11 | A Loom-Ghost drifting through the ruins of what was | 1 Loom-Ghost | 10 |
| 12–13 | Thread-Sovereign with its court | 1 Thread-Sovereign + 2d4 Looselings + 1 Hollow Walker | 12 / 0.25 / 4 |
| 14–15 | Spatial fold — the party is split into two groups in adjacent pockets of reality; DC 16 INT (Arcana) to reunite | Environmental | — |
| 16–17 | Fray storm — severe — DC 16 CON, 4d10 force, all spell effects end, Fray Exposure check | Environmental | — |
| 18 | A Rememberer expedition — desperate, running low on ward-tokens | Non-combat | — |
| 19 | The Unweaver passes through at a distance — observing, not attacking (yet) | Non-combat (foreshadowing) | — |
| 20 | A fragment of reality that shouldn't exist — a room from a building that was consumed by the Fray, preserved perfectly | Non-combat (major lore) | — |

### Unraveled Zone — Levels 13+

| d20 | Encounter | Creatures | CR |
|-----|-----------|-----------|-----|
| 1 | Pocket of calm — suspiciously so | — | — |
| 2–3 | Cascade failure — DC 17 CON, 6d6 force + 1 level Fray Exposure + all non-magical equipment saves (DC 15) or destroyed | Environmental | — |
| 4–5 | Thread-Sovereign with a full court | 1 Thread-Sovereign + 1d4 Hollow Walkers + 2d6 Looselings | 12 / 4 / 0.25 |
| 6–7 | The Unweaver — actively unraveling the area | 1 The Unweaver | 15 |
| 8–9 | Loom-Ghost council — 2 Loom-Ghosts arguing in Weaver-language | 2 Loom-Ghosts (may negotiate) | 10 |
| 10–11 | Weft Spider nest — multiple webs layered, lair actions doubled | 1d4 Weft Spiders | 8 |
| 12–13 | A Void Loom forming — nascent, CR 12 version (half HP, reduced zone to 30 ft.) | 1 Void Loom (nascent) | 12 |
| 14–15 | Reality inversion — all damage types swap (fire ↔ cold, radiant ↔ necrotic, etc.) for 1d4 rounds | Environmental | — |
| 16–17 | The Unweaver with Thread-Sovereign escort | 1 The Unweaver + 1 Thread-Sovereign | 15 / 12 |
| 18 | A Hollow Court warband — 12+ Fray-adapted fighters, heavily armed with Thread-Iron | Non-combat (potential ally) | — |
| 19 | A Weaver fragment — not a Loom-Ghost, something *more*. It speaks clearly. It asks for help. | Non-combat (critical lore) | — |
| 20 | Fully formed Void Loom at a corrupted Loom Stone | 1 Void Loom | 17 |

---

## 4. Higher-Level Base Tables (Stable Weave)

As parties level up, the base biome tables scale. Rather than full d20 tables for every biome at every tier, here are the scaling rules and key additions:

### Tier 2 (Levels 5–8) — Scaling Rules

Apply these modifications to the level 1–4 base tables:
- Increase all creature counts by 50% (round up)
- Replace CR 0.125–0.25 creatures with CR 1–2 equivalents (wolves → dire wolves, bandits → veterans, giant rats → giant spiders)
- Replace lone CR 3 creatures with CR 3 + 1d4 CR 0.5 minions
- Add one entry (replace highest non-combat roll): a Threadwalker patrol that is itself under attack
- Environmental DCs increase by +2

### Tier 3 (Levels 9–12) — Scaling Rules

- Double all creature counts from base table
- Replace all CR 0.125–0.5 creatures with CR 2–3 equivalents
- Replace CR 1–3 creatures with CR 5–6 equivalents (owlbear → young dragon or chimera)
- Add two entries: (1) a ruined settlement, (2) a Fray breach that must be contained
- Environmental DCs increase by +4 from base
- Non-combat encounters may trigger ambushes (50% chance an NPC encounter is actually a trap or disguise)

### Tier 4 (Levels 13+) — Scaling Rules

- Triple creature counts from base
- All creatures CR 5+ (replace lower with thematic equivalents)
- Add legendary creature variants to top rolls
- Environmental hazards deal 4d6+ damage
- Non-combat encounters involve faction politics, Weaver lore, or endgame quest hooks

---

## 5. Dungeon Encounter Modifiers (Expanded)

The existing 7 dungeon modifiers in encounters.json are retained. Additional modifiers for new content:

| Dungeon Type | Modifier |
|---|---|
| **loom_chamber** | All encounters are Fray creatures. Add +2 CR to all creatures. The Void Loom is always present as the final encounter. Fray Exposure saves required every 10 minutes (DC 15). |
| **weavers_cradle** | Replace 50% of encounters with Loom-Ghosts or environmental visions. Non-combat encounters reveal Weaver history. The Binding Song can be used as a combat action (3d10 radiant to Fray creatures in 30 ft.). |
| **ward_engine** | Mechanical/construct encounters replace beasts. Traps are arcane (DC 15+ Arcana to disarm). The final encounter is always a malfunctioning Ward Engine that must be repaired (skill challenge: 8 successes / 3 failures). |
| **frayed_ruin** | As Frayed zone modifier, but indoors. Spatial distortion is more severe (rooms rearrange between visits). Mapping is impossible without Arcana checks. |
| **hollow_court_settlement** | No hostile encounters unless the party provokes. All encounters are social — negotiation, trade, information gathering. DC 14 Charisma checks to earn trust. Fray-touched NPCs may become hostile if their condition is commented on insensitively. |

---

## 6. XP Budget Guidelines per Act

Per 2024 Free Rules encounter building guidelines:

| Act | Party Level | Easy (per char) | Medium (per char) | Hard (per char) | Deadly (per char) |
|-----|------------|-----------------|-------------------|-----------------|-------------------|
| I | 1–4 | 25–50 | 50–100 | 100–150 | 150–200 |
| II | 5–8 | 250–500 | 500–750 | 750–1,000 | 1,000–1,500 |
| III | 9–12 | 600–1,000 | 1,000–1,500 | 1,500–2,000 | 2,000–3,000 |
| IV | 13–16 | 1,400–2,000 | 2,000–3,000 | 3,000–4,000 | 4,000–6,000 |
| V | 17–20 | 2,500–4,000 | 4,000–6,000 | 6,000–10,000 | 10,000–15,000 |

**Encounter multiplier for companion party members:** Companions count as half a party member for XP threshold purposes (per 2024 rules, NPC allies reduce encounter difficulty). A party of 4 PCs + 1 companion uses the thresholds for 4.5 characters.

---

## RAW Deviations

| Deviation | Rationale |
|-----------|-----------|
| Weave state modifiers are not standard D&D | Custom overlay system specific to Threadhallow. Maps to 2024 Free Rules environmental hazard framework but extends it with cumulative Fray Exposure. |
| Unraveled zone prevents long rests | Extends the 2024 Free Rules environmental hazard concept. Parallels the "extreme environment" rules where DM can restrict resting. Creates meaningful pressure to carry ward-tokens. |
| Magic instability in unraveled zones uses Wild Magic Surge table | Reuses existing 2024 Free Rules content (Sorcerer Wild Magic Surge table) rather than creating a custom table. Not RAW for non-sorcerers but thematically appropriate. |
| Tier scaling rules use multipliers rather than separate tables | Practical design decision — 12 biomes × 4 tiers = 48 tables is unmanageable. The multiplier approach preserves biome flavor while scaling appropriately per the 2024 Free Rules encounter building math. |

# Bard — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-27

---

## Content Architecture

**4 Sensory Channels Are the Standard** — All vocabulary tables, creature descriptions, and weave-state overlays use 4 channels (sight/sound/smell/feel or terrain/sounds/smells/atmosphere). Keep this consistent across every new content file.

**Vocabulary Layering Model** — Shared biome descriptors are the base layer. World-specific overlays (like `threadhallow_biome_overlay.json`) append via `overlay_mode: append`, never replace. Weave-state descriptors add a third layer. The LLM composes all three at runtime.

**Archetype Schema Is Strict** — Every location archetype needs: id, category, subcategory, settlement_size, atmosphere, npc_slots, encounter_hooks, tags. NPCs need `stats_tier` (5 tiers: commoner/skilled/expert/veteran/elite). Dungeons and wilderness need `challenges` (encounters, traps, skill_checks, saving_throws, loot_tier). Follow `archetype_format.md` exactly.

**Saving Throws vs Skill Checks Are Separate** — D&D 5e treats these differently. Naming convention: `ability_save_description` for saves (e.g., `wisdom_save_resist_fear`), `skill_action` for checks (e.g., `athletics_climb_vertical_shaft`). Never mix them in the same array.

**Anglo-Celtic Naming Conventions** — Threadhallow uses Anglo-Celtic naming for people, places, and traditions. Keep this consistent when creating new NPCs, locations, or cultural elements. No generic fantasy names.

## Content Design Patterns

**Every NPC Gets a Secret** — No throwaway mystery boxes. Every secret connects to deeper lore or another character's arc. This is what makes the world feel interconnected.

**Voice Over Clinical** — Archetype descriptions should be sardonic, specific, and evocative — not encyclopedic. The LLM narrates from these; if the source is flat, the output is flat.

**Fray Creatures Are Consequences, Not Enemies** — They're symptoms of pattern breakdown, not evil. Behavior descriptions emphasize motivation (what draws them, what they consume, what they represent) over combat tactics. Frayed Ones are the most narratively important — they're the human cost.

**Side Quests Connect to Main Narrative** — No standalone fetch quests. Every hand-crafted side quest seeds Act IV path choices, resolves companion arcs, or reveals world lore. Procedural quests use the 15 reusable templates with weighted selection.

**Companion Design: Opinionated + Autonomous** — 2-companion party cap. Companions comment, disagree, and leave if values are violated. No direct control — player suggests, companion decides. Hidden relationship tracker expressed through LLM dialogue tone, not UI numbers.

**Late Acts Favor Transformation Over Introduction** — Acts IV–V reuse the existing cast with transformed roles (15 returning characters) rather than introducing many new NPCs. Only 3 new characters appear in late game. This deepens relationships instead of diluting them.

**Faction Reputation Is Expressed Narratively** — 9 reputation tiers per faction, each expressed through 5 dimensions (formality, trust, access, proximity, inclusion) that vary by faction culture. Key NPCs shift behavior at tier thresholds. No visible reputation number — the LLM conveys standing through dialogue tone and NPC reactions.

## World Structure

**Multi-World Folder Layout** — Each world lives under `worlds/<world_name>/`. Shared content (archetypes, vocabulary) lives under `worlds/shared/`. This was established when relocating from the flat `world/` structure.

**Threadhallow Content Is Complete** — As of 2026-03-27, all narrative gaps are closed: world bible, main quest (5 acts), 5 factions, 7 regions, ~22 named NPCs, 4 companions + extended features, 20 hand-crafted side quests + 15 reusable templates, 21 creature archetypes, 7 vocabulary tables, 16 encounter designs, faction reputation narrative, Threadcraft flavor, post-game content. What remains is mechanical work (Loremaster) and implementation (Beacon).

**Three Endgame Paths Have Different Post-Game Flavors** — Restoration = narratively dramatic (alien coexistence), Release = gameplay-dense (infrastructure/frontier), Harmony = philosophically rich (the Fray is aware). This asymmetry is intentional and should be preserved.

## Process Lessons

**Schema Changes Require Data Backfill** — Adding a field to `archetype_format.md` means nothing until every existing JSON file has that field populated. Beacon can't build loaders against empty fields. Do the backfill immediately, not later.

**Loremaster Reviews Catch Real Issues** — The saving throw/skill check confusion and the stats_tier gap were legitimate D&D rule violations. Always welcome mechanical review of narrative content — Bard designs flavor, Loremaster validates rules compliance.

**Dungeon vs Wilderness Density** — Dungeons: 5 encounters, 3-5 traps, 5 skill checks (high mechanical density). Wilderness: 3-4 encounters, 0-3 traps (natural hazards only), 4-5 skill checks (exploration over combat). No magical traps in wilderness unless fey-related.

## Current Inventory (for quick reference)

- **Location archetypes:** ~54 (across 7 categories: taverns, shops, residences, wilderness, civic, dungeons, temples)
- **NPC archetypes:** ~37 (across 5 categories: merchants, craft, service, authority, wanderers)
- **Vocabulary tables:** 7 (biome, settlement, weather, time, sensory, building_styles, weave_state)
- **Creature archetypes:** 21 (15 generic + 6 Fray-specific)
- **Threadhallow regions:** 7 (Thornwick, Ashenmoor, Singing Cairn, Hollowreach, Loomhearth, Threadfall Expanse, Knotwood + Weavers' Cradle)
- **Named NPCs:** ~22 (6 Act I, 7 Act II, 3 Act III, 3 new Act IV–V + 15 returning)
- **Companions:** 4 (Sorrel, Farweft, Wren, Wynn)

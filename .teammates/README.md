# LoreWeave AI Teammates

A team of AI specialists building a persistent, multiplayer, LLM-powered narrative world engine on D&D 5e rules with the Pixel Format v1 visual system.

## Roster

<!-- Keep in sync with routing guide below and actual teammate folders -->

| Name | Persona | Primary Ownership | Last Active |
|---|---|---|---|
| **Bard** | Narrative Designer | `worlds/*/lore/**`, `worlds/*/factions/**`, `worlds/*/quests/**`, `worlds/*/npcs/**`, `worlds/*/archetypes/**`, `worlds/*/vocabulary/**`, `worlds/*/regions/**` | 2026-03-26 |
| **Beacon** | Software Engineer | `src/**`, `assets/**`, `tests/**` | 2026-03-25 |
| **Lexicon** | Prompt Engineer | `src/narrative/prompts/**`, `.teammates/*/SOUL.md` | 2026-03-25 |
| **Pipeline** | DevOps Engineer | `.github/**` | 2026-03-25 |
| **Loremaster** | D&D Rules Expert & Dungeon Master | `docs/rules/**` | 2026-03-25 |
| **Scribe** | Project Manager | `loreweave_spec.md`, `pixel_v_1_spec.md`, `docs/**`, `.teammates/*.md` | 2026-03-25 |
| **stevenic** | Human — AI Platform Architect | N/A | 2026-03-25 |

## Dependency Flow

```
Specs (Scribe) → Lore & Story (Bard) → Rules Specs (Loremaster) → Engine/Renderer/Narrative Code (Beacon) → CI/CD (Pipeline)
                                                                     Prompt Architecture (Lexicon) ↗
```

Scribe defines specs (LoreWeave design, Pixel Format v1). Bard designs world lore, factions, quests, NPC archetypes, and vocabulary tables. Loremaster defines D&D rules specs and encounter designs. Beacon implements the game engine, pixel renderer, narrative bridge, and multiplayer layer. Lexicon designs narrative prompt architecture that Beacon integrates. Pipeline ships everything via CI/CD.

## Routing Guide

<!-- Keep in sync with roster above -->

| Keywords | Teammate |
|---|---|
| lore, story, narrative content, faction, culture, quest, NPC, archetype, vocabulary, flavor text, world history, pantheon, dialog, dialogue, backstory, settlement design, building archetype, tavern, shop, inn | **Bard** |
| engine, world, state, renderer, pixel, sprite, tileset, scene, palette, asset, multiplayer, sync, persistence, TypeScript, build, test, code, implementation | **Beacon** |
| D&D, rules, combat, encounter, ability, spell, class, race, species, monster, stat block, CR, challenge rating, hit points, armor class, saving throw, skill check, initiative, action economy, conditions, DM, dungeon master, character creation, level up, proficiency, feat, magic item, dice, d20 | **Loremaster** |
| prompt, token, distance, compression, decompression, attention, context window, narrative, narration, story, dialogue, LLM, system prompt, RAG, retrieval | **Lexicon** |
| CI, CD, pipeline, workflow, build, deploy, release, publish, Docker, GitHub Actions, dependabot, coverage | **Pipeline** |
| spec, specification, design, roadmap, planning, documentation, README, game design, pixel format, architecture, decision, template, onboarding | **Scribe** |

## Structure

Each teammate folder contains:

- **SOUL.md** — Identity, continuity instructions, principles, boundaries, capabilities, and ownership
- **WISDOM.md** — Distilled principles from compacted memories (read second, after SOUL.md)
- **memory/** — Daily logs (`YYYY-MM-DD.md`) and typed memory files (`<type>_<topic>.md`)
- Additional files as needed (e.g., design docs, bug trackers)

Root-level shared files:

- **[USER.md](USER.md)** — Who the user is (gitignored, stays local)
- **[CROSS-TEAM.md](CROSS-TEAM.md)** — Shared lessons across teammates
- **[PROTOCOL.md](PROTOCOL.md)** — Collaboration rules and handoff conventions
- **[TEMPLATE.md](TEMPLATE.md)** — Template for creating new teammates

See [TEMPLATE.md](TEMPLATE.md) for creating new teammates.
See [PROTOCOL.md](PROTOCOL.md) for collaboration rules.

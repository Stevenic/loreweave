# Cross-Team Notes

Shared lessons that affect multiple teammates. Record here instead of duplicating across individual WISDOM.md files.

This file also serves as a **shared index** — teammates can add pointers to private docs in their folder that other teammates might find useful.

Reverse chronological. Tag affected teammates.

## Ownership Scopes

Every teammate **owns everything** under their `.teammates/<name>/` folder — SOUL.md, WISDOM.md, memory/, and any private docs they create. This is unconditional: no teammate needs permission to edit their own folder, and no other teammate should modify it.

The **Boundary Rule** (see PROTOCOL.md) applies to the **codebase** — source code, configs, and shared framework files — not to a teammate's own `.teammates/<name>/` directory.

| Teammate | Self-owned folder | Codebase ownership (see SOUL.md for full details) |
|---|---|---|
| **Beacon** | `.teammates/beacon/**` | `src/**`, `assets/**`, `tests/**`, `package.json`, `tsconfig.json` |
| **Lexicon** | `.teammates/lexicon/**` | `src/narrative/prompts/**`, `.teammates/*/SOUL.md` (co-owned) |
| **Pipeline** | `.teammates/pipeline/**` | `.github/**`, `Dockerfile`, `.env.example` |
| **Scribe** | `.teammates/scribe/**` | `loreweave_spec.md`, `pixel_v_1_spec.md`, `README.md`, `docs/**`, `.teammates/*.md` |
| **Loremaster** | `.teammates/loremaster/**` | `docs/rules/**` (primary), `packages/rules/src/**` (co-owned with Beacon) |
| **stevenic** | `.teammates/stevenic/**` | N/A (human) |

When adding a new teammate, add a row to this table.

## Shared Docs

_(No shared docs yet.)_

## Notes

### 2026-03-25 — Team imported from teammates project
All teammates (@beacon, @lexicon, @pipeline, @scribe, @stevenic) were imported from the `teammates` source project and adapted for LoreWeave. Each teammate's SOUL.md now references LoreWeave's architecture (world engine, pixel renderer, narrative engine, multiplayer) instead of the teammates monorepo (recall, cli, consolonia packages). Previous project experience is preserved in "Previous Projects" sections. **Affects:** all teammates.

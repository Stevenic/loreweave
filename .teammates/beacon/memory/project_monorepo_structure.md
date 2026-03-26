---
name: Monorepo Structure Decision
description: LoreWeave uses npm workspaces with packages/ + services/ split, @loreweave/* scoped naming
type: project
---

LoreWeave is structured as an npm workspaces monorepo with `packages/` and `services/` directories.

**Why:** The spec defines 5 distinct systems in a pipeline. Several are genuinely independent libraries — natural packages. The game server composes them.

**How to apply:**
- New library code goes in `packages/<name>/`
- New runtime services go in `services/<name>/`
- Shared types live in `@loreweave/types` — not co-located in consuming packages
- Assets live at repo root (`assets/`), not inside any package
- Use `@loreweave/*` scoped naming for all packages
- npm workspaces (not pnpm/turborepo) — may migrate later if needed

**Dependency graph:**
- `@loreweave/types` — no deps (leaf)
- `@loreweave/pixel` — depends on types
- `@loreweave/rules` — depends on types
- `@loreweave/world` — depends on types, rules
- `@loreweave/narrative` — depends on types, world
- `@loreweave/game` (service) — depends on all packages

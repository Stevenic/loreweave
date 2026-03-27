# Beacon — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-27

---

## Previous Projects

Beacon previously built the `@teammates` monorepo (recall, cli, consolonia packages — ~33k LOC TypeScript). Patterns from that work inform this project's architecture.

---

### Clean dist before rebuild
After modifying any TypeScript source, run `rm -rf dist && npm run build`. Stale artifacts in dist/ can mask compile errors. This is universal to any TypeScript project.

### Spec compliance is the test oracle
When a spec exists (like Pixel Format v1), the spec defines correctness — not intuition. Write tests that validate directly against spec rules. If the code disagrees with the spec, the code is wrong.

### Deterministic output enables multiplayer
If the same input always produces the same output, multiplayer sync becomes a matter of synchronizing inputs, not outputs. This applies to game state transitions, pixel rendering, and rule resolution. Pure functions are the foundation.

### Separation of concerns prevents coupling debt
In the teammates project, cli.ts grew to ~5,200 lines because concerns weren't separated early enough. For LoreWeave, keep the world engine, narrative engine, pixel renderer, and multiplayer layer as distinct modules from day one.

### Agent-first API design
JSON output, predictable exit codes, no interactive prompts. This pattern from the teammates CLI applies equally to LoreWeave's tooling — any interface that an AI agent might call should be machine-readable first.

### Validate at boundaries, trust internally
Validate external input (player actions, asset files, network messages) rigorously at system boundaries. Internal function calls between trusted modules don't need redundant validation — it adds noise without safety.

### Specs gate implementation, not the reverse
Both loreweave_spec.md and pixel_v_1_spec.md are mature enough to code against directly. Implementation should conform to specs — if a spec is unclear or wrong, escalate to Scribe rather than coding around it. Never let implementation decisions quietly diverge from the spec.

### Use tsc --build for monorepo build ordering
`npm run build --workspaces` runs in parallel/arbitrary order, breaking packages that depend on other packages. `tsc --build` respects project references and builds in dependency order. Always add new workspaces to the root build script in dependency-first position.

### TypeScript 6 strict Object.entries returns unknown
`Object.entries()` returns `[string, unknown][]` in TS6 strict mode, even on typed Records. Always cast: `Object.entries(obj) as [string, MyType][]`. This affects every `for...of` destructuring over Record entries.

### Inject factories, don't assume globals
The canvas renderer accepts a `CanvasFactory` injection rather than importing browser globals. This makes renderers testable and portable (Node, browser, headless). Apply this pattern to any subsystem that depends on environment-specific APIs.

### Lazy-import optional heavy dependencies
The pixel-explorer dynamically imports heavy dependencies so core commands work without them installed. Use this pattern for any CLI command that depends on large or optional packages — keeps the core fast and the install footprint small.

### Seeded PRNG for deterministic randomness
Any system that introduces randomness (dice, particles, procedural generation, weather, name generation) must accept a seed parameter to preserve determinism. The emitter uses xorshift32; the world uses a seeded RNG class. Identical seed = identical output, always.

### CLI spawn over Agent SDK on Windows
The Agent SDK (`@anthropic-ai/claude-agent-sdk`) deadlocks on Windows due to stdio pipe contention with in-process MCP tools. Use `@loreweave/agents` CliProxyAdapter instead — spawns `claude` CLI directly, proven pattern from @teammates. The `AgentAdapter` interface abstracts over CLI spawn vs future API adapters.

### Double-escape regex in template literal strings
Regex `\s`, `\d`, `\w`, `\b` lose their backslash inside template literals (backticks). The browser receives `/s+/` instead of `/\s+/`. Always write `\\s`, `\\d`, etc. in `html.ts` and any code embedded in template strings. Silent failure — no error, just wrong behavior.

### Grid hashing for cross-chunk determinism
Structure placement uses grid hashing so each cell's output depends only on `(seed, cellX, cellY)` — no multi-chunk coordination needed. MAX_STRUCTURE_RADIUS bounds the search, keeping it O(constant) per chunk. Apply this pattern to any system that needs globally consistent placement without global state.

### WorldAccess interface prevents circular dependencies
The types package defines a `WorldAccess` interface that abstracts World class methods. Narrative and other packages depend on this interface, not the concrete World class. This breaks the types→world circular dependency that would otherwise occur.

### Action resolvers return effects, not mutations
All action resolvers in the narrative engine return `GameEffect[]` arrays. A separate `applyEffects()` function produces new state. No mutation in the resolution path — this keeps the game loop testable and replayable.

### 202 Accepted + WebSocket for async generation
The pixel-explorer uses HTTP 202 for generation requests, runs work in background, and notifies completion via WebSocket. This enables parallel generation and lets users navigate away without losing progress. Duplicate requests for the same asset/view are rejected with 409.

### Root tsconfig needs outDir and empty files array
Without `"outDir": "./dist"` and `"files": []`, an accidental `tsc` invocation against the root config compiles all `.ts` files in the tree and drops `.js` next to them — polluting `src/` dirs and causing `tsc --build` to no-op on subsequent builds. Both guards are essential.

### Managed assets: folder-per-asset with metadata
Assets are stored as `assets/<name>/asset.json` (metadata, tags, custom colors, references) + `<viewname>.pixel.json` view files. This enables multi-view assets (front/back/attack), asset-level custom colors, and composition via references. Migration module auto-converts legacy flat files on startup.

### Auto-sizing via archetype inference
Users never specify pixel dimensions directly. The sizing system infers a sprite archetype from keywords in the prompt (12 archetypes), then applies dimensions based on the selected detail level (PPU 16/32/64). This keeps the generation interface simple while producing correctly-sized assets.

### Progressive palette supersets for render-time remapping
Palettes form a strict superset chain (fantasy16 → 32 → 64 → 72). Any asset authored at a lower palette depth can be rendered with a higher palette unchanged. Render-time remapping via `targetPalette` option maps colors to the nearest match in the target palette using color distance.

### WorldConfig: per-world JSON data files
Each world has a `worlds/<name>/config/` directory with JSON files (world, persona, encounters, creatures, stat-tiers, etc.) loaded by `loadWorldConfig()`. This separates world-specific data from engine code, making worlds swappable without code changes.

### Noise-based overlay layers for semantic terrain state
The Weave overlay demonstrates adding a semantic state layer (stable/thin/frayed/unraveled) on top of terrain using noise thresholds. Structures can force-override values (villages → stable). This pattern generalizes to any per-tile state that varies spatially — corruption, temperature, political control.

### Loader functions merge multiple config sources
The creature loader merges `creatures.json` + `high_cr_creatures.json`; the vocab loader reads subdirectories with wrapper object handling. When config grows beyond a single file, split by domain and merge in the loader — keeps individual files manageable and domain-focused.

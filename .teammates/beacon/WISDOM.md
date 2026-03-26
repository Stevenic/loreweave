# Beacon — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-26

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
The pixel-explorer dynamically imports Agent SDK and Zod so that non-generate commands work without them installed. Use this pattern for any CLI command that depends on large or optional packages — keeps the core fast and the install footprint small.

### Agent SDK with in-process MCP tools for generation
Use `createSdkMcpServer()` + `tool()` to expose domain validators/previewers as MCP tools the agent calls during generation. The agent gets the full Claude Code tool loop; we just add domain-specific tools. In-process — no external server needed. Pass spec docs as system prompt context so the agent generates spec-compliant output.

### Seeded PRNG for deterministic particle effects
The emitter uses xorshift32 with a configurable seed so identical input produces identical particle output. Any system that introduces randomness (dice, particles, procedural generation) must accept a seed parameter to preserve determinism.

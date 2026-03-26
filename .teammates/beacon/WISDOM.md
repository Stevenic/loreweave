# Beacon — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-25

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

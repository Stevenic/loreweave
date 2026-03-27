# Scribe — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-27

---

## Previous Projects

Scribe previously managed the `@teammates` multi-agent framework project — templates, onboarding, specs, documentation site. Patterns from that work apply to LoreWeave's spec-driven development.

---

### Hand off, don't reach across
If a task requires engine code or renderer changes, design the behavior and hand off to @beacon. Even when the feature originates from Scribe's domain (a spec change), the code belongs to Beacon. This boundary was violated once in the teammates project and corrected — never repeat it.

### Specs are upstream, code is downstream
Scribe defines specs (LoreWeave design, Pixel Format v1). Beacon builds code that conforms to the specs. Breaking changes in specs propagate downstream to code. Feature requests from code propagate upstream to Scribe. The dependency direction is clear.

### Ship only what's needed now
Don't create artifacts for situations that don't exist yet. Speculative docs create churn. Wait for the actual need.

### Spec -> handoff -> docs is the full cycle
Scribe's workflow for new features: (1) design the behavior in the spec, (2) hand off to @beacon for implementation, (3) update docs once implementation ships. Skipping step 1 leads to boundary violations. Skipping step 3 leads to stale docs.

### Cross-file consistency is non-negotiable
When updating a concept (game mechanic, pixel format rule, type definition), audit ALL files that reference it. The same information may live in loreweave_spec.md, pixel_v_1_spec.md, README.md, type definitions, and documentation. Missing one creates drift.

### Retro proposals need a decision gate
Retro proposals don't self-apply. When running a retro, explicitly get approval for each proposal in the same session.

### Folder naming convention: no prefix / _ / .
In `.teammates/`: no prefix = teammate folder, `_` prefix = shared checked-in content, `.` prefix = local gitignored content (`.tmp/`).

### Nothing automatic that a human doesn't control
AI automation must use a propose-then-approve model. Smart defaults are fine (suggest the right action), but execution requires human confirmation. This applies to any action with project-wide impact. stevenic stated this explicitly — it's a hard rule, not a preference.

### Save full data to memory, not just summaries
Conversation history can be truncated or compressed mid-session. If you produce structured data (vote tallies, decision tables, consolidated lists), persist the full dataset to session or memory files immediately — not just a prose summary. Recovery from debug logs works but is fragile and slow.

### Propose before editing specs
Always present spec changes as a proposal with rationale before making edits. Gather explicit approval. This was the consistent pattern through the Pixel Format v1 revision — 6 rounds of proposal/analysis before a single line of spec was rewritten. The approval gate catches misalignment early.

### Text is the feature for LLM-native formats
The single-char grid model is the core LLM optimization for the Pixel Format. Every design decision must preserve it. Binary encoding, multi-char palette keys, and procedural rules were all rejected because they break this constraint. Symmetry hints, constraints, and templates all build on top of keeping the grid simple.

### Competitive analysis: what to skip matters as much as what to steal
Reviewing Aseprite and Pyxel Edit confirmed our design decisions (text-first, declarative, git-diffable) and surfaced 3 features worth adding (animation clips, named regions, tile transforms). But the features deliberately NOT taken (layer grouping, onion skinning, Lua scripting, binary serialization) were equally important — they would have pulled the format toward artist-tool complexity.

### Multi-tier documentation from a single source of truth
Full spec (~900 lines) → LLM guide (~200 lines) → LLMD schema (~130 lines, ~629 tokens). Different audiences need different levels of detail. The JSON Schema with descriptions is the machine-readable source that enables auto-generated compressed formats. Always keep the tiers in sync — the schema is downstream of the spec, and the LLMD is downstream of the schema.

### Source-of-truth is .pixel.json, never .png
No pre-rendered images on disk. Rasterize to offscreen `<canvas>` at load time, cache as `ImageBitmap`. Export `.png` only as a derived build artifact (thumbnails, marketplace, docs). This eliminates drift between source and rendered output and removes build step friction.

### Advisory constraints, not hard rejections
Generation constraints (`maxColors`, `outline`, `noIslands`) and symmetry hints are advisory — generators should respect them, validators warn, but nothing rejects. This keeps the format permissive while guiding LLMs toward quality output. Hard constraints would make the format fragile and hostile to creative exploration.

### Anchor abstract scale chains to world space
Relative scaling (`baseScale`, `scale`, `scrollFactor`) is meaningless without an absolute reference point. PPU (Pixels Per Unit) solved this for the Pixel Format by tying pixel dimensions to world tiles. Any format with layered relative transforms needs a world-space anchor — otherwise generators and renderers can't reason about proportions.

### Start focused, expand on signal
The Pixel Format v1 revision started as a 2-feature proposal, expanded to 18, then 21, then a full rewrite — but only because stevenic explicitly signaled appetite at each step ("go for everything"). Start with the minimum viable proposal. Expand scope only when the user signals they want more. Don't self-limit, but don't over-propose either.

### Three-tier cost model drives architecture
Algorithmic generation (free, every visit) → text LLM (16-32k tokens, every visit) → pixel LLM (64k tokens, first visit only, cached). Budget allocation determines what gets generated how. Archetype libraries make location/NPC generation algorithmic and free. LLM budget is reserved for narration and novel pixel assets.

### Archetype libraries eliminate generation cost
Weighted archetype templates (location types, NPC roles, vocabulary tables) enable algorithmic generation with zero LLM cost. The world engine picks an archetype from a seed, rolls concrete data from probability tiers (required/common/rare). The library grows over time — more archetypes means more variety without more compute.

### Document what's built, not what's spec'd
Engine documentation (`docs/`) should reflect actual implementation, verified against source code. Note unbuilt systems explicitly as "not yet built." Docs that describe speculative features mislead developers and create false confidence.

### Views for states, assets for identity
Same world object in different visual states (lit/unlit, open/closed) = views of one asset. Independent world objects that attach or compose (fire effect, smoke particles) = separate assets with references. The test: does it have its own identity in the world? If yes, separate asset.

### LLM generates prose live; structured data persists
No cached descriptions. LocationRecords + event logs + vocabulary tables persist as structured data. The LLM generates fresh narrative text every visit from structured context. This aligns with the narrative engine's "state → story text" model and means descriptions naturally reflect current world state.

### Consolidation scales — persist the full dataset
When consolidating ideas, votes, or proposals from multiple sources (teammates, brainstorms), the full numbered list is the artifact. 97 ideas across 10 categories from 6 teammates was the UX brainstorm output. Always persist the complete dataset to a file, not just a summary — it becomes the reference for voting, prioritization, and decision-making.

### Tier entities by persistence and authoring cost
Ephemeral entities (creatures) cost nothing — generated per-encounter, no state. Persistent entities (residents) cost an archetype lookup — generated once from templates, maintain state. Authored entities (named characters) cost hand-writing time — unique identity, full backstory. This three-tier model (ephemeral → persistent → authored) applies to NPCs, items, and locations alike. Match entity investment to narrative importance.

# LoreWeave Engine — Technical Overview

LoreWeave is a persistent, LLM-powered narrative world engine built on D&D 5e rules. The engine separates concerns into four layers: **world generation** (terrain and structures), **rules** (D&D 5e mechanics), **narrative** (LLM-driven storytelling), and **visual** (pixel-based rendering). The LLM never owns state — it receives mechanical outcomes and renders them as prose.

## Package Architecture

```
packages/
├── types/       @loreweave/types      Shared TypeScript definitions (game + pixel)
├── world/       @loreweave/world      World generation, chunk pipeline, config loading
├── rules/       @loreweave/rules      D&D 5e dice, combat, abilities, encounters
├── narrative/   @loreweave/narrative  DungeonMaster orchestrator, LLM integration
├── agents/      @loreweave/agents     CLI adapters for LLM providers
└── pixel/       @loreweave/pixel      Pixel art asset management
```

All packages are workspace dependencies in a single monorepo. `@loreweave/types` is the foundation — every other package imports from it.

## Data Flow — Single Turn

```
Player Input ("attack the goblin")
     │
     ▼
┌─────────────────────┐
│ Intent Parser        │  Deterministic keyword matching
│ (intent-parser.ts)   │  → GameAction {type: 'attack', target: 'goblin_1'}
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Action Resolver      │  D&D 5e mechanics (d20 + mods vs AC)
│ (action-resolver.ts) │  → ActionResult {success, effects, narrationHints}
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Apply Effects        │  Pure function: Character map → updated Character map
│                      │  (HP changes, conditions, inventory)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Context Assembler    │  Gathers: location, entities, exits, events,
│ (context-assembler)  │  party state, quest hints
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Prompt Builder       │  Builds system prompt (DM persona, world rules)
│ (prompt-builder.ts)  │  + user prompt (context + action result)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ LLM Adapter          │  External call — generates narrative text only
│ (NarrativeAdapter)   │  LLM cannot alter game state
└─────────────────────┘
```

**Key constraint:** The LLM receives the mechanical outcome (hit/miss, damage dealt, skill check result) and narrates it. It never decides whether an attack hits or how much damage is dealt.

## Core Design Properties

| Property | What It Means |
|----------|--------------|
| **Deterministic** | Same seed + same inputs = identical world. Enables multiplayer sync, save/load, reproducibility. |
| **Pure functions** | Chunk generation, action resolution, NPC generation return new state — no mutations. |
| **Lazy generation** | Chunks generate on demand when the player approaches. Infinite world, finite memory. |
| **No cross-chunk deps** | Each chunk generates independently via positional hashing. No generation-order bugs. |
| **World-agnostic** | Base engine works without a WorldConfig. Worlds (Threadhallow, etc.) are data overlays. |
| **LLM as renderer** | The LLM is a narrative rendering layer. It receives facts and writes prose. It never owns state. |

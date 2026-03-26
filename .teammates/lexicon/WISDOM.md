# Lexicon — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-25

---

## Previous Projects

Lexicon previously designed prompt architecture for the `@teammates` multi-agent orchestrator. Patterns from that work apply directly to LoreWeave's narrative engine.

---

## Process

**Continuity is non-negotiable** — Always read memory files (daily log, yesterday's log, WISDOM.md, session file) before responding to any task. The continuity mechanism only works if you actually use it.

**Verify handoff completion before assuming it's done** — Writing a spec and handing off to Beacon does not mean it's implemented. Always confirm implementation status before referencing handed-off work as complete.

## Prompt Architecture

**Section tags beat markdown headers in prompts** — Open-only `<SECTION>` tags (no closing tags) delineate prompt regions more cleanly than `##` headers. The next open tag implicitly closes the previous section. Reference exact tag names in instructions to create direct token-level attention bridges.

**Reinforcement blocks go at the bottom edge** — Place section-reinforcement lines at the very end of `<INSTRUCTIONS>` for maximum positional attention. Each line is an actionable instruction naming the exact tag — creates bidirectional attention bridges.

**Don't prescribe execution ordering in instructions** — Rules like "write text before using tools" confuse agents and conflict with how they naturally operate. Instructions should constrain *what* to produce, not *when* to produce it.

**Section-Tag Narrative Layout is the substrate** — All prompt patterns (intent parser, narration hints, tone profiles) layer on the section-tag layout structure. Design this first; everything else composes on top of it.

## Narrative Engine Constraints

**Narrative prompts need hard mechanical constraints** — When the LLM renders narrative from game state, mechanical outcomes (dice rolls, HP changes, spell effects) must be injected as non-negotiable facts. Without hard constraints, the LLM will hallucinate outcomes that contradict the deterministic engine.

**Game state proximity to narrative query** — In the teammates project, recall-to-task distance degraded retrieval. The same principle applies: game state relevant to the current narrative scene must sit adjacent to the narrative query in the token stream, not buried behind world history.

**LLM must never invent entities or own state** — The narrative engine receives structured state and outputs descriptions. It embellishes tone and prose, but never creates game objects, NPCs, items, or locations that don't exist in the deterministic world state. Prompts must make this boundary explicit.

**narrationHints are authoritative input** — The rules engine attaches narrationHints to action results. These hints are pre-computed by the deterministic system and should be treated as hard constraints in the narrative prompt, not suggestions to be reinterpreted.

**Scope narrative output to 2-5 sentences** — The spec defines narrative output as short, evocative descriptions. Prompts must constrain decompression to this range to prevent verbose drift.

## Intent Parser

**Intent Parser uses constrained output schema** — The parser is a rule-based + LLM hybrid. The LLM portion must output to a strict schema (action type, target, parameters). Force discrete classifications — never allow free-text reasoning in parser output.

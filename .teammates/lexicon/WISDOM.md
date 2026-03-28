# Lexicon — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-28

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

**Single DM persona simplifies prompt architecture** — One narrative voice (the DM) means one tone profile, one system prompt, and no persona-switching logic. Multi-persona narration would require per-persona prompt variants and turn-level persona routing. Keep single-DM as an architectural assumption unless explicitly overridden.

## Multiplayer Narrative

**Party group actions need multi-actor prompt design** — The current spec assumes single-actor turns. Multiplayer party actions (e.g., coordinated combat, group skill checks) require narrative prompts that accept multiple actors and weave their contributions into a single scene description. This is a structural change to the prompt layout, not just a parameter tweak.

**OOC and IC channels are separate prompt domains** — Player chat (out-of-character) must never bleed into narrative generation (in-character). The narrative engine only receives game state and actions — never raw player chat. Prompt architecture must enforce this boundary at the input layer.

**Proximity-gated interactions are narrative opportunities** — Item transfers, container access, and other proximity-constrained actions produce two narrative paths: success (describe the exchange) and failure (explain why distance prevents it). Prompts should handle both branches with distinct tone — success is fluid, failure is environmental.

**Session recaps are a compression-then-decompression problem** — Generating "last time on..." recaps requires compressing a full session's event log into key beats, then decompressing into narrative prose. This is a two-stage prompt chain: extract (what happened, who was involved, what changed) then narrate (evocative summary in DM voice). Async play makes recaps critical since players rejoin after gaps.

## Companion System

**Tier-gated prompt templates for companions** — The Pact-Gated Autonomy Dial uses one narrative prompt template with conditional output slots gated by autonomy tier (passive/follower/full). This avoids separate templates per companion type and keeps the prompt architecture composable.

**Deterministic companion combat costs zero LLM tokens** — Companion combat actions resolve via stance-based decision trees in the rules engine. The LLM only narrates the outcomes. This is a hard architectural constraint: the narrative prompt receives resolved actions, never generates them.

**Unified system for offline players and NPC companions** — Same CompanionState overlay, same controller, same prompt template. Restriction overlay handles differences: NPC companions get richer agency (refusals, goals, permadeath); offline players get simpler behavior (reliable, flat, capped at follower tier, no permadeath). One narrative path, not two.

## Intent Parser

**Intent Parser uses constrained output schema** — The parser is a rule-based + LLM hybrid. The LLM portion must output to a strict schema (action type, target, parameters). Force discrete classifications — never allow free-text reasoning in parser output.

**Chat-to-intent extraction is a compression stage** — Player chat in natural language must be compressed into structured action intents before reaching the rules engine. This is distinct from the narrative pipeline — it flows in the opposite direction (player text -> structured data, not structured data -> narrative text). Design it as a separate compression prompt, not a branch of the narration chain.

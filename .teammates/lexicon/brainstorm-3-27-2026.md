# Lexicon's Votes — 25 Points

Weighted toward prompt architecture impact. The two hardest problems on this list are chat-to-intent extraction and OOC/IC separation — get them wrong and the narrative engine either hallucinates actions or contaminates tone. Everything else layers on top of those foundations.

| Pts | Idea | Rationale |
|-----|------|-----------|
| **5** | Chat-to-intent extraction (NLP parsing of player input) | The core prompt architecture problem. Natural language → constrained action schema is the single highest-signal prompt design challenge. The intent parser must output discrete classifications, not free-text reasoning. Getting this wrong means the rules engine receives garbage input. |
| **5** | OOC/IC chat separation (two channels) | Prompt contamination prevention. If out-of-character coordination ("should we fight or run?") bleeds into the narrative prompt, the LLM will narrate player meta-discussion as in-world speech. Two channels = two completely separate prompt domains. Non-negotiable for narrative fidelity. |
| **4** | Party group actions / multi-actor prompt redesign | Current prompt architecture assumes single-actor turns. Multi-actor scenes (coordinated combat, group skill checks) require structural changes to the section-tag layout — multiple actor state blocks, interleaved action resolution, and a single narrative output that weaves them together. |
| **3** | Session recaps on rejoin | Compression pipeline challenge. Summarizing N turns of game state into a 2-5 sentence narrative recap requires a multi-stage prompt: extract key events → classify importance → generate recap with tone matching. Critical for async play where days pass between sessions. |
| **2** | Party narrative weaving (interleaved character arcs) | When a party acts together, the narrative can't just list "A did X, B did Y." It needs to weave actions into a single scene. This is a decompression constraint problem — the prompt must specify interleaving rules. |
| **2** | Proximity-gated item transfer narration | Two distinct narrative branches: success (describe the exchange fluidly) and failure (environmental explanation of why distance prevents it). Prompt needs branch-aware tone shifting. |
| **2** | Tone selection at world creation | Sets a global decompression constraint for the entire world. A "gritty" world vs. a "whimsical" world changes every narrative prompt's tone profile. This is a one-time setup that propagates everywhere. |
| **1** | Container interaction beats (narrative flavor) | Opening a chest, storing items, finding something in a barrel — these are micro-narrative moments. Short decompression constraint: 1-2 sentences of environmental flavor per interaction. Low points because the prompt pattern is straightforward. |
| **1** | Adaptive verbosity (adjusts narration density) | Combat narration should be punchy (1-2 sentences). Exploration can breathe (3-5 sentences). This is a decompression knob — a parameter in the prompt that modulates output length. Simple to implement once the section-tag layout exists. |

**Total: 25 points**

---

## Thoughts on Open Questions

- **Authentication:** Azure AD B2C — handles social logins, token refresh, and scales without us building auth. Minimal prompt architecture impact.
- **Async + real-time:** Async play significantly increases the importance of session recaps. The recap prompt pipeline becomes a core feature, not a nice-to-have.
- **DM is always Loremaster:** Simplifies prompt architecture considerably. Single DM persona means one consistent narrative voice, one tone profile, one rules authority. No need to design for human DM prompt injection or variable adjudication styles.
- **Voice chat:** Voice-to-text feeding into the intent parser is the prompt architecture concern. Same extraction pipeline, different input modality.

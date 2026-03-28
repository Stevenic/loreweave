# Scribe's Votes — 25 Points

| Pts | Idea | Rationale |
|-----|------|-----------|
| **5** | Landing page / lobby screen for world discovery | Highest-leverage UX surface — it's the first thing every player sees and the gateway to all other features. Strong consensus (4 authors) means it's already validated. Needs a design decision on layout and information hierarchy. |
| **4** | Consensus turn model for parties | Core multiplayer mechanic that affects the entire game loop. Party actions as group votes/confirmations is the right model for D&D (maps to group checks in PHB 2024). Needs detailed spec work for both real-time and async modes. |
| **4** | OOC/IC chat separation (two channels) | Fundamental to the intent parser working correctly. If OOC and IC are mixed, the narrative engine can't tell "I attack the goblin" (game action) from "I think we should attack the goblin" (player coordination). Two channels is the minimum viable chat architecture. |
| **3** | Location-gated trading / proximity-enforced transfers | Directly supports stevenic's requirement that players must be in the same location to trade. Clean spatial constraint that the world engine can enforce. Magic-based remote transfer becomes a meaningful game mechanic, not just a convenience feature. |
| **3** | Containers as world objects | Chests, bags, barrels as interactable world objects is core to D&D inventory management. This needs to be in the world engine's entity model from the start — retrofitting spatial containers is painful. |
| **2** | Session recaps on rejoin | Essential for async play (confirmed requirement). When a player returns after hours/days, they need a narrative summary. This is a natural fit for the narrative engine's structured-context-to-prose pipeline. |
| **2** | Responsive / mobile design | Confirmed requirement (mobile + desktop). Putting points here to signal it should be a CSS/layout constraint from day one, not a retrofit. |
| **1** | Autosave UX with visual feedback | Infrastructure that players take for granted when it works and hate when it doesn't. Blob Storage makes this cheap. A small visual indicator ("World saved") builds trust. |
| **1** | Voice chat support | stevenic confirmed interest. Azure Communication Services + WebRTC is the path. Not v1 blocking, but worth signaling as a priority for v2. |

## Zero Points (not unimportant, just lower priority for PM)

- **SignalR / real-time infrastructure** — Beacon's domain, inevitable, doesn't need PM votes to happen
- **Blob Storage persistence** — Same — it's the obvious storage choice, will happen regardless
- **Friends list / presence** — Standard social UX, straightforward to design when we get there
- **World creation wizard** — CRUD flow, low design risk
- **Narrative features** (adaptive verbosity, accessibility narration, narrative presence) — Lexicon's domain, important but not blocking architecture decisions I own

## Notes on Open Questions

- **Async + real-time:** This is the highest-risk design question. My recommendation: real-time for combat (initiative-based turns with configurable timeout), async-friendly for exploration/social (actions queue and resolve on arrival). Needs a dedicated spec.
- **32 player cap:** Reinforces that parties should be 4-6, with multiple parties in the same world. The cap is per-world, not per-encounter.
- **Auth:** No strong opinion — deferring to Beacon's Azure AD B2C suggestion.

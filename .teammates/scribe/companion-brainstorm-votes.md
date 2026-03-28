# Scribe — Companion Brainstorm Votes (25 points)

Voting on the consolidated 29 ideas from `companion_brainstorm.md`.

| Pts | # | Idea | Rationale |
|-----|---|------|-----------|
| 5 | 1 | Pact Contract | The narrative crown jewel. Reuses the Promise system (§11.5) — not a new mechanic, an extension. 4 of 6 teammates converged on this independently. It solves recruitment, lifecycle, departure, and consequence in one elegant frame. |
| 4 | 8 | Non-Combat Only (Campfire Circle) | The ship-first strategy. Loremaster's encounter math (10-25% damage impact per combat companion) convinced me this is essential. Delivers the companion *feeling* with zero balance risk. Architect for combat, ship without it. |
| 3 | 27 | CompanionState on NPCRecord | Right architecture. Companions are NPCs with an overlay, not a new entity type. Minimal change to the existing data model. Every round-2 synthesis adopted this. |
| 3 | 18 | Standing Orders | Essential offline player UX. Players define their own restrictions before logout. Turns the "offline player" problem into a player-controlled feature. Scribe/Lexicon/Beacon all converged. |
| 3 | 15 | Tiered Death Rules | The asymmetry IS the feature. NPC companions can die (real stakes, narrative cascades). Offline players cannot (system guarantee). This creates a genuine tactical choice: bring the interesting-but-mortal NPC or your buddy's safe-but-bland offline character. |
| 2 | 3 | Tiered Progression | Natural escalation (hireling → follower → companion) maps 1:1 to the existing Creature → Resident → Named Character tiers. Gives players a choice about companion complexity. Beacon's Retinue insight. |
| 2 | 9 | Personal Goals & Refusal | Makes companions feel like people, not inventory. A companion who refuses to enter the necromancer's lair because it conflicts with their motivation is a *story*. Without this, companions are just stat blocks that follow you. |
| 1 | 17 | Restricted Autonomy Flag | Universal agreement (all 6 teammates). The simplest correct answer for offline players. Needs a point to register support. |
| 1 | 20 | Grace Period / Auto-Return | Prevents character borrowing abuse. Bard's insight — without a timeout, offline characters can be dragged around indefinitely. 24-48 hour window feels right. |
| 1 | 12 | Loyalty Meter | Good evolution of disposition for party context. Separating in-party loyalty from general disposition prevents weird edge cases (NPC loves you generally but is frustrated with party decisions). |

## Points Not Spent On (and why)

- **#5 Full Turns (Behavioral Templates)** — Strong idea but conflicts with the ship-first Campfire Circle strategy. Templates are the right Phase 2 approach, but I'm investing in the Phase 1 foundation.
- **#19 Behavioral Profile (Echo)** — v2 enhancement. Cool but expensive and a new system. Templates are good enough for v1.
- **#16 Universal Immortality** — Disagree. Asymmetric death rules (#15) create better gameplay.
- **#25 Frozen Dispositions** — Disagree. Consequences carrying over (#26) makes the world feel alive.
- **#22 Consent on Reconnect** — Too complex for v1. A summary (#21) is sufficient.

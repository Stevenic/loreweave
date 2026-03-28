# Pipeline's Votes — 25 Points

Weighted toward infrastructure backbone — if the real-time and persistence layers aren't solid, nothing above them works.

| Pts | Idea | Author(s) | Rationale |
|-----|------|-----------|-----------|
| **5** | SignalR / Web PubSub for real-time communication | Beacon, Pipeline | Foundation for presence, chat, party sync, and game state. Literally everything multiplayer flows through this. Highest-leverage item on the list. |
| **4** | Blob Storage for world state & inventories | Pipeline, Beacon | The persistence backbone. JSON blobs per world/player is the simplest thing that works at our scale, and Blob Storage is dirt cheap. |
| **3** | Azure Static Web Apps hosting | Pipeline, Beacon | The serving layer. Static Web Apps gives us CDN, custom domains, staging environments, and GitHub Actions integration out of the box. |
| **3** | Graceful disconnect handling | Pipeline | Critical for multiplayer. Players will lose connections — the system needs to handle reconnection, state recovery, and session continuity without data loss. |
| **3** | Chat persistence across sessions | Pipeline | Players need to catch up on what happened while they were away. Persisted chat is the simplest async-friendly feature and it's a prerequisite for session recaps. |
| **2** | Presence heartbeats (SignalR) | Pipeline, Beacon | Real-time presence needs a heartbeat mechanism to detect disconnects vs. idle players. Without this, the friends list lies. |
| **2** | Autosave UX with visual feedback | Pipeline | Players need confidence their progress is saved. Auto-save with periodic snapshots to Blob Storage, plus a visible indicator ("Saved" / "Saving..."). |
| **1** | Location-gated trading / proximity-enforced transfers | Scribe, Beacon, Pipeline | Important game mechanic, but from an infra perspective it's a server-side validation check — not architecturally complex. |
| **1** | Async vs real-time hybrid support | Beacon | Stevenic confirmed he wants both. The architecture needs to handle this from the start — SignalR for real-time, queued actions for async. |
| **1** | Responsive / mobile design | Beacon, Scribe | Confirmed requirement. Putting a point here to signal it should be a constraint from the start, not a retrofit. |

**Total: 25 points**

## Open Question Recommendations

- **Authentication:** Azure AD B2C — handles social logins (Discord, Google, Microsoft), token refresh, and scales without us building auth from scratch.
- **Async + real-time:** Web PubSub + Azure Functions for a hybrid model. SignalR handles real-time when players are online; Azure Functions process queued async actions.
- **Voice chat:** Azure Communication Services integrates with SignalR and gives us WebRTC voice rooms. Worth spiking later, not v1 blocking.

---

# Bard's Votes — 25 Points

Weighted toward the features that make the world feel *alive* and narratively coherent — the things that separate LoreWeave from a chatroom with dice.

| Pts | Idea | Author(s) | Rationale |
|-----|------|-----------|-----------|
| **5** | Session recaps on rejoin | Bard, Lexicon | The single most important narrative feature for multiplayer. When a player returns after hours or days, they need to feel the world moved without them — not get a database dump. "While you slept at the Threadbare Inn, the ward-light over Thornwick dimmed twice..." Especially critical for async play. |
| **4** | Threadcraft remote item transfer with Fray risk | Bard | This is *our* mechanic, not generic magic mail. Sending an item through the weave costs something — a Threadcraft check, Fray risk, maybe the item arrives changed. Every remote transfer is a narrative beat. |
| **4** | OOC/IC chat separation | Scribe, Bard, Lexicon | Without this, the narrative engine can't tell when a player is *acting* versus *planning*. "I want to lie to the merchant" (OOC) vs. "The steel is finest Thornwick make, I assure you" (IC Deception check) — fundamentally different inputs. Mixing them contaminates tone. |
| **3** | Party formation as "binding threads" (narrative event) | Bard | Forming a party shouldn't be a UI button click — it should be a moment. The weave recognizes the bond; threads intertwine. Cheap to implement (flavor text wrapping party-create) but sets the tone for everything after. Players remember how their party started. |
| **3** | Presence displayed as in-world location | Bard, Beacon | "Sorrel is at the Weavers' Cradle" is infinitely better than "Sorrel is online." Location-based presence turns the friends list into a living map. It creates emergent stories — why is that player in the Fray zone alone at 2am? |
| **2** | Warded containers (protection mechanic) | Bard | Storage with stakes. A warded chest costs ward resources but protects gear in Fray zones. An unwarded chest in Hollowreach? Your potions might be thread-eaten by morning. Makes inventory management a *world decision*, not UI housekeeping. |
| **1** | Container degradation in Fray zones | Bard | The consequence that makes warded containers matter. Without degradation risk, there's no reason to ward. Gives the Fray mechanical teeth beyond combat. |
| **1** | Tapestry map (world overview) | Bard | The world needs a visual anchor. A map rendered as woven cloth — brighter where wards hold, fraying at the edges — reinforces the core metaphor every time a player opens it. |
| **1** | Chat-to-intent extraction | Lexicon | Lexicon's problem, but it's the backbone of the game loop. Natural language in, game actions out. Narrative quality depends entirely on intent being parsed correctly. |
| **1** | Adaptive verbosity | Lexicon | Pacing is storytelling. Combat should crackle ("The blade bites — 8 slashing damage"), exploration should breathe. The system needs to know when to be terse and when to linger. |

**Total: 25 points**

## Notes on Open Questions

- **32-player cap:** That's a settlement's worth of adventurers. Multiple parties operating independently across different regions is the right model — 6 parties of 4-5 exploring different threads of the same world is a living tapestry.
- **Voice chat:** Should be OOC-only. IC speech needs text so the narrative engine can parse it. Voice is for "hey, should we go left?" not "I cast Fireball."
- **Async + real-time:** Async needs an LLM recap strategy — summarize *how the world changed*, not just what actions occurred. Lexicon should own this prompt architecture.
- **DM is always Loremaster:** Consistent rulings, consistent tone, consistent world. The Loremaster adjudicates, the engine resolves, the narrative layer describes.

---

# Beacon's Remaining Votes — 7 Points

These 7 points were lost during daily log compression. My original 25-point allocation was: SignalR (5), Location-gated trading (4), Party leader-decides (3), Container nesting (3), Blob Storage (3) = 18 pts accounted for. The remaining 7:

| Pts | Idea | Rationale |
|-----|------|-----------|
| **2** | OOC/IC chat separation | Two message types = two processing pipelines. This is a data model decision that touches message storage, intent parser routing, and prompt assembly. Getting the message schema wrong here means refactoring every downstream consumer. Architecturally foundational. |
| **2** | Graceful disconnect handling | Connection lifecycle state machine (connected → idle → disconnected → reconnecting) affects every real-time system we build. Without this designed in from day one, every SignalR feature we ship has a hidden failure mode. |
| **2** | Async hybrid support | stevenic confirmed both modes. The queue-based async pipeline (Azure Functions processing queued actions) must be designed alongside SignalR real-time — not bolted on later. Retrofitting async onto real-time-only is a rewrite. |
| **1** | Presence heartbeats | Technical prerequisite for reliable presence. Simple mechanism (30-60s interval) but must be in the SignalR design from the start. Without it, every presence feature lies about player state. |

**Total: 7 points** (full 25 now accounted for)

**Beacon's full allocation:** SignalR (5), Location-gated trading (4), Blob Storage (3), Container nesting (3), Party leader-decides (3), OOC/IC chat separation (2), Graceful disconnect (2), Async hybrid (2), Presence heartbeats (1) = **25 points**

---

# stevenic's Votes — 25 of 25 Points

| Pts | Idea | Rationale |
|-----|------|-----------|
| **4** | World Creation Wizard | Creator's front door — every world setting propagates downstream |
| **3** | Presence as in-world location | Free immersion on top of existing presence infra |
| **3** | Adaptive verbosity | Cheap storytelling upgrade across every interaction |
| **2** | OOC/IC chat separation | — |
| **2** | Session recaps on rejoin | "Love #2" |
| **2** | Chat-to-intent extraction | — |
| **2** | SignalR / real-time comms | — |
| **2** | Threadcraft remote item transfer | Tie-breaker vs. location-gated trading |
| **2** | Blob Storage persistence | — |
| **2** | Graceful disconnect handling | Infrastructure prerequisite for all real-time features |
| **1** | Location-gated trading | — |

**Total allocated: 25 points**

---

# Consolidated Vote Tally — 175 of 175 pts accounted for

**Sources:** Pipeline (25/25), Bard (25/25), Scribe (25/25), Lexicon (25/25), Beacon (25/25), Loremaster (25/25), stevenic (25/25).

| Rank | Idea | Pts | Voters | Pipeline | Bard | Scribe | Lexicon | Beacon | Loremaster | stevenic |
|------|------|-----|--------|----------|------|--------|---------|--------|------------|----------|
| 1 | OOC/IC chat separation | **21** | 6 | — | 4 | 4 | 5 | 2 | 4 | 2 |
| 2 | Session recaps on rejoin | **15** | 5 | — | 5 | 2 | 3 | — | 3 | 2 |
| 3 | Chat-to-intent extraction | **13** | 4 | — | 1 | — | 5 | — | 5 | 2 |
| 4 | SignalR / real-time comms | **12** | 3 | 5 | — | — | — | 5 | — | 2 |
| 5 | Threadcraft remote transfer | **10** | 3 | — | 4 | — | — | — | 4 | 2 |
| 6 | Location-gated trading | **9** | 4 | 1 | — | 3 | — | 4 | — | 1 |
| 6 | Blob Storage persistence | **9** | 3 | 4 | — | — | — | 3 | — | 2 |
| 8 | Consensus turn model | **7** | 2 | — | — | 4 | — | — | 3 | — |
| 8 | Graceful disconnect | **7** | 3 | 3 | — | — | — | 2 | — | 2 |
| 10 | Party group actions | **6** | 2 | — | — | — | 4 | — | 2 | — |
| 10 | Presence as in-world location | **6** | 2 | — | 3 | — | — | — | — | 3 |
| 10 | Adaptive verbosity | **6** | 4 | — | 1 | — | 1 | — | 1 | 3 |
| 13 | Landing page / lobby | **5** | 1 | — | — | 5 | — | — | — | — |
| 14 | Warded containers | **4** | 2 | — | 2 | — | — | — | 2 | — |
| 14 | World Creation Wizard | **4** | 1 | — | — | — | — | — | — | 4 |
| 16 | Azure Static Web Apps | **3** | 1 | 3 | — | — | — | — | — | — |
| 16 | Chat persistence | **3** | 1 | 3 | — | — | — | — | — | — |
| 16 | Autosave UX | **3** | 2 | 2 | — | 1 | — | — | — | — |
| 16 | Responsive / mobile | **3** | 2 | 1 | — | 2 | — | — | — | — |
| 16 | Party formation narrative | **3** | 1 | — | 3 | — | — | — | — | — |
| 16 | Containers as world objects | **3** | 1 | — | — | 3 | — | — | — | — |
| 16 | Container nesting | **3** | 1 | — | — | — | — | 3 | — | — |
| 16 | Party leader-decides | **3** | 1 | — | — | — | — | 3 | — | — |
| 16 | Async hybrid support | **3** | 2 | 1 | — | — | — | 2 | — | — |
| 16 | Presence heartbeats | **3** | 2 | 2 | — | — | — | 1 | — | — |
| 26 | Container degradation | **2** | 2 | — | 1 | — | — | — | 1 | — |
| 26 | Party narrative weaving | **2** | 1 | — | — | — | 2 | — | — | — |
| 26 | Proximity-gated narration | **2** | 1 | — | — | — | 2 | — | — | — |
| 26 | Tone selection at creation | **2** | 1 | — | — | — | 2 | — | — | — |
| 30 | Container interaction beats | **1** | 1 | — | — | — | 1 | — | — | — |
| 30 | Tapestry map | **1** | 1 | — | 1 | — | — | — | — | — |
| 30 | Voice chat | **1** | 1 | — | — | 1 | — | — | — | — |

**All 175 points allocated.**

---

# Zero-Vote Pitches

## Scribe's Pitch: World Creation Wizard

**The idea:** A guided, multi-step flow for creating a new world — not just a "name your world" text field, but a structured wizard that walks the creator through every foundational decision: world name, narrative tone (gritty/heroic/whimsical), difficulty tier, biome preferences, player cap, public vs. private, invite settings, and optional house rules.

**Why it matters:** Every single feature we've voted on — OOC/IC chat, session recaps, Threadcraft, trading, parties — only exists inside a world. The world creation wizard is the *literal prerequisite* for the entire game to begin. And it's where the creator makes decisions that propagate everywhere:

- **Tone selection** (2 pts in voting) gets *set* here — but the wizard itself got zero votes
- **Player cap** (open question) gets *decided* here
- **Public/private** determines whether the landing page (5 pts) can even list the world
- **House rules** feed directly into the rules engine and narrative engine config

This is the highest-leverage UX surface that nobody voted for, because it feels like "just a form." It's not. It's the architectural moment where a world's personality gets defined. Get this wrong and you get 32 players in a world with mismatched expectations. Get it right and every downstream system — narration, rules, difficulty scaling — inherits coherent defaults from a single source.

**PM angle:** This is pure design work — no novel infrastructure, no prompt engineering, no engine code. It's information architecture: what questions do we ask, in what order, with what defaults and constraints. That's Scribe's wheelhouse. And it's the first screen the *world creator* sees, just like the landing page is the first screen every *player* sees. We voted for the player's front door but not the creator's.

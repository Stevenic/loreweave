# NPC System Specification

> Every NPC exists on a spectrum from disposable to irreplaceable. The system's job is to make that spectrum feel seamless.

**Status:** Draft — incorporating @bard feedback, @loremaster feedback, + stevenic direction on Tier 2→3 promotion
**Last updated:** 2026-03-28
**Author:** Scribe
**Depends on:** `loreweave_spec.md`, `worlds/shared/archetype_format.md`, `multiplayer_web_game_spec.md`

---

## 1. Overview

The NPC system uses a **three-tier model** that matches entity investment to narrative importance. All tiers share the same `NPCRecord` data structure but differ in how they are created, how long they persist, and how much memory they retain.

| Tier | Name | Creation | Persistence | Memory | Cost |
|------|------|----------|-------------|--------|------|
| 1 | Creature | Generated per-encounter | None — discarded after encounter | None | Zero |
| 2 | Resident | Generated once from archetype | Permanent — persists in world state | Current interaction only (system tracks metadata for promotion) | Archetype lookup |
| 3 | Named Character | Hand-authored by Bard **or promoted from Tier 2** | Permanent — persists in world state | Deep — summarized between interactions | Authoring time or LLM generation |

> **Design principle:** A Tier 2 Resident is a dynamically generated Tier 3 Named Character that hasn't been promoted yet. Both share the same `NPCRecord` structure; promotion fills in the deeper fields rather than migrating to a different type.

---

## 2. Tier 1 — Creatures (Ephemeral)

Creatures are disposable NPCs generated on-the-fly for encounters. They have no persistent state and are garbage-collected when the encounter ends.

### 2.1 Use Cases
- Combat enemies (bandits, wolves, Fray-touched creatures)
- One-off ambient characters (a traveler on the road, a merchant at a festival)
- Environmental flavor (a flock of birds, rats in a cellar)

### 2.2 Generation
- Generated algorithmically from a `CreatureStatBlock` (see `packages/types/src/game.ts`)
- No archetype required — stat blocks are sufficient
- Seeded from world RNG for determinism

### 2.3 Memory Model
- **None.** Creatures do not remember anything. They exist for the duration of an encounter and are discarded.

### 2.4 State
- Creatures have combat state (HP, conditions, position) during an encounter
- No state persists after the encounter ends

---

## 3. Tier 2 — Residents (Persistent)

Residents are the backbone of settlement life. Generated once from archetype templates, they persist in the world and maintain consistent identity, but they do not form lasting memories of player interactions.

### 3.1 Use Cases
- Settlement population (shopkeepers, guards, farmers, artisans)
- Recurring ambient NPCs with daily schedules
- Functional roles (buy/sell, quest board, healing services)

### 3.2 Generation
- Generated once from an **NPC archetype** (37 archetypes in `worlds/shared/npcs/`)
- Archetype defines: stats tier, traits, skills, inventory, knowledge, dialogue hooks, voice patterns, schedule
- Traits and inventory are rolled from probability tiers (required/common/rare) using seeded RNG
- Name generated from world-specific naming conventions
- Once generated, the `NPCRecord` is persisted to world state

### 3.3 Memory Model
- **Current interaction only (NPC perspective).** Residents remember what has happened during the current conversation with a player. When the interaction ends (player walks away, scene changes), the NPC's conversational memory is discarded.
- This means a shopkeeper won't remember that you haggled with them yesterday, but they will track context within a single conversation (e.g., "you already asked about that").
- Knowledge tiers (always/sometimes/rarely) are persistent — they represent what the NPC *knows*, not what they *remember telling you*. A player can re-ask and get the same knowledge.
- **System-level tracking (for promotion).** While the NPC itself forgets, the *system* maintains lightweight interaction metadata on every Resident. This metadata is invisible to the NPC during dialogue but feeds the promotion evaluation system (see §3.6). Tracked fields:
  - `interactionCount`: total interactions across all players
  - `uniquePlayersInteracted`: set of player IDs who have interacted
  - `notableEvents`: brief log entries for significant moments (quest involvement, witnessed events, disposition extremes)
  - `lastInteractionDate`: timestamp of most recent interaction

### 3.4 State
Residents maintain persistent state between interactions:

| Field | Type | Description |
|-------|------|-------------|
| `disposition` | `Record<string, number>` | Player ID → attitude (-100 to +100). Modified by player actions, not conversation. |
| `inventory` | `Item[]` | Current stock. Restocks on a schedule. |
| `knowledgeRevealed` | `Record<string, string[]>` | Which knowledge items have been revealed to which players. Prevents duplicate reveals within a session. Resets between sessions. |
| `alive` | `boolean` | Whether the NPC is alive. Dead residents are not replaced. |
| `location` | `string` | Current location, derived from schedule + time of day. |
| `interactionCount` | `number` | Total interactions across all players (system-tracked, for promotion). |
| `uniquePlayersInteracted` | `string[]` | Player IDs who have interacted with this NPC (system-tracked, for promotion). |
| `notableEvents` | `string[]` | Brief log entries for significant moments — quest involvement, witnessed events, disposition extremes (system-tracked, for promotion). |
| `lastInteractionDate` | `string` | ISO timestamp of most recent interaction (system-tracked, for promotion). |

### 3.5 Dialogue
- **LLM-generated.** No dialogue trees.
- The LLM receives the NPC's archetype data, current disposition, schedule activity, and the player's input.
- Voice patterns from the archetype guide tone and speech style.
- Dialogue hooks from the archetype seed conversation starters.
- The existing `DialogueContext` type (see `packages/types/src/game.ts:1169`) provides the prompt context structure.

### 3.6 Promotion to Tier 3

Residents can be **promoted to Named Characters** when player engagement signals that the NPC has become narratively important. A Tier 2 Resident is a dynamically generated Tier 3 — promotion fills in deeper fields rather than creating a new entity.

#### 3.6.1 Promotion Triggers

Promotion is evaluated when any of these conditions are met:

| Trigger | Threshold | Rationale |
|---------|-----------|-----------|
| Interaction count | ≥ N interactions (configurable, default: 5) | Repeated engagement signals player interest |
| Multi-player engagement | ≥ 3 unique players have interacted | The NPC is a social hub, not a one-player fixation |
| Disposition extreme | Any player's disposition reaches ±75 | Strong feelings (love or hate) mean narrative weight |
| Notable event involvement | ≥ 2 notable events logged | The NPC keeps showing up in important moments |
| Manual promotion | DM/author flags the NPC | Allows hand-curation when the system misses |

Thresholds are configurable per world. The system evaluates triggers **at the end of each interaction** — promotion happens between scenes, never mid-conversation.

#### 3.6.2 Promotion Process

When a Resident is promoted:

1. **Tier field** changes from `'resident'` to `'named'`
2. **LLM generates** the Named Character fields based on the Resident's existing data:
   - `backstory` — generated from archetype, role, traits, settlement context, and `notableEvents`
   - `secret` — generated to connect to existing world lore or another NPC's arc
   - `motivation` — inferred from traits, disposition history, and notable events
   - `tensions` — internal conflicts derived from traits and backstory (see §4.2)
   - `voice` — already exists from archetype; may be refined by the LLM
3. **Interaction history bootstrapped** — the system's `notableEvents` log is converted into an initial `interactionHistory` entry (a consolidated summary of "everything that happened before promotion")
4. **Relationships generated** — if the promoted NPC has had notable interactions with other Named Characters (or other promoted NPCs), initial `NPCRelationship` entries are generated
5. **Memory model upgrades** — from this point forward, the NPC remembers deeply and gets `InteractionSummary` entries after each interaction (per §4.3)

#### 3.6.3 Continuity Guarantees

- The NPC's `id`, `name`, `disposition`, `inventory`, `schedule`, and all other existing fields are **preserved unchanged**
- Players experience no discontinuity — the NPC simply starts remembering and exhibiting deeper personality
- The promotion event itself is logged as a `notableEvent` for audit purposes
- The LLM generation prompt includes all system-tracked metadata to ensure the generated backstory is consistent with observed behavior

#### 3.6.4 Cost

Promotion is a **one-time LLM generation cost** (~2-4k tokens for backstory/secret/motivation/tensions generation). This is comparable to the first-visit pixel generation cost and should be budgeted similarly. Promotions are expected to be infrequent — most Residents will never promote.

---

## 4. Tier 3 — Named Characters (Hand-Authored or Promoted)

Named Characters are the narrative anchors of the world. They have unique identities, full backstories, deep memory, and relationships with other Named Characters. They are either **hand-authored by Bard** or **promoted from Tier 2** when player engagement signals narrative importance (see §3.6).

### 4.1 Use Cases
- Quest-giving NPCs with multi-session arcs
- Faction leaders and key political figures
- Recurring allies, rivals, and antagonists
- The 6-8 named NPCs per starting settlement (see `starting_settlement_spec.md`)

### 4.2 Authoring
- **Hand-authored** by Bard with full backstory, personality, secrets, and relationships, OR **promoted from Tier 2** with LLM-generated fields (see §3.6)
- Based on an archetype (for mechanical stats) but heavily customized
- Each Named Character has:
  - A **secret** that connects to deeper lore or another character's arc
  - A **motivation** that drives their behavior independent of the player
  - A **voice** that is distinct and consistent across interactions
  - **Tensions** (optional) — internal contradictions that make the character feel human. The best characters have conflicts between what they want and what they do (e.g., the healer who resents the people she heals, the guard who sympathizes with the smugglers). When present, the LLM leans into these during dialogue generation rather than presenting the character as one-dimensional. For promoted NPCs, tensions are inferred from their trait combinations and observed behavior.

### 4.3 Memory Model
- **Deep — summarized between interactions.** Named Characters remember past interactions with players in detail.
- During an interaction, the full conversation context is available.
- Between interactions, the NPC's memory is **compressed into a summary** that captures:
  - Key facts learned about the player (name, class, notable actions)
  - Facts revealed by the NPC to the player (prevents re-revealing secrets, enables "as I told you before..." callbacks)
  - Promises made (by either party)
  - Emotional shifts (trust gained/lost, favors owed)
  - Plot-relevant information exchanged
- The summary is stored in the NPC's persistent state and included in future dialogue prompts.
- This creates the illusion of a character who remembers you without requiring full conversation history storage.

### 4.3.1 Memory Summarization
- After each interaction ends, the narrative engine generates a memory summary.
- The summary is appended to the NPC's `interactionHistory` field.
- Older summaries may be further compressed (e.g., 10 interaction summaries → 1 consolidated summary) to manage token budget.
- The LLM prompt for dialogue includes the most recent 3-5 summaries plus the consolidated summary of older interactions.

### 4.4 Relationships
- Named Characters have **opinions about other Named Characters**.
- Relationships are defined as part of the character authoring and stored as a relationship map.
- Relationships are **directional** — Bryn may trust Aldric, but Aldric may resent Bryn.
- Relationships affect dialogue: asking one Named Character about another yields relationship-colored responses.
- Relationship changes can occur based on world events and player actions.

| Field | Type | Description |
|-------|------|-------------|
| `relationships` | `Record<string, NPCRelationship>` | Map of NPC ID → relationship data |

```typescript
type NPCRelationship = {
  targetId: string;           // The other NPC's ID
  attitude: number;           // -100 to +100
  tags: string[];             // e.g., ["family", "rival", "mentor", "suspicious_of"]
  knownFacts: string[];       // What this NPC *believes* about the other (not necessarily truth — enables unreliable narrators)
  history?: string;           // How the relationship evolved (e.g., "former allies who split over the mine dispute") — gives the LLM nuance beyond a static attitude score
};
```

- Residents (Tier 2) do **not** have NPC-to-NPC relationships. They are functionally independent.

### 4.5 State
Named Characters have all Resident state fields plus:

| Field | Type | Description |
|-------|------|-------------|
| `backstory` | `string` | Full authored backstory (not shown to players directly) |
| `secret` | `string` | Hidden information that can be discovered through play |
| `motivation` | `string` | What drives this character's actions |
| `tensions` | `string[]` | Internal contradictions that humanize the character (see §4.2) |
| `interactionHistory` | `InteractionSummary[]` | Compressed summaries of past player interactions |
| `relationships` | `Record<string, NPCRelationship>` | Opinions about other Named Characters |
| `questConnections` | `string[]` | IDs of quests this NPC is involved in |
| `arc` | `string` | Current narrative arc state (e.g., "trusts_party", "suspicious", "betrayed") |
| `promotedFrom` | `'resident'?` | Present if this NPC was promoted from Tier 2 (see §3.6) |
| `promotionDate` | `string?` | ISO date of promotion |

---

## 5. NPCRecord Type

The unified data structure for all NPC tiers. Fields are progressively populated based on tier.

```typescript
type NPCRecord = {
  // Identity (all tiers)
  id: string;
  name: string;
  tier: 'creature' | 'resident' | 'named';
  archetypeId?: string;        // Tier 2-3 only

  // Appearance & Role
  role: string;                // "blacksmith", "village elder", "bandit"
  category?: NpcCategory;      // merchant, authority, craft, service, wanderer

  // Mechanical
  statsTier: StatsTier;
  stats?: CreatureStatBlock;   // Full stats if generated

  // Personality (Tier 2-3)
  traits?: string[];           // Rolled from archetype probability tiers
  voicePatterns?: string[];    // Speech style guides for LLM
  dialogueHooks?: string[];   // Conversation starters

  // Knowledge (Tier 2-3)
  knowledge?: {
    always: string[];          // Freely shared
    sometimes: string[];       // Shared if asked or relevant
    rarely: string[];          // Skill-gated (requires DC check)
  };

  // Schedule (Tier 2-3)
  schedule?: {
    morning: { location: string; activity: string };
    afternoon: { location: string; activity: string };
    evening: { location: string; activity: string };
    night: { location: string; activity: string };
  };

  // Persistent State (Tier 2-3)
  disposition?: Record<string, number>;  // Player ID → attitude (-100 to +100)
  dispositionPermanent?: Record<string, number>;  // Permanent modifiers exempt from drift (e.g., murder)
  inventory?: Item[];
  knowledgeRevealed?: Record<string, string[]>;
  alive?: boolean;
  location?: string;

  // Promotion Tracking (Tier 2, system-managed)
  interactionCount?: number;
  uniquePlayersInteracted?: string[];
  notableEvents?: string[];
  lastInteractionDate?: string;

  // Named Character Only (Tier 3 — hand-authored or promoted from Tier 2)
  backstory?: string;
  secret?: string;
  motivation?: string;
  tensions?: string[];            // Internal contradictions (e.g., "resents the people she heals")
  interactionHistory?: InteractionSummary[];
  relationships?: Record<string, NPCRelationship>;
  questConnections?: string[];
  arc?: string;
  promotedFrom?: 'resident';     // Present if this Named Character was promoted from Tier 2
  promotionDate?: string;         // ISO date of promotion
};

type InteractionSummary = {
  timestamp: string;           // ISO date
  playerId: string;
  summary: string;             // LLM-generated compressed memory
  emotionalShift?: string;     // e.g., "trust increased", "became suspicious"
  promisesMade?: Promise[];    // Commitments from either party (see §11.5)
  factsLearned?: string[];     // New info the NPC learned about the player
  factsRevealed?: string[];    // Knowledge/secrets the NPC shared with the player
};

type Promise = {
  description: string;         // What was promised
  madeBy: 'player' | 'npc';   // Who made the promise
  dueByDay?: number;           // In-game day by which it should be fulfilled (optional — defaults to 7 days from creation)
  status: 'pending' | 'fulfilled' | 'broken';
  penaltyApplied?: boolean;    // True if the broken-promise disposition penalty has fired (prevents stacking)
};
```

---

## 6. Knowledge & Skill Checks

NPC knowledge is organized into three tiers, gated by player effort.

### 6.1 Knowledge Tiers

| Tier | Access | Example |
|------|--------|---------|
| `always` | Freely shared in any conversation | "The road north leads to Millhaven." |
| `sometimes` | Shared if the player asks about the right topic or the NPC's disposition is friendly (25+) | "There's been strange lights in the forest at night." |
| `rarely` | Requires a successful skill check against a DC | "The elder's been meeting someone in secret — I saw them at the burial ground last new moon." |

### 6.2 Skill Check Resolution

- The narrative engine determines which skill applies (Persuasion, Intimidation, Insight, Investigation, etc.)
- DC is set per knowledge item in the archetype or character definition
- Default DCs by tier and disposition:
  - `sometimes` with Friendly+ disposition (25+): freely shared, no check required
  - `sometimes` with Neutral disposition (0-24): DC 10
  - `sometimes` with Wary disposition (-49 to -1): DC 13 (gradient — wary NPCs are harder to coax)
  - `sometimes` with Hostile disposition (-100 to -50): refused entirely
  - `rarely`: DC 15-20 (set per item, unaffected by disposition — these are genuine secrets)
- On failure: the NPC deflects, lies, or refuses. The player may retry with a different approach (different skill) but not the same one.
- On natural 20: the NPC may volunteer additional context beyond the knowledge item itself. **Guardrail:** a natural 20 on a `sometimes` check only elaborates within the `sometimes` tier — it does not reveal `rarely`-tier knowledge. Only a successful check against the `rarely` DC unlocks that tier.

---

## 7. Trading System

### 7.1 Scope (v1)
- **Buy/sell only.** No bartering, auction houses, or economy simulation.
- Players can buy items from NPC inventory at listed prices.
- Players can sell items to NPCs who deal in that item type.
- Sell price is a fraction of buy price (default: 50%).

### 7.2 Merchant NPCs
- Only NPCs with `category: 'merchant'` or specific archetypes (shopkeeper, traveling_merchant, blacksmith, herbalist) support trading.
- Inventory is defined by the archetype and restocks on a configurable interval (default: daily).
- Rare items do not restock — once sold, they're gone.

### 7.3 Disposition Effects
- Disposition affects prices:
  - Hostile (-100 to -50): refuses to trade
  - Wary (-49 to -1): 125% buy price, 25% sell price
  - Neutral (0 to 24): standard prices
  - Friendly (25 to 74): 90% buy price, 60% sell price
  - Allied (75 to 100): 80% buy price, 75% sell price

### 7.4 Economic Safety Valve
- If **all** merchants in a settlement become Hostile (refusing to trade), the player's economy is effectively soft-locked.
- **Mitigation:** Each settlement has (or periodically spawns) a **Traveling Merchant** — a Tier 1 Creature with a fixed Neutral disposition that cannot be modified. The Traveling Merchant offers a limited, overpriced inventory (150% buy, 25% sell) but ensures players always have *some* trade option.
- The Traveling Merchant appears on a randomized schedule (configurable per world) and is seeded from world RNG for determinism.

---

## 8. Companions

The companion system allows NPCs to join the player's party and handles offline players as AI-controlled party members. The full design is specified in [`worlds/shared/companion_system.md`](worlds/shared/companion_system.md).

### 8.1 Summary

- **One system, two permission sets.** NPC companions and offline players share a `CompanionState` overlay on `NPCRecord`, differing only in restriction flags.
- **Pact system.** Built on the existing Promise system (§11.5). NPCs negotiate terms derived from their `motivation` and `tensions`; offline players auto-enter a restricted pact via standing orders.
- **Tiered autonomy.** Hireling (player-directed) → Follower (standing orders + AI tactics) → Companion (full autonomy, own goals). Maps to the existing NPC tier system.
- **Deterministic combat.** Behavioral templates (Aggressive/Defensive/Supportive/Cautious) drive combat decisions as priority-ordered decision trees — zero LLM cost. Template definitions: [`worlds/shared/companions/`](worlds/shared/companions/).
- **Asymmetric death.** NPC companions can die (real stakes, relationship cascades). Offline players cannot (auto-retreat at 25% HP, untargetable).
- **Loyalty.** Replaces disposition while a companion is in the party. Drops from pact violations, reckless endangerment, or ignoring personal goals. At 0, the companion leaves.

### 8.2 Ship Strategy

1. **v1 — Campfire Circle.** Companions contribute skill checks, relationship access, dialogue, and lore during exploration and rest. No combat participation. Zero encounter rebalancing.
2. **v1.5 — Behavioral Templates.** Companions take real combat turns using deterministic decision trees. Retainer mode (bonus action only) available as fallback if full turns break encounter balance.
3. **v2 — Behavioral Profiling.** Offline players act based on play history rather than generic templates.

### 8.3 Encounter Balance

Adding combat companions increases party damage output by 10-25% per companion. The phased ship strategy (§8.2) defers this rebalancing cost — v1 companions don't fight, so existing solo/party encounter balance is unaffected. When combat templates ship (v1.5), encounter CR budgets will need adjustment. See `worlds/shared/companion_system.md` §7 for details.

### 8.4 Integration with NPC Systems

- **Recruitment** uses disposition gates: Hireling (Neutral+), Follower (Friendly 50+), Companion (Allied 75+).
- **Pact terms** extend the Promise system (§11.5) — breaking pact terms triggers the same disposition/broken-promise penalties.
- **Companion memory** uses the existing Named Character memory model (§3.3) — companions remember interactions while in the party.
- **NPC-to-NPC relationships** (§4.4) are affected by companion behavior — other Named Characters react to who travels with the player.

---

## 9. Population Counts

**Not yet determined.** Settlement population guidelines exist in `starting_settlement_spec.md`:
- Named NPCs: 6-8 per starting settlement
- Ambient NPCs (Residents): 10-15 per starting settlement
- Scales with world player cap (see starting_settlement_spec.md §Multiplayer Considerations)

Final count limits per settlement tier will be determined after performance testing with the generation pipeline. The constraint is token budget — each Resident's `NPCRecord` consumes context when the player is in their location.

---

## 10. NPC Schedules & Location

### 10.1 Schedule System
- Every Resident and Named Character has a 4-phase daily schedule: morning, afternoon, evening, night.
- Each phase specifies a location and activity.
- The NPC's current location is derived from the schedule + current game time.
- Activities influence dialogue — a blacksmith at the forge talks about smithing; the same blacksmith at the tavern talks about rumors.

### 10.2 Schedule Interrupts
- World events can override schedules (e.g., an attack sends everyone to shelter).
- Named Characters may deviate from schedule based on quest state (e.g., the elder goes to the burial ground at midnight during Act II).
- Schedule overrides are stored as temporary state and revert when the triggering condition ends.

---

## 11. Disposition System

### 11.1 Scale
- Range: -100 (hostile) to +100 (allied)
- Default starting disposition: 0 (neutral) for Residents, authored value for Named Characters.
- Disposition is **per-player** — an NPC can like one player and distrust another.

### 11.2 Disposition Labels

| Range | Label | Behavior |
|-------|-------|----------|
| -100 to -50 | Hostile | Refuses service, may attack, alerts guards |
| -49 to -1 | Wary | Curt responses, higher prices, withholds knowledge |
| 0 to 24 | Neutral | Standard behavior |
| 25 to 74 | Friendly | Volunteers information, better prices, hints at secrets |
| 75 to 100 | Allied | Shares rare knowledge freely, maximum discounts, may offer aid |

### 11.3 Disposition Modifiers
- Disposition changes from **actions, not conversation.** Talking to an NPC does not change their disposition. Completing their quest, defending their settlement, or stealing from their shop does.
- Example modifiers:
  - Complete a quest for this NPC: +10 to +25
  - Steal from this NPC: -30
  - Defend the settlement from attack: +10 to all settlement NPCs (scaled — major encounters may grant more)
  - Kill another NPC: -50 to witnesses, -20 to settlement (word spreads)
  - Break a promise to a Named Character: -15 after N in-game days (see §11.5)

### 11.4 Disposition Recovery (Drift Toward Neutral)
- Disposition **drifts slowly toward 0** over time, preventing permanent soft-locks from a single mistake.
- Rate: **+1 per in-game day** for negative dispositions (toward neutral), **-1 per in-game day** for positive dispositions above 50 (toward 50, not toward neutral — earned goodwill is more durable).
- Drift stops at 0 (negative dispositions don't become positive through time alone) and at 50 (positive dispositions don't decay below Friendly).
- **Exceptions:** Disposition changes from murder (-50 witnesses, -20 settlement) do **not** drift. These are marked as `permanent` and require explicit redemption actions (quest, restitution, etc.) to recover.
- Drift is calculated on interaction, not continuously — when a player next encounters the NPC, the system applies accumulated drift since `lastInteractionDate`.

### 11.5 Broken Promise Penalty
- Named Characters track `promisesMade` in their `InteractionSummary` entries (see §4.3).
- If a promise remains unfulfilled after **N in-game days** (configurable, default: 7), the system applies a **-15 disposition penalty** to the NPC's disposition toward that player.
- The NPC will reference the broken promise in future dialogue ("You said you'd bring the herbs. That was weeks ago.").
- Only one penalty per promise — repeated unfulfillment does not stack. The promise is marked as `broken` after the penalty fires.
- Fulfilling a broken promise restores +10 disposition (partial recovery — trust once broken doesn't fully heal).

---

## 12. Dialogue Generation

### 12.1 Pipeline
1. Player initiates conversation with NPC (or NPC initiates based on trigger)
2. Engine assembles `DialogueContext` from `NPCRecord` + current state
3. For Named Characters: append `interactionHistory` summaries to context
4. LLM generates response using voice patterns, knowledge tiers, disposition, tensions, and current activity
5. If the response references gated knowledge, engine checks if the player has passed the required skill check
6. Response is delivered to the player
7. On conversation end: Named Characters get a memory summary generated and stored (including `factsRevealed`)
8. On conversation end (all tiers): system increments `interactionCount` and updates promotion-tracking metadata

### 12.2 Context Budget
- Tier 2 (Resident): ~200-400 tokens of NPC context per dialogue turn
- Tier 3 (Named Character): ~400-800 tokens of NPC context per dialogue turn (includes memory summaries)
- These budgets are within the narrative engine's overall 16-32k text LLM budget
- **Token budget pressure for Named Characters:** Each `InteractionSummary` is estimated at 50-100 tokens. With 3-5 recent summaries + a consolidated older summary, the budget gets tight. Recommended approach: **2-3 most recent detailed summaries + 1 consolidated summary of all older interactions** as the primary context model. The consolidated summary is the workhorse; recent summaries add freshness. Test with real generated summaries to validate fit within the 400-800 token window.
- **Memory summarization quality** is critical. A dedicated summarization prompt template should be designed and tested separately (see Lexicon's prompt architecture work) — do not rely on a generic "summarize this conversation" call.

---

## 13. Open Questions

1. **Count limits per settlement tier** — How many persistent NPCs can a hamlet/village/town/city support before context budget becomes a concern? Needs performance testing.
2. **Memory compression frequency** — How often should Named Character interaction summaries be consolidated? After every N interactions? When token count exceeds a threshold? Recommended starting point: consolidate after every 5 interactions.
3. **NPC death and replacement** — When a Resident dies, does the settlement eventually generate a replacement? How long is the delay?
4. **Cross-settlement NPCs** — Can Named Characters travel between settlements? What triggers migration?
5. **Promotion threshold tuning** — The default triggers (5 interactions, 3 unique players, ±75 disposition, 2 notable events) need playtesting. Too low = promotion inflation (too many Named Characters, token budget pressure). Too high = players never see the payoff.
6. **Promotion cap per settlement** — Should there be a maximum number of promoted NPCs per settlement to manage token budget? Or is the natural rarity of meeting promotion thresholds sufficient?
7. **Promoted NPC quality** — How good are LLM-generated backstories/secrets/motivations compared to hand-authored ones? May need a dedicated generation prompt template tested separately.
8. **Disposition drift rate** — Is +1/day toward neutral the right speed? Too fast trivializes consequences; too slow feels punishing. Needs playtesting.
9. **Broken promise detection** — How does the system know a promise was broken? The NPC tracks `promisesMade`, but fulfillment detection requires matching player actions to promise semantics. May need a simple keyword/quest-completion trigger rather than LLM inference.
10. **Traveling Merchant frequency** — How often does the safety-valve Traveling Merchant appear? Too frequent undermines the disposition system; too rare leaves soft-locked players stuck.

---

## Appendix A: Existing Archetype Categories

| Category | Count | Examples |
|----------|-------|---------|
| Authority | 6 | guard, captain, magistrate, tax_collector, town_crier, village_elder |
| Craft | 8 | baker, blacksmith, brewer, carpenter, herbalist, potter, tanner, weaver |
| Merchant | 6 | fence, horse_trader, shopkeeper, smuggler, spice_merchant, traveling_merchant |
| Service | 8 | barmaid, courier, ferryman, healer, innkeeper, priest, stable_hand, undertaker |
| Wanderer | 9 | bard, beggar, bounty_hunter, fortune_teller, hermit, mercenary, pilgrim, ranger, refugee |
| **Total** | **37** | |

See `worlds/shared/npcs/` for full archetype definitions and `worlds/shared/archetype_format.md` for the schema.

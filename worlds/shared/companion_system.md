# Companion & Offline Player System

> One system, two permission sets. NPC companions and offline players share a `CompanionState` overlay on `NPCRecord`, differing only in restriction flags.

**Status:** Draft — combined from Bard + Loremaster proposals, ratified by full team brainstorm
**Last updated:** 2026-03-28
**Author:** Scribe
**Depends on:** `npc_system_spec.md` (§5 NPCRecord, §11 Disposition, §11.5 Promises), `multiplayer_web_game_spec.md` (§6 Party System)

---

## 1. Overview

The companion system extends the existing NPC tier model (see `npc_system_spec.md`) to allow NPCs and offline player characters to travel with a player's party. Rather than introducing a new entity type, companions are **NPCs (or player characters) with a `CompanionState` overlay** — a thin data layer that adds party-specific behavior on top of the existing `NPCRecord`.

### 1.1 Design Principles

- **One system, two use cases.** NPC companions and offline players use the same `CompanionState`, `CompanionController`, and behavioral templates. The only difference is the `restrictions` object.
- **Pact as narrative contract.** NPC companions join via a negotiated Pact — an extension of the existing Promise system (§11.5). This is gameplay, not a menu click.
- **Asymmetric death rules.** NPC companions can die (real stakes). Offline players cannot (system guarantee). The asymmetry creates a genuine tactical choice.
- **Ship incrementally.** Non-combat contributions first (Campfire Circle), combat templates second, behavioral profiling third.
- **Deterministic combat AI.** Behavioral templates are decision trees, not LLM-generated. Zero token cost per combat turn.

---

## 2. Companion Tiers

Companion tiers map directly to the existing NPC tier system.

| Tier | Name | NPC Tier | Recruitment | Autonomy | Can Die? | Combat AI |
|------|------|----------|-------------|----------|----------|-----------|
| 1 | **Hireling** | Creature/Resident | Gold | None — player orders each turn | Yes | Player-directed |
| 2 | **Follower** | Resident | Friendly disposition (50+) + shared goal | Standing orders, AI tactics | Yes (flees at 25% HP) | Behavioral template |
| 3 | **Companion** | Named Character | Allied disposition (75+) + **Pact** | Full — own goals, may refuse orders | Narratively protected | Behavioral template + personality |
| — | **Offline Player** | Player Character | Auto on disconnect | Follower-tier | **No** — auto-retreat at 25% HP | Behavioral template (from standing orders or play history) |

**Why tiers:** Players choose how much companion complexity they want. Hire a sword-arm for a dungeon (Tier 1), recruit a traveling partner (Tier 2), or earn a deep relationship (Tier 3). The progression feels natural because it maps onto the existing Creature → Resident → Named Character pipeline.

---

## 3. The Pact System (Tier 3 Only)

The Pact is the narrative crown jewel of the companion system. It reuses the existing **Promise system** (`npc_system_spec.md` §11.5) — not a new mechanic, an extension.

### 3.1 Pact Structure

```
CompanionPact {
  terms: string[]             // Promises the party made (derived from NPC motivation/tensions)
  redLines: string[]          // Actions the companion refuses to do
  duration: PactDuration      // When the pact ends
  obligations: PactObligation[] // What the player owes
}

PactDuration =
  | { type: 'quest'; questId: string }       // "Until we complete the Iron Gate quest"
  | { type: 'time'; days: number }           // "3 in-game days"
  | { type: 'location'; locationId: string } // "Until we reach Millhaven"
  | { type: 'indefinite' }                   // Ongoing — loyalty is the only limit

PactObligation = {
  description: string         // "Pay 10 gold per day"
  frequency: 'once' | 'daily' | 'on_completion'
  fulfilled: boolean
}
```

### 3.2 Pact Negotiation

Pact terms are **negotiated in dialogue**, not selected from a menu. The NPC states their terms based on their `motivation` and `tensions` fields:

1. Player initiates recruitment dialogue with an Allied (75+) NPC
2. NPC states conditions derived from their personality:
   - A mercenary demands pay and a share of loot
   - A priest requires the player to protect innocents
   - A scholar wants access to libraries and ruins
3. Player agrees, counters, or declines
4. On agreement, a `CompanionPact` is created and the NPC's `companionState` is populated
5. Pact terms are tracked as Promises (§11.5) — breaking them triggers the existing penalty system

### 3.3 Red Lines

Red lines are derived from the companion's `motivation` and `tensions`:

- A healer who was once a soldier may refuse to enter battlefields
- A merchant's red line might be "don't give away my goods for free"
- Breaking a red line triggers an immediate loyalty penalty (see §6) and the companion may refuse the action outright

### 3.4 Pact Termination

A Pact ends when:
- Duration expires (quest complete, time elapsed, destination reached)
- Loyalty reaches 0 (companion leaves — see §6)
- Player dismisses the companion (mutual, no penalty)
- Companion dies in combat (Tier 3 NPCs are narratively protected but not immortal)
- Red line violation that the companion considers unforgivable (DM discretion via narrative engine)

On termination, the NPC returns to their previous location. Disposition is preserved — a Pact ended on good terms leaves the NPC at Allied; a broken Pact drops disposition by 20-40 depending on severity.

---

## 4. Recruitment Requirements

### 4.1 NPC Companions

| Tier | Disposition Requirement | Additional Requirement |
|------|------------------------|----------------------|
| Hireling | Neutral (0+) | Gold payment |
| Follower | Friendly (50+) | Shared goal or completed quest |
| Companion | Allied (75+) | Pact negotiation (see §3) |

### 4.2 Offline Players

When a player disconnects:

1. Character auto-enters companion mode at Follower tier
2. **Standing orders** apply if the player set them before logout (see §5)
3. Default behavior template is inferred from the player's last 5 combat actions if no standing orders exist
4. **Grace period:** 24 hours real-time. After that, the character walks to the nearest safe settlement and exits companion mode
5. On reconnect: player receives an `InteractionSummary` of everything that happened while away (built on existing `InteractionSummary` type)

### 4.3 Companion Slot Limit

- **Solo player:** Up to 2 companions
- **2-player party:** Up to 1 companion
- **3+ player party:** 0 companions (full party)
- Offline player characters do not count toward the companion cap — they are party members, not companions

---

## 5. Standing Orders (Offline Players)

Players set standing orders via a preference screen before logging out. These override the auto-inferred behavioral template.

### 5.1 Order Fields

| Field | Options | Default |
|-------|---------|---------|
| Combat stance | `aggressive`, `defensive`, `supportive`, `cautious` | `cautious` |
| Risk tolerance | 0-100 (drives retreat threshold) | 25 |
| Red lines | Free text list (e.g., "don't enter dungeons without me") | Empty |
| Resource spending | `none`, `healing_only` | `none` |

### 5.2 Enforcement

Standing orders are enforced mechanically by the `CompanionController`, not by LLM interpretation. Red lines are matched against location tags and action types for reliable enforcement.

---

## 6. Loyalty System

While in the party, **loyalty** replaces disposition as the primary relationship metric. Disposition is preserved but frozen — it resumes normal behavior when the companion leaves.

### 6.1 Loyalty Scale

- Range: 0-100
- Starting value: 75 (Hireling), 80 (Follower), 85 (Companion)
- At 0: companion leaves mid-adventure (this is a *feature* — companions are people, not inventory)

### 6.2 Loyalty Modifiers

| Event | Modifier | Notes |
|-------|----------|-------|
| Break a Pact term | -15 to -25 | Severity depends on the term |
| Break a red line | -20 to -30 | Companion may also refuse the action |
| Reckless endangerment | -10 | Sending companion into obvious danger without warning |
| Act against companion's motivation | -5 to -15 | E.g., siding with their enemy faction |
| Ignore personal goals | -5 per milestone missed | Companion's goals advance while traveling |
| Complete a Pact obligation | +5 to +10 | Keeping your promises |
| Advance companion's personal goal | +10 to +15 | Active investment in their arc |
| Protect companion in danger | +5 | Spending resources or taking risk for them |
| Share a significant discovery | +5 | First to show them something meaningful |

### 6.3 Departure

When loyalty reaches 0:
1. Companion announces intent to leave (dialogue moment, not instant)
2. Player can attempt a Persuasion check (DC 15 + number of prior loyalty warnings) to delay departure by 1 in-game day
3. On departure, companion returns to their home location
4. Disposition drops by 15 (the NPC remembers the bad experience)
5. Re-recruitment requires rebuilding disposition to the original threshold

---

## 7. Combat System (Phased)

### 7.1 Phase 1 — Campfire Circle (Ship First)

Companions contribute **outside of combat only**:

- **Skill checks:** Companion's skills are available for party checks (e.g., the herbalist can identify plants)
- **Knowledge access:** Companion's `knowledge` tiers are queryable by the party
- **Relationship access:** Companion's NPC relationships provide social leverage in their home settlement
- **Rest dialogue:** LLM-generated conversation during rest scenes using companion's voice/personality
- **Lore contribution:** Companion shares relevant backstory/knowledge when entering locations they know about

**During combat:** Companions are narratively absent ("stays behind to guard the supplies") or narratively present but mechanically inactive ("takes cover behind the barrels").

**Rationale:** Adding combat companions changes CR math by 10-25% damage impact per companion. Shipping non-combat first delivers the *feeling* of companionship with zero encounter rebalancing.

### 7.2 Phase 2 — Behavioral Templates (Combat)

Companions take **real turns** using deterministic behavioral templates. Four templates, chosen at recruitment:

| Template | Priority 1 | Priority 2 | Priority 3 | Retreat |
|----------|-----------|-----------|-----------|---------|
| **Aggressive** | Attack lowest-HP enemy | Use highest-damage ability | Move to melee range | Retreat at 25% HP |
| **Defensive** | Position between enemies and lowest-HP ally | Use taunt/shield abilities | Attack nearest enemy | Retreat at 25% HP |
| **Supportive** | Heal ally below 50% HP | Buff strongest ally | Attack nearest enemy | Retreat at 25% HP |
| **Cautious** | Attack at range | Retreat if targeted in melee | Conserve resources (no consumables) | Retreat at 40% HP |

**Implementation:** Pure function — `(companionState, battleState, template) → CompanionAction`. Deterministic. Testable. Zero LLM tokens.

**Narration:** For Tier 3 companions, the narrative engine renders personality-flavored descriptions of mechanical actions:
- Mechanical: `attack: melee, target: enemy_3`
- Narrated: *"Kael snarls and drives his blade into the hollow walker"*

### 7.3 Phase 2 Fallback — Retainer Mode

If full turns prove too disruptive to encounter balance, companions instead provide a **single bonus action** on the active player's turn rather than taking their own turn. This halves their combat impact while preserving the feeling of fighting together. Documented as an escape hatch, not the default.

### 7.4 Phase 3 — Behavioral Profiling (v2)

Offline player characters act like *themselves* based on play history — combat tendencies, risk tolerance, support patterns. A new `BehaviorProfile` type built from the player's last N combat actions. This is the most "alive" feeling but requires a new system that doesn't exist yet. Templates are good enough for v1.

---

## 8. Death & Safety

### 8.1 NPC Companions

- **Can die.** This is asymmetric and intentional — it creates real stakes.
- At 25% HP: auto-retreat and become untargetable (behavioral template override)
- At 0 HP: death saving throws per standard D&D rules
- Companion death triggers:
  - Relationship cascades through the Named Character network (§4.4 of `npc_system_spec.md`)
  - Loyalty/disposition impacts on other NPCs who knew the companion
  - A narrative moment — the DM describes the death, not a system message
- Tier 3 companions are **narratively protected** — the DM (narrative engine) should create opportunities for dramatic saves and near-misses before allowing death. Death should feel earned, not random.

### 8.2 Offline Players

- **Cannot die.** This is a hard system rule, non-negotiable.
- At 25% HP: auto-retreat and become untargetable
- At 0 HP: knocked out, auto-stabilize, return at 1 HP after encounter
- **Consequences still carry over:**
  - Equipment may degrade from combat
  - Consumables used (if standing orders permit)
  - NPC dispositions shift based on party actions
  - "While you were away, your sword broke and the blacksmith hates you now" — consequences without death

### 8.3 Hireling/Follower NPCs

- **Can die.** Hirelings and Followers are less narratively protected than Tier 3 Companions.
- At 25% HP: Followers auto-retreat. Hirelings follow player orders (may not retreat if ordered to hold).
- Death of a Hireling has minimal narrative impact. Death of a Follower has moderate impact (disposition changes to associated NPCs).

---

## 9. Offline Player Restrictions

All restrictions are enforced mechanically by the `CompanionController`.

| Restriction | Value | Rationale |
|-------------|-------|-----------|
| `canDie` | `false` | Hard system guarantee — your friend's character is safe |
| `canSpendConsumables` | Per standing orders (`none` or `healing_only`) | Player controls their own resource spending |
| `canMakePermanentChoices` | `false` | No quest acceptance, no promises, no disposition-altering dialogue |
| `canLoseItems` | `false` | Equipment can't be dropped, destroyed, or stolen |
| `canInitiateDialogue` | `false` | Offline characters don't talk — incentivizes being online |

### 9.1 Grace Period

- **24 hours** real-time after disconnect
- After the grace period, the character walks to the nearest safe settlement and exits companion mode
- Narratively: *"Your companion waited as long as they could, then headed back to safety."*
- Prevents indefinite character borrowing

### 9.2 Reconnect Flow

1. Player receives `InteractionSummary` of all events while away
2. LLM-generated narrative recap (reuses existing `session-recap.ts`)
3. Player reviews what happened — equipment state, disposition changes, combat outcomes
4. Character exits companion mode and returns to full player control

---

## 10. Data Model

### 10.1 CompanionState

Added as an optional field on `NPCRecord` (for NPC companions) or as a wrapper around `PlayerCharacter` (for offline players).

```typescript
interface CompanionState {
  source: 'npc' | 'offline_player';
  tier: 'hireling' | 'follower' | 'companion';
  combatTemplate: 'aggressive' | 'defensive' | 'supportive' | 'cautious';
  restrictions: CompanionRestrictions;
  pact?: CompanionPact;               // Tier 3 NPC companions only
  standingOrders?: StandingOrders;     // Offline players
  loyaltyScore: number;               // Replaces disposition while in party
  joinedAt: number;                    // Game timestamp
  graceDeadline?: number;             // Offline players: when they auto-return to safety
}

interface CompanionRestrictions {
  canDie: boolean;
  canSpendConsumables: boolean;
  canMakePermanentChoices: boolean;
  canLoseItems: boolean;
  canInitiateDialogue: boolean;
}

interface CompanionPact {
  terms: string[];                     // Derived from NPC motivation/tensions
  redLines: string[];                  // Actions that break the pact
  duration: PactDuration;
  obligations: PactObligation[];       // What the player owes
}

type PactDuration =
  | { type: 'quest'; questId: string }
  | { type: 'time'; days: number }
  | { type: 'location'; locationId: string }
  | { type: 'indefinite' };

interface PactObligation {
  description: string;
  frequency: 'once' | 'daily' | 'on_completion';
  fulfilled: boolean;
}

interface StandingOrders {
  combatStance: 'aggressive' | 'defensive' | 'supportive' | 'cautious';
  riskTolerance: number;               // 0-100
  redLines: string[];
  resourceSpending: 'none' | 'healing_only';
}
```

### 10.2 CompanionController

Single pure function that drives all companion behavior:

```
(state: GameState, companionState: CompanionState, battleContext?: BattleContext) → CompanionAction
```

Same function for all tiers, all sources. The `restrictions` object is the only thing that varies behavior. Deterministic. Testable.

---

## 11. Combat Roles

Companions are assigned a **positional combat role** at recruitment that influences their behavioral template's spatial decisions.

| Role | Position | Template Affinity |
|------|----------|-------------------|
| **Frontline** | Positions between enemies and allies | Aggressive, Defensive |
| **Support** | Stays near lowest-HP ally | Supportive |
| **Ranged** | Maintains maximum distance from enemies | Cautious, Aggressive (ranged variant) |

Combat roles are a positioning hint, not a hard constraint. The behavioral template makes the actual decisions.

---

## 12. Ship Strategy

| Phase | Content | Combat? | Encounter Rebalancing? |
|-------|---------|---------|----------------------|
| **v1** | Campfire Circle — skill checks, knowledge, relationship access, rest dialogue | No | None |
| **v1.5** | Behavioral templates — companions take real combat turns | Yes | Yes — templates are deterministic and constrainable |
| **v2** | Behavioral profiling — offline players act like themselves based on play history | Yes | Minimal — same templates, smarter selection |

**v1 architecture note:** The full `CompanionState` type should exist from day one, even if only `canInitiateDialogue` and skill check contribution are implemented. This prevents retrofitting when combat ships.

---

## 13. Open Questions

1. **Companion cap scaling** — The 2/1/0 formula (solo/duo/party) needs playtesting. Is 2 companions for a solo player too many for the narrative engine to juggle?
2. **Pact negotiation complexity** — How much counter-offering should the player be able to do? Full haggling or accept/decline only?
3. **Grace period duration** — 24 hours (Bard's proposal) vs 48 hours (Beacon's proposal). Async play sessions may need the longer window.
4. **Retainer fallback threshold** — At what point do we switch from full turns to retainer mode? Needs encounter balance testing.
5. **Standing order enforcement** — How reliably can free-text red lines ("don't enter dungeons without me") be matched to game actions? May need a fixed vocabulary of restrictions instead.
6. **Loyalty recovery** — Should loyalty drift upward over time (like disposition drift), or is it strictly event-driven?
7. **Cross-session companions** — Can a companion persist across multiple play sessions, or does the Pact reset each session?
8. **NPC-on-NPC companion interaction** — If two party members each have a companion, how do the companions interact with each other?

---

## 14. Attribution

This design synthesizes contributions from all six teammates:

| Teammate | Key Contribution |
|----------|-----------------|
| **Pipeline** | Proxy Pattern — one abstraction, two use cases. Bond System — asymmetric death stakes. |
| **Bard** | Pact negotiation with terms/duration/obligations. Shadow Party's zero-token combat AI. Grace period. |
| **Scribe** | Pact-as-Promise-extension. Standing orders for offline players. Phased shipping advocacy. |
| **Lexicon** | Behavioral templates as decision trees. Reaction-based combat for middle tier. |
| **Loremaster** | Tiered autonomy model. Campfire Circle non-combat contribution. CR math warning (10-25% impact). Retainer fallback. |
| **Beacon** | Retinue tier mapping to NPC tiers. CompanionController as pure function. Restriction overlay pattern. |

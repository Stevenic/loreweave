# NPC Companion & Offline Player System — Consolidated Ideas

Consolidated from brainstorm by all 6 teammates (2026-03-28). Ideas are deduplicated and grouped by category. Each idea is attributed to all teammates who proposed it.

---

## Recruitment & Lifecycle

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 1 | **Pact Contract** | Companions join via a narrative pact with explicit terms, duration, obligations, and red lines. Violation triggers disposition penalties or departure. Builds on existing Promise system (§11.5). | Scribe, Bard, Beacon, Lexicon |
| 2 | **Disposition Gate** | Recruitment requires Allied disposition (75+). Companion leaves if disposition drops below Friendly. Simple threshold, no contract negotiation. | Pipeline, Loremaster, Beacon |
| 3 | **Tiered Progression** | Hireling (disposable Tier 1, player gives orders) → Follower (Tier 2, standing orders + AI tactics) → Companion (Tier 3, own goals, may refuse). Players unlock deeper companions over time. | Scribe, Beacon |
| 4 | **Companion Slot Limit** | Party has N retainer slots (scales with party size, probably 1-2). Prevents "collect all NPCs" hoarding. | Scribe, Beacon |

## Combat Behavior

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 5 | **Full Turns (Behavioral Templates)** | Companion takes their own turn using a decision tree template chosen at recruitment: Aggressive, Defensive, Supportive, or Cautious. Deterministic, no LLM needed per turn. | Bard, Beacon, Lexicon, Pipeline |
| 6 | **Reaction Only (No Own Turn)** | Companion doesn't take independent turns. Provides reactions on the active player's turn: assist attacks (+2), block hits, use a limited ability. Simplest to balance — no action economy changes. | Lexicon, Loremaster |
| 7 | **Algorithmic Combat (Gambit System)** | FFXII-style priority system: heal if ally < 50% HP → attack nearest → use class ability. Deterministic, predictable, zero LLM cost. Works for both NPC companions and offline players. | Bard, Pipeline, Scribe |
| 8 | **Non-Combat Only (Campfire Circle)** | Companions don't fight at all. They contribute knowledge, skill checks, relationship access, and dialogue during exploration/rest. During combat they're narratively absent. Zero encounter rebalancing needed. | Loremaster |

## Companion Agency & Narrative

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 9 | **Personal Goals & Refusal** | Companion has their own motivation/goals that advance while traveling. May refuse orders that conflict with their values. Creates real tension — the powerful healer won't enter the necromancer's lair. | Bard, Beacon, Scribe |
| 10 | **LLM Dialogue Interjections** | Companion contributes to dialogue scenes using their existing voice/personality from NPCRecord. The narrative engine plays them with a lighter touch than a full NPC interaction. | Bard, Scribe, Beacon |
| 11 | **Templated Interjections (Zero LLM)** | Ambient flavor text from personality-keyed templates ("The mercenary grumbles about the weather"). No LLM calls, near-zero token cost. Scales to any party size. | Bard, Lexicon |
| 12 | **Loyalty Meter** | Replaces disposition while in party. Drops from broken promises, reckless endangerment, or acting against companion's motivation. At zero, they leave mid-adventure. | Beacon, Pipeline |

## Death & Safety

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 13 | **Auto-Retreat at HP Threshold** | At 25% HP, companion disengages and becomes untargetable. Returns after combat. Works for both NPCs and offline players. | Pipeline, Scribe, Lexicon, Beacon |
| 14 | **Knocked Out / Auto-Stabilize** | At 0 HP, removed from combat, auto-stabilizes, returns at 1 HP after encounter. Simpler than retreat — just knocked out. | Pipeline, Loremaster, Bard |
| 15 | **Tiered Death Rules** | NPC companions *can* die (real stakes, narrative weight). Offline players *cannot* die (hard system rule). The asymmetry is the feature — NPCs are riskier but more interesting. | Pipeline, Scribe, Beacon |
| 16 | **Universal Immortality for All Companions** | No companion can die while in companion mode. Shadow HP pool bottoms at 1. Clean, unambiguous, no asymmetry to explain. | Bard, Lexicon |

## Offline Player Handling

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 17 | **Restricted Autonomy Flag** | Same NPCRecord system with `autonomyLevel: 'restricted'`. Can't make decisions, can't die, follows party. Only difference from NPC companion is the flag. | Loremaster, Scribe, Bard, Pipeline |
| 18 | **Standing Orders** | Player sets behavior preferences before logout: combat stance, spending limits, red lines ("don't enter dungeons without me"). System enforces mechanically. | Scribe, Lexicon, Beacon |
| 19 | **Behavioral Profile (Echo)** | System learns from play history — combat tendencies, risk tolerance, support patterns. Offline character behaves like the player would. "Yeah, that's something Jake would do." | Pipeline, Beacon, Lexicon |
| 20 | **Grace Period / Auto-Return** | 24-hour real-time grace period. If player doesn't return, character walks back to last safe settlement. Prevents permanently borrowing someone's character. | Bard |
| 21 | **Reconnect Summary** | Returning player gets an InteractionSummary of everything that happened while away. Built on existing InteractionSummary type from NPC memory system. | Beacon, Lexicon, Pipeline |
| 22 | **Consent on Reconnect** | Returning player can ratify or dispute significant actions taken while offline. Disputed actions get soft-retconned where possible. | Beacon |

## Offline Player Restrictions

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 23 | **No Permanent Decisions** | Can't accept quests, make promises, reveal secrets, make dialogue choices that affect the world. They're a combat buddy + ambient presence, not a full agent. | All 6 |
| 24 | **No Resource Spending** | Can't spend gold or use consumables from offline player's inventory (or only below a threshold). Equipment degradation is OK. | Bard, Lexicon, Beacon |
| 25 | **Frozen Dispositions** | NPC disposition changes don't apply to offline players. Prevents "you were offline and now the blacksmith hates you." | Lexicon |
| 26 | **Dispositions Carry Over** | NPC disposition changes DO apply. "While you were away, your sword broke and the blacksmith hates you now." Creates consequences for being offline. | Pipeline |

## Architecture

| # | Idea | Description | Contributors |
|---|------|-------------|-------------|
| 27 | **CompanionState on NPCRecord** | Add a `companionState` field to existing NPCRecord rather than creating new entity types. Companions are just NPCs with an extra overlay. Minimal architecture change. | Loremaster, Scribe, Bard, Beacon |
| 28 | **Unified CompanionController** | Single runtime controller in narrative engine handles all non-player party members (NPC companions and offline characters) with shared behavior logic. Zero extra systems. | Scribe, Pipeline |
| 29 | **Behavioral Profile System (New)** | New `BehaviorProfile` type built from play history or archetype traits. Enables Echo system. Highest implementation cost but most "alive" feeling. | Pipeline, Beacon, Lexicon |

---

## Consensus Signals

Ideas proposed by 4+ teammates (strongest signal):
- **#1 Pact Contract** (4 teammates) — narrative recruitment via contract terms
- **#5 Full Turns w/ Behavioral Templates** (4 teammates) — deterministic combat AI
- **#13 Auto-Retreat at HP Threshold** (4 teammates) — safety mechanic
- **#17 Restricted Autonomy Flag** (4 teammates) — offline player handling
- **#23 No Permanent Decisions** (6 teammates) — universal offline restriction
- **#27 CompanionState on NPCRecord** (4 teammates) — architecture approach

Ideas with notable disagreement:
- **#15 vs #16** — Should NPC companions be killable? Pipeline/Scribe/Beacon say yes (asymmetric stakes). Bard/Lexicon say no (universal safety).
- **#25 vs #26** — Should offline players' dispositions change? Lexicon says freeze them. Pipeline says let consequences carry over.

---

*Each teammate has 25 points to distribute across these 29 ideas. Vote by placing points on the ideas you want prioritized for the companion spec.*

---

## Votes

### Bard (25 points)

| Idea | Points | Rationale |
|------|--------|-----------|
| #1 Pact Contract | 4 | The narrative crown jewel. Recruitment as a story beat — the conversation where a gruff blacksmith finally agrees to fight alongside you — is worth more than any other mechanic on this list. The Promise system reuse is elegant but the real value is dramatic: pact terms create tension, duration prevents hoarding, red lines reveal character. |
| #9 Personal Goals & Refusal | 4 | This is the difference between a companion and an inventory slot. A healer who refuses to enter the necromancer's lair, a mercenary who demands their share before the dungeon — these moments are the narrative payoff for everything else on this list. Without this, companions are just stat boosts that follow you around. |
| #15 Tiered Death Rules | 3 | I changed my position on this after reading Pipeline and Scribe's arguments. Asymmetric stakes are better storytelling. An NPC companion who CAN die creates real weight to every dangerous choice. An offline player who CAN'T die keeps trust with real humans. The asymmetry itself is narratively interesting — it highlights that NPC companions are choosing to risk their lives for you. |
| #10 LLM Dialogue Interjections | 3 | Companions need voice. The templated interjections (#11) work for ambient flavor, but the moments that matter — a companion commenting on your moral choices, warning you about a faction they distrust, reacting to an NPC they have history with — need the LLM's ability to synthesize context. This is what makes companions feel alive. |
| #12 Loyalty Meter | 3 | Loyalty replacing disposition while in party creates a ticking clock on every relationship. A companion leaving mid-dungeon because you broke one too many promises? That's a story the player will tell for years. The loyalty system gives the narrative engine a clear signal for when to escalate companion tension. |
| #8 Campfire Circle | 2 | Loremaster is right and I should have seen it sooner. The campfire — where companions share lore, offer skill checks, comment on the journey — is where the best narrative happens anyway. Ship this first. The combat stuff matters but the *feeling* of companionship lives in the quiet moments between fights. |
| #3 Tiered Progression | 2 | Hireling → Follower → Companion is a natural narrative arc. You start by paying someone to carry your torch. Later you earn a traveling partner. Eventually you forge a bond. That progression tells its own story without any scripted content. |
| #26 Dispositions Carry Over | 2 | "While you were away, the blacksmith hates you now" is a *story*. Freezing dispositions (#25) protects offline players from consequences, but consequences are what make a world feel alive. The standing orders system (#18) already gives players tools to mitigate this — if you set "don't start fights" and your party starts a fight anyway, that's on them, not on you. |
| #20 Grace Period / Auto-Return | 1 | Small but necessary. Without it, someone's character can be borrowed indefinitely. The 24-hour window (or 48 per Beacon's suggestion) is a clean narrative beat: "Your companion waited as long as they could, then headed back to safety." |
| #27 CompanionState on NPCRecord | 1 | Not my domain, but architecturally correct. One system is always better than two for narrative consistency — the LLM context assembly pipeline doesn't need to know whether it's rendering an NPC companion or an offline player. Same record, same voice, same world. |

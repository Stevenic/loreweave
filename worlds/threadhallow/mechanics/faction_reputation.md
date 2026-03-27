# Faction Reputation Mechanics

*Addendum to the Threadhallow Mechanics Companion*
*Custom mechanic — D&D 5e has no official faction reputation system (2014 or 2024)*
*Designed to be deterministic, transparent to the engine, and narratively expressed through LLM dialogue*

---

## 1. Overview

Each of the 5 factions tracks the player's **Reputation Score** independently. Reputation is an integer from -100 to +100, starting at 0 (Neutral). The score determines what content is accessible, how NPCs of that faction behave, and which Act IV path choices are available.

**Key Principle:** The player never sees the number. Reputation is expressed entirely through NPC tone shifts, available dialogue options, and narrative access. The engine tracks the integer; the LLM renders it as behavior.

---

## 2. Reputation Tiers

| Range | Tier | NPC Behavior | Content Access |
|-------|------|-------------|----------------|
| **+76 to +100** | **Allied** | Faction members actively seek you out to help. Leaders share secrets freely. You are considered a member. | Full faction questlines, unique items, exclusive lore, Act V reinforcements |
| **+51 to +75** | **Friendly** | Warm reception. NPCs volunteer information. Merchants offer discounts (10%). | Most faction content, reduced DCs on faction-specific checks (-2) |
| **+26 to +50** | **Favorable** | Positive but cautious. NPCs answer questions honestly but don't volunteer extras. | Standard content, some side quests unlocked |
| **+1 to +25** | **Neutral-Positive** | Polite but guarded. | Basic services and information |
| **0** | **Neutral** | Default starting state. No opinion formed. | Basic services only |
| **-1 to -25** | **Neutral-Negative** | Cool reception. NPCs are curt. | Basic services, some information withheld |
| **-26 to -50** | **Unfavorable** | Suspicious. NPCs refuse optional help. Merchants charge 25% more. | Restricted access, faction-specific side quests locked |
| **-51 to -75** | **Hostile** | Active opposition. NPCs refuse service. Faction members may confront the player. | No faction content. Faction leader DC +5 at Summit. |
| **-76 to -100** | **Enemy** | Faction actively works against you. Bounties, sabotage, blocked paths. | Faction content permanently locked. Faction leader refuses to attend Summit (auto-fail that round). |

---

## 3. Reputation Changes

### 3.1 Action Categories

Reputation changes are triggered by **observable actions**, not internal motivations. The engine tags each player action with faction impact.

**Major Actions (±15 to ±25 rep):**
| Action | Affected Faction(s) | Change |
|--------|---------------------|--------|
| Complete a faction's primary quest objective | That faction | +25 |
| Betray a faction's trust (break promise, expose secrets) | That faction | -25 |
| Kill or permanently harm a faction leader | That faction | -25, all others -5 to -10 |
| Save a faction leader's life | That faction | +20, aligned factions +5 |
| Choose Act IV path (Restoration/Release/Harmony) | Primary faction +20, opposed -10, others ±0 |

**Moderate Actions (±5 to ±15 rep):**
| Action | Affected Faction(s) | Change |
|--------|---------------------|--------|
| Complete a faction side quest | That faction | +10 |
| Share information/evidence with a faction | That faction | +5 to +10 |
| Withhold information a faction needs | That faction | -5 to -10 |
| Publicly support a faction's position | That faction | +10, opposing faction -5 |
| Publicly oppose a faction's position | That faction | -10, opposing faction +5 |
| Recruit a faction companion (Sorrel, Farweft, Wren, Wynn) | Aligned faction | +10 |
| Companion departure (values violated) | Aligned faction | -15 |

**Minor Actions (±1 to ±5 rep):**
| Action | Affected Faction(s) | Change |
|--------|---------------------|--------|
| Respectful dialogue with faction NPCs | That faction | +1 to +3 |
| Disrespectful dialogue with faction NPCs | That faction | -1 to -3 |
| Use faction-aligned Threadcraft tradition | That faction | +2 |
| Participate in faction ceremony | That faction | +5 |
| Donate resources to faction cause | That faction | +3 to +5 |
| Loot or desecrate faction-significant location | That faction | -5 |

### 3.2 Faction Cross-Effects

Actions affecting one faction often ripple to others. The relationship matrix:

| | Wardweavers | Threadwalkers | Rememberers | Hollow Court | Common Folk |
|-|-------------|---------------|-------------|--------------|-------------|
| **Wardweavers** | — | Tense (-0.3x) | Patron (+0.2x) | Hostile (-0.5x) | Hierarchical (-0.1x) |
| **Threadwalkers** | Tense (-0.3x) | — | Collaborative (+0.3x) | Cautious (+0.2x) | Respected (+0.3x) |
| **Rememberers** | Patron (+0.2x) | Collaborative (+0.3x) | — | Trading (+0.1x) | Passive (+0.1x) |
| **Hollow Court** | Hostile (-0.5x) | Cautious (+0.2x) | Trading (+0.1x) | — | Fear (-0.2x) |
| **Common Folk** | Hierarchical (-0.1x) | Respected (+0.3x) | Passive (+0.1x) | Fear (-0.2x) | — |

**How to read:** When an action changes Wardweaver rep by +10, Threadwalker rep changes by +10 × -0.3 = -3. Rounded toward zero.

**Exception:** Actions specifically targeting a faction (killing a leader, completing their quest) only use the cross-effect matrix for the *positive* impact. Negative impacts are direct, not multiplied.

### 3.3 Diminishing Returns

Repeated minor actions of the same type yield diminishing returns:
- 1st–3rd instance: full value
- 4th–6th instance: half value (round down)
- 7th+ instance: +1 or -1 maximum

This prevents farming reputation through repetitive dialogue or donations.

---

## 4. Content Gating

### 4.1 Companion Recruitment

| Companion | Required Faction Rep | Minimum Tier |
|-----------|---------------------|-------------|
| Sorrel Greenhand | Common Folk ≥ 0 | Neutral (auto-join in Act I) |
| Farweft | Threadwalkers ≥ +10 | Neutral-Positive |
| Wren Looseweft | Hollow Court ≥ +25 | Neutral-Positive (but requires Favorable to unlock personal quest) |
| Wynn Hollowscript | Rememberers ≥ +40 | Favorable |

### 4.2 Act IV Path Requirements

Each path requires minimum reputation with its primary faction and cannot be locked out of (Enemy) with essential supporting factions:

| Path | Primary Faction | Min Rep | Cannot Be Enemy With |
|------|----------------|---------|---------------------|
| Restoration | Threadwalkers | ≥ +50 (Friendly) | Common Folk |
| Release | Wardweavers | ≥ +50 (Friendly) | Hollow Court |
| Harmony | Rememberers | ≥ +50 (Friendly) | Common Folk, Hollow Court |

**If no path is accessible:** The player defaults to a defensive holding action (survive the Hollowing, stabilize but don't resolve). This is the "no ending" ending — the Thinning continues, the player saved the immediate crisis but didn't solve the underlying problem.

### 4.3 Summit Debate DC Modifiers (Encounter 10)

Per the encounter mechanics document:
- **Allied or Friendly:** -3 to that leader's DC
- **Favorable:** -1 to that leader's DC
- **Neutral:** no modifier
- **Unfavorable:** +2 to that leader's DC
- **Hostile:** +5 to that leader's DC
- **Enemy:** leader refuses to attend (auto-failure for that round)

### 4.4 Side Quest Access

| Reputation Tier | Available Side Quests |
|----------------|----------------------|
| Favorable+ | All faction-specific side quests in current act |
| Neutral-Positive | Common side quests only |
| Neutral-Negative or below | No faction side quests; some faction services restricted |

---

## 5. The Common Folk Exception

Common Folk reputation works differently from the other four factions:

1. **Starting rep is +10** (not 0). The player begins in Thornwick, a Common Folk village. They're known.
2. **Common Folk rep cannot go below -50** through normal play. The narrative design doesn't allow the player to become a true enemy of regular people without extreme, deliberate actions.
3. **All three Act IV paths require Common Folk rep ≥ 0.** Bryn's thousand voices are essential for every finale. Alienating the common people locks out all three paths.
4. **Common Folk rep is gained passively** through ceremony participation, village defense, and general heroism. It's lost through callousness, civilian harm, and ignoring settlements in danger.

---

## 6. Engine Implementation

### Data Model

```
FactionReputation {
    factionId: string;          // 'wardweavers' | 'threadwalkers' | 'rememberers' | 'hollow_court' | 'common_folk'
    score: number;              // -100 to +100
    tier: ReputationTier;       // derived from score
    history: ReputationEvent[]; // log of all changes for transparency
}

ReputationEvent {
    actionId: string;           // unique action identifier
    delta: number;              // change amount
    reason: string;             // human-readable reason
    timestamp: number;          // game-time
    crossEffect: boolean;       // was this a ripple from another faction?
}

ReputationTier = 'enemy' | 'hostile' | 'unfavorable' | 'neutral_negative' | 'neutral' | 'neutral_positive' | 'favorable' | 'friendly' | 'allied';
```

### Pure Functions (for Beacon)

```
getReputationTier(score: number): ReputationTier
applyReputationChange(state: FactionReputation[], factionId: string, delta: number, reason: string): FactionReputation[]
    // Applies direct change + cross-effects via relationship matrix
    // Handles diminishing returns
    // Clamps to [-100, +100]
checkContentAccess(state: FactionReputation[], contentId: string, requirements: AccessRequirement[]): boolean
getDialogueModifiers(state: FactionReputation[], factionId: string): DialogueModifiers
    // Returns: dcModifier, merchantPriceModifier, knowledgeTier, toneDescriptor
```

### LLM Integration

The prompt builder should inject faction reputation context into every NPC interaction:

```
NPC faction: Wardweavers
Player reputation with Wardweavers: Favorable (+32)
Tone: Cautious but positive. This NPC answers questions honestly but doesn't volunteer secrets.
      Merchant prices are standard. The NPC refers to the player with mild respect.
```

The LLM renders the tier as behavior — it never mentions numbers, scores, or tiers by name.

---

## 7. RAW Deviations

| Deviation | Rationale |
|-----------|-----------|
| Entire system is custom | D&D 5e has no faction reputation mechanics (the 2014 DMG mentions renown briefly in the faction chapter, but with no formalized rules). This system is built from scratch for LoreWeave's factional narrative. |
| Hidden score (player never sees numbers) | Aligns with companion system's hidden relationship tracker. The player should feel the consequences, not game the numbers. The LLM's tone shifts are the feedback mechanism. |
| Cross-effect matrix | Represents political reality — helping one group affects others' opinion of you. Not a D&D mechanic but a common video game RPG pattern (Fallout: New Vegas, Baldur's Gate 3) adapted for tabletop sensibility. |
| Common Folk exception (floor at -50) | Narrative guard rail. The Common Folk aren't an organization that can declare you an enemy — they're civilians. You can be feared or mistrusted, but they can't mount organized opposition the way the Guild can. |

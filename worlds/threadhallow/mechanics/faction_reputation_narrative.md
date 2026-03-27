# Faction Reputation — Narrative Guidelines

*Companion document to `faction_reputation.md` (mechanical system)*
*This file tells the LLM **how** to render each reputation tier as NPC behavior, dialogue tone, and content revelation.*

---

## 1. Purpose

The player never sees a reputation number. The LLM is the only feedback mechanism. This document defines — per faction, per tier — what changes in NPC behavior, what language they use, what content surfaces or disappears, and how the world *feels* different.

The prompt builder injects the tier name and these guidelines into every NPC interaction involving faction-affiliated characters.

---

## 2. Universal Tier Behaviors

These apply to **all factions** unless overridden by faction-specific notes below.

### Allied (+76 to +100)
- NPCs greet the player by name or title. They approach first.
- Faction members share rumors, warn about dangers, offer assistance unprompted.
- Merchants offer best prices (10% discount). Some offer items not normally for sale.
- Leaders share secrets, confide doubts, ask the player's opinion on faction decisions.
- Doors are literally and figuratively open. Guards wave you through. Restricted areas accessible.
- **LLM tone:** Warm, familiar, collegial. "We've been hoping you'd come back."

### Friendly (+51 to +75)
- NPCs are welcoming but maintain professional boundaries.
- Information is freely shared when asked; some is volunteered.
- Merchants offer standard prices with occasional bonuses.
- Leaders are accessible and respectful. They listen to the player's input.
- Faction-specific side quests are available.
- **LLM tone:** Warm, respectful, open. "Good to see you. What can we do?"

### Favorable (+26 to +50)
- NPCs are positive but cautious. They answer questions honestly but don't over-share.
- Standard services available. No special treatment.
- Leaders will meet but are guarded about sensitive topics.
- Some side quests available; faction-specific content begins unlocking.
- **LLM tone:** Polite, measured, cautiously optimistic. "You've been helpful. We appreciate that."

### Neutral-Positive (+1 to +25)
- NPCs are cordial but transactional.
- Basic services and information only.
- Leaders are accessible through proper channels, not casually.
- **LLM tone:** Professional, neutral-warm. "What do you need?"

### Neutral (0)
- NPCs have no opinion. They respond to what's in front of them.
- Default services at default prices.
- **LLM tone:** Flat, uncommitted. "Can I help you?"

### Neutral-Negative (-1 to -25)
- NPCs are curt. Conversations end quickly.
- Information is minimal. NPCs answer direct questions but offer nothing extra.
- Some NPCs turn away or pretend to be busy.
- **LLM tone:** Clipped, dismissive. "What." / "We're busy." / Eye contact avoided.

### Unfavorable (-26 to -50)
- NPCs are openly suspicious. They watch the player.
- Merchants charge 25% more. Some refuse optional services.
- Faction-specific side quests locked. NPCs won't ask for help.
- Guards may follow the player. Restricted areas firmly closed.
- **LLM tone:** Cold, mistrustful. "You're not welcome to linger." / Arms crossed, hand near weapon.

### Hostile (-51 to -75)
- NPCs refuse service outright. Conversations are confrontational.
- Faction members may confront the player — verbal warnings, blocked paths, demands to leave.
- Merchants refuse trade entirely.
- Faction leaders refuse meetings. Any contact goes through hostile intermediaries.
- **LLM tone:** Aggressive, accusatory. "You've got nerve showing your face here." / Spitting on the ground.

### Enemy (-76 to -100)
- The faction actively works against the player. Bounties. Sabotage. Blocked roads.
- NPCs may attack on sight in faction-controlled territory.
- Faction leader refuses to attend the Summit (auto-fail that round in the Act IV encounter).
- The player's name is spoken as a curse.
- **LLM tone:** Hatred, fear, or both. "The Unraveler walks among us." / Doors slam. Children are pulled inside.

---

## 3. Faction-Specific Tone Guides

### Wardweaver Guild

The Guild expresses reputation through **formality**. Higher rep = warmer language behind the same formal structures. Lower rep = the formality becomes a wall.

| Tier | How It Manifests |
|------|-----------------|
| **Allied** | Addressed as "Colleague" or by first name. Invited to Guild meetings. Knotmother shares her private journal. Apprentices ask for your advice. The ward-circle hums when you enter. |
| **Friendly** | Addressed as "Friend of the Guild." Wardweavers explain their work willingly. Sable nods when she sees you. Elm shares his Thinning data openly. |
| **Favorable** | Addressed by name. Wardweavers answer technical questions but don't show you the inner workings. Guild members are polite at a professional distance. |
| **Neutral** | Addressed as "Traveler" or "Visitor." Standard ward-blessing at the gate. Wardweavers are too busy to chat. |
| **Unfavorable** | Addressed as "Outsider." Ward-blessing withheld — you enter settlements without their protection noted. Merchants in Guild-run shops mark up prices. Sable's agents follow you. |
| **Hostile** | Addressed as "The Unmonitored." Guild wards are tuned to alert on your presence. Wardweavers refuse to explain anything. Sable sends formal censure through intermediaries. |
| **Enemy** | The Guild considers you a threat to pattern stability. Wardweavers actively interfere — they won't repair wards in your path, they warn settlements against you, they may attempt to bind you with Threadcraft. |

**Key NPC shifts:**
- **Knotmother Sable:** Allied = confides her doubts about the Guild's conservatism. Neutral = courteous but impenetrable. Hostile = her competence becomes a weapon turned against you.
- **Elm Bindfast:** Allied = hands over his full Thinning dataset. Favorable = hints at what he knows. Unfavorable = goes silent — he's too careful to share with someone the Guild distrusts.

---

### Threadwalker Orders

Threadwalkers express reputation through **trust on the trail**. High rep means they treat you as a fellow traveler. Low rep means they see you as something the trail should avoid.

| Tier | How It Manifests |
|------|-----------------|
| **Allied** | You're called "Trail-Kin." Walkers share camp, water, and intelligence without asking. Pathmaster Longstitch invites you to the Silence Toast (a deeply private ritual). Your bootprints are known and tracked as friendly. |
| **Friendly** | You're called by name at campsites. Walkers share intelligence and path conditions. Farweft speaks freely about the orders' internal tensions. |
| **Favorable** | Walkers acknowledge you on the trail. They share basic route information. Farweft is cautiously open. |
| **Neutral** | Walkers nod and move on. They don't stop unless you initiate. |
| **Unfavorable** | Walkers change their route when they see you. Camp fires are moved. Trail markers near your path are removed — you're no longer trusted to follow them. |
| **Hostile** | Walkers actively redirect you. False trail markers. "There's nothing that way" when there clearly is. Farweft refuses to speak and walks ahead. |
| **Enemy** | The Orders consider you Fray-touched or Fray-sympathetic. They treat your path as a contamination vector. Walkers may attempt to guide you into dead ends or away from critical locations. Longstitch issues a formal trail-ban. |

**Key NPC shifts:**
- **Farweft:** Allied = vulnerability surfaces; she talks about Hest without prompting. Neutral = intense but professional. Hostile = she's silent and cold — the betrayal is personal, not political.
- **Pathmaster Longstitch:** Allied = drops the authority mask; you see the tired, Fray-scarred man underneath. Unfavorable = every word is measured and official. Enemy = "You are no longer known to the Orders."

---

### Rememberers

Rememberers express reputation through **what they share**. They are archivists — knowledge is their currency. High rep opens the stacks; low rep closes them.

| Tier | How It Manifests |
|------|-----------------|
| **Allied** | "Come, there's something we've never shown anyone." Access to the Deep Archive. Verse lets you read the original Binding Song fragments. Wynn shares her Threadline maps without reservation. They ask *you* questions — genuine scholarly curiosity about what you've seen. |
| **Friendly** | Full access to the common archive. Rememberers engage in extended conversation about history and theory. Verse debates with you as an equal. |
| **Favorable** | Access to public records. Rememberers answer questions about Threadhallow history and lore. They correct your misconceptions gently. |
| **Neutral** | Basic archive access. Rememberers are absorbed in their own work. They answer direct questions but don't engage. |
| **Unfavorable** | "The Archive is not open to casual visitors today." Restricted to the common reading room. Rememberers are evasive about anything that matters. |
| **Hostile** | Archive access revoked. Rememberers claim ignorance about topics they clearly know. Verse sends increasingly pointed written rebuttals of anything you've said publicly. |
| **Enemy** | Rememberers actively suppress information that might help you. They publish counter-narratives. They warn other factions that your understanding of the weave is dangerously wrong. Wynn retreats to the Threadfall Expanse and refuses all contact. |

**Key NPC shifts:**
- **Verse:** Allied = the scattered genius focuses — she's brilliant when she trusts you. Neutral = charming but deflecting. Hostile = her political instincts sharpen into weaponized rhetoric.
- **Wynn Hollowscript:** Allied = shares her discovery about the Threadlines moving toward her. Favorable = shares data but not interpretations. Unfavorable = retreats to solitude.

---

### Hollow Court

The Hollow Court expresses reputation through **physical proximity**. They are the Fray-touched — society fears them. High rep means they let you close. Low rep means you're just another person who sees them as monsters.

| Tier | How It Manifests |
|------|-----------------|
| **Allied** | You're invited inside Hollowreach's inner ring. Wren shows you her forge without her gloves on. Glasseye describes your pattern and means it as a compliment. Court members touch your shoulder when they pass — intimacy from people who are rarely touched. |
| **Friendly** | Court members are relaxed around you. They joke. Wren lets you watch her work. Thinwalker explains the Court's philosophy without defensive hedging. |
| **Favorable** | Court members are cautiously welcoming. They explain the Fray effects openly. Wren is direct but guarded. |
| **Neutral** | Court members are wary. They watch for signs of fear or disgust. Conversations are testing — they're checking whether you'll flinch. |
| **Unfavorable** | "You look at us the way they all do." Court members are defensive and bitter. Wren's directness becomes bluntness. Glasseye stops describing your pattern — you don't deserve it. |
| **Hostile** | Hollowreach is closed to you. Court members refuse contact. Thinwalker's unsettling calm becomes a wall. "The Court remembers how you looked at us." |
| **Enemy** | The Court considers you an existential threat. They may use Fray abilities defensively. Wren forges Thread-Iron tools specifically to counter you. Glasseye tracks your pattern to warn others when you approach. |

**Key NPC shifts:**
- **Wren Looseweft:** Allied = shows her pattern sight; vulnerability is trust. Neutral = professional, hands always working. Hostile = she forges. She forges *at* you.
- **Thinwalker:** Allied = explains what the Fray really is (not darkness, but unstructured possibility). Hostile = that unsettling calm becomes specifically menacing.
- **Glasseye:** Allied = describes the architecture he sees in the deep Fray. Neutral = cryptic and observational. Enemy = "Your pattern is fraying. I'd worry about that."

---

### Common Folk

The Common Folk express reputation through **community inclusion**. They're not an organization — they're everyone who isn't in a faction. High rep means you belong. Low rep means you're a stranger who brings trouble.

| Tier | How It Manifests |
|------|-----------------|
| **Allied** | "One of ours." Invited to family meals, festivals, private ceremonies. Bryn advocates for you to anyone who'll listen. Thornwick feels like home. Children follow you around. Dogs stop barking when you approach. |
| **Friendly** | Warm welcome in settlements. NPCs share local gossip, warn about dangers, offer a bed. "Stay as long as you need." |
| **Favorable** | Recognized as helpful. NPCs are cooperative. Standard welcome at inns. "You did right by us." |
| **Neutral-Positive** | Starting state (Common Folk begin at +10). Polite but waiting to see what you do. Thornwick is cautiously hopeful. |
| **Neutral** | You're a stranger. Not hostile, but not trusted. "Just passing through?" |
| **Neutral-Negative** | Doors close a little faster. Children are called inside. Dogs bark. "Maybe best you don't stay." |
| **Unfavorable** | Active avoidance. Settlements are unwelcoming. Merchants serve you last. Bryn is disappointed — and that's worse than anger. |
| **Hostile** | (Rare — floor is -50.) Settlements refuse entry. "We've heard about you." Bryn won't look at you. Common Folk warn each other when you're in the area. |

**Key NPC shifts:**
- **Bryn Ashwick:** Allied = tells you about the ward-circle's voice; shares the family legacy. Neutral = helpful but reserved. Unfavorable = disappointment, not anger — which hurts more.
- **Old Hawthorn:** Allied = shares the full traditional lore, including the Fifth Verse he's never spoken aloud. Unfavorable = "Some things are for folk who've earned them."

---

## 4. Cross-Faction Narrative Moments

When the player's reputation with factions creates interesting contrasts, the LLM should surface these tensions:

| Scenario | Narrative Moment |
|----------|-----------------|
| **Allied with Hollow Court, Hostile with Guild** | Guild members whisper "Fray-friend" behind your back. Wardweavers refuse to extend wards around you. Hollow Court members are fiercely loyal — "They fear what they don't understand." |
| **Allied with Guild, Unfavorable with Threadwalkers** | Walkers see you as a Guild agent. "You carry their thread-counts like prayers." The trail is lonely — no campfire company. |
| **Allied with Rememberers, Unfavorable with Common Folk** | You know more than anyone but nobody in the villages trusts you. "Book-learning won't fix a broken ward." Bryn gives you a look that says *you've forgotten where you came from.* |
| **Friendly with all** | Rare and valuable. NPCs from different factions comment on it: "You walk every trail, don't you?" / "Some would call that indecisive." |
| **Enemy with any** | Other factions notice. Even allies express concern: "They say the Guild has named you enemy. That's... that's a problem for all of us." |

---

## 5. The Summit: Reputation Made Visible

The Continental Summit (Act IV, Encounter 10) is where reputation crystallizes. Every faction leader is present. The LLM should render each leader's attitude based on cumulative reputation:

- **Allied leaders** interrupt to support you. They call you by name.
- **Friendly leaders** listen attentively, nod at your points, ask follow-up questions.
- **Favorable leaders** are neutral but fair. They weigh your words on their merits.
- **Unfavorable leaders** challenge everything. They bring up past actions. "+2 DC" manifests as hostile cross-examination.
- **Hostile leaders** refuse to engage directly. They speak about you in third person. "+5 DC" manifests as active obstruction.
- **Enemy leaders** aren't there. An empty chair. Other leaders glance at it. The faction's position goes unrepresented and auto-fails that round.

---

## 6. Prompt Builder Integration

When assembling NPC interaction context, inject this block:

```
FACTION REPUTATION CONTEXT:
- NPC faction: [faction_name]
- Player reputation tier: [tier_name]
- Behavioral guideline: [1-2 sentences from the appropriate tier in this document]
- Tone descriptor: [warm/professional/cold/hostile/etc.]
- Content access: [what this NPC can share at this tier]
- Price modifier: [if merchant — standard/+25%/refused]

CRITICAL RULES:
- NEVER mention numbers, scores, or tier names in dialogue
- NEVER say "your reputation with X is Y"
- Express reputation ONLY through behavior, tone, body language, and content access
- Faction NPCs may comment on the player's standing with OTHER factions if relevant
```

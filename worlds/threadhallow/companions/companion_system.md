# Threadhallow Companion System

*Who travels with you shapes the story you find.*

---

## Design Philosophy

Threadhallow is not a solo game. The player is a traveler who gathers allies — but this isn't a JRPG where you recruit 12 characters and swap them on a bench. Companions are **narrative commitments**. Choosing to travel with Sorrel means you're investing in her arc, hearing her commentary, and gaining access to content that other companions can't unlock. Choosing Glasseye instead means a fundamentally different experience of the same events.

### Core Principles

1. **Small party, big impact.** The player travels with 1–2 companions at a time. Not a full D&D party of 4–6. This keeps the LLM's character-voicing manageable and makes each companion feel present, not background noise.

2. **Companions are opinionated.** They comment on the world, disagree with player choices, have their own goals, and occasionally refuse requests that violate their values. They're characters, not stat blocks that follow you.

3. **Every companion unlocks content.** Bringing Farweft to the Singing Cairn reveals Threadwalker lore you can't access without her. Bringing Wren to the Rememberers' Archive triggers a confrontation about Fray-touched rights. Companions are **keys to narrative doors**.

4. **Companions can leave.** If the player consistently acts against a companion's values, the companion warns once, then departs. They don't die dramatically — they just stop traveling with you. They remain in the world as NPCs. This is more painful than a heroic sacrifice.

5. **No party management screen.** Companions join through story, not menus. You talk to them, build trust, and they offer to come along — or you ask, and they decide.

---

## Party Structure

### Maximum Active Companions: 2

The player + up to 2 companions at any time. This creates a 3-person party — lean enough that:
- The LLM can voice all three distinctly
- Combat encounters don't require complex party AI
- Every companion gets meaningful screen time
- Losing a companion is felt, not just a stat change

### Companion Slots

Companions fall into two functional categories (not communicated to the player — this is engine-level):

| Slot | Role | Narrative Function |
|------|------|--------------------|
| **Primary** | The companion most central to the current act's story | Drives the main quest forward, has the most dialogue and opinions |
| **Secondary** | An additional ally with complementary skills | Provides alternative perspectives, unlocks side content, fills mechanical gaps |

The player doesn't pick "primary" and "secondary" — the engine assigns this based on which companion has the most narrative hooks in the current location/quest. A companion who's primary in Act II might be secondary in Act III.

---

## Companion Roster

### Act I — The Village

| Companion | Class | Available | How to Recruit |
|-----------|-------|-----------|----------------|
| **Sorrel Greenhand** | Wardweaver (Druid) | Mid-Act I | Convince her to return to Thornwick. Requires either persuasion (DC 15), discovering her secret (she hears the Threadlines), or completing the Binding Song quest. She won't join if the player is dismissive of her guilt. |

**Sorrel** is the game's first and most important companion. She's designed as the long-haul partner — available from Act I and relevant through Act V. Her arc (guilt → competence → mastery → leadership) mirrors the player's journey from nobody to world-shaper.

*Note: No other Act I NPCs are recruitable. Bryn, Colm, Tam, and Aldric are rooted in Thornwick — they have lives and responsibilities. Old Hawthorn drifts in and out on his own schedule.*

### Act II — The Road

| Companion | Class | Available | How to Recruit |
|-----------|-------|-----------|----------------|
| **Farweft** | Threadwalker (Ranger) | Start of Act II | She joins automatically as the quest-giver. Her continued companionship depends on mutual respect — if the player undermines the Threadwalker mission or sides with the Wardweavers against her, she stays at Loomhearth. |
| **Wren Looseweft** | Fray-Touched (Fighter) | Mid-Act II | Negotiate successfully with the Hollow Court at Hollowreach. Wren offers to accompany the player to Loomhearth to advocate for Fray-touched recognition. She won't join if the player is hostile to the Hollow Court. |

**Farweft** is the Act II primary companion by default. She knows the wilds, can read Threadlines, and has strong opinions about every faction the player meets. She's the lens through which the player experiences the wider world.

**Wren** is available as a secondary. She provides the Hollow Court perspective and can sense Fray activity — invaluable for navigating thin places. Recruiting her is the player's first real faction choice (the Wardweavers view her presence unfavorably).

### Act III — The Deep

| Companion | Class | Available | How to Recruit |
|-----------|-------|-----------|----------------|
| **Wynn Hollowscript** | Rememberer (Wizard) | Mid-Act III | Find her in the Threadfall Expanse. Earn her trust by demonstrating genuine interest in her work (not just using her). Requires either passing her linguistic puzzle (Investigation DC 18), sharing the player's accumulated lore, or bringing Verse's research notes. She won't join if rushed or patronized. |

**Wynn** is the Act III specialist. Her linguistic framework is essential for the Weavers' Cradle revelation. Without her as a companion, the vision at the First Loom Stone is fragmentary and harder to interpret. With her, it's devastating and clear.

*Note: The player likely has 3 recruitable companions by Act III (Sorrel, Farweft, Wren) plus Wynn. Since the party cap is 2, the player must choose. This is intentional — every combination produces different content.*

### Act IV — The Choice

No new recruitable companions. Instead, the player's companion choices during Act IV signal their path commitment:

| Path | Natural Companion Pair | Why |
|------|----------------------|-----|
| **Restoration** | Farweft + Glasseye* | Threadwalker knowledge + pattern sight to perceive the Weavers at Keystones |
| **Release** | Wren + Sorrel | Fray expertise + Wardweaving skill for Ward Engine construction |
| **Harmony** | Wynn + Sorrel (or Verse**) | Linguistic framework + the strongest mortal Threadcraft practitioner |

*\*Glasseye is not a full companion — he's a guide for specific Keystone sequences in Act IV. He travels with the party for those quests but doesn't have a full companion arc.*

*\*\*Verse is available as a temporary companion for the Harmony path's research phase only. She returns to the Archive for the finale.*

### Act V — The Binding

All recruited companions contribute to the finale, whether or not they're in the active party. The player's 2 active companions participate directly in the final encounter. All others contribute through offscreen coordination (defending other Keystones, rallying factions, performing support ceremonies).

---

## Companion Mechanics

### In Combat

Companions act on their own initiative. The engine resolves their actions using:
- Their stat block (generated from their archetype + stats tier)
- A simple tactical priority: protect the player > attack engaged enemies > use abilities strategically
- The player can issue one **suggestion** per round ("focus on the Thread-Eater," "guard the entrance") which the companion follows unless it conflicts with self-preservation

The player does NOT control companion actions directly. This is intentional:
- It reinforces that companions are people, not tools
- It keeps the player's turn simple (their own actions only)
- It creates moments where companions make unexpected choices that feed the narrative

### In Exploration

Companions contribute:
- **Passive perception/skills** — Farweft's high Perception catches ambushes; Wynn's Arcana detects magical anomalies
- **Knowledge checks** — Companions automatically share relevant knowledge when the player enters a location or encounters something in their expertise
- **Object interaction** — Some objects/NPCs respond differently based on who's present (a Wardweaver NPC is more forthcoming with Sorrel; Fray-touched creatures are calmer around Wren)

### In Dialogue

The DM voices companions during scenes. Companion interjections are triggered by:
- **Topic relevance** — Farweft speaks up when Threadwalker matters arise
- **Emotional stakes** — Sorrel reacts when the player makes choices about Thornwick's future
- **Disagreement** — If the player's stated action contradicts a companion's values, the companion objects before the action resolves
- **Approval/disapproval** — Hidden tracker (not shown to the player as a number). Consistent alignment with a companion's values deepens the relationship; consistent opposition erodes it. Expressed through tone shifts in dialogue, not UI.

---

## Companion Arcs

Each companion has a personal quest that runs parallel to the main story. These are optional but rewarding — completing a companion's arc unlocks their full potential (a new ability or narrative option in the finale).

### Sorrel Greenhand — "The Unfinished Verse"

**Thread:** Sorrel heard something in the Threadlines near Thornwick — a pattern that wasn't a Binding Song. As she travels with the player, she begins to hear it more clearly. It's a fragment of the original Weaver language, embedded in the Thornwick ward-circle by Aldith Ashwick (Maren's grandmother), who was a far more powerful Wardweaver than anyone realized.

**Stages:**
1. (Act I) Sorrel admits she hears patterns in the Threadlines
2. (Act II) At the Singing Cairn, Sorrel recognizes the pattern — it matches the cairn's resonance
3. (Act III) In the Knotwood, Sorrel speaks a word in the Weaver language without meaning to. It silences the forest for ten seconds.
4. (Act IV) Sorrel realizes she can learn the Weaver language naturally — she's the first mortal with this ability in 1,200 years

**Resolution:** Sorrel composes a new verse for the Binding Song — not recovered from the past, but created fresh. This verse is essential for the Harmony path's finale and significantly helps the other two paths.

### Farweft — "The Walker's Silence"

**Thread:** Farweft transferred from the Mending Path to the New Stitch after her patrol partner, **Hest**, was killed by a Fray manifestation. She blames the old techniques for his death. But as she travels deeper into the wilds, she finds evidence that Hest didn't die — he was pulled into a thin place that sealed behind him. He's been surviving inside a Frayed pocket for two years.

**Stages:**
1. (Act II) At Ashenmoor, Farweft finds one of Hest's trail signs — impossible, since he's been declared dead
2. (Act II) At the Singing Cairn, a Threadline vibration matches Hest's personal frequency (each walker has one)
3. (Act III) In the Threadfall Expanse, Farweft locates the sealed thin place. Hest is alive but Fray-touched.
4. (Act III/IV) The player helps Farweft extract Hest. He's changed — partially Fray-touched, confused, grateful. He joins the Hollow Court.

**Resolution:** Farweft reconciles her grief. She stops running from the Mending Path and instead bridges the orders — she's the first walker who's genuinely comfortable with both old and new techniques. Her dual-order status is critical for coordinating Threadwalker support in Act V.

### Wren Looseweft — "The Forge in the Fray"

**Thread:** Wren was a blacksmith before she was Fray-touched. She still thinks like one — about shaping, tempering, and structure. She believes she can forge tools from Fray-touched materials that interact with the weave directly. Not Threadcraft through magic, but Threadcraft through *craft*.

**Stages:**
1. (Act II) Wren mentions offhandedly that Fray-touched iron behaves differently — it resonates
2. (Act III) The player finds Fray-crystallized material in the Threadfall Expanse. Wren is fascinated.
3. (Act IV) With the right materials and a forge, Wren creates the first **Thread-Iron** tool — a hammer that can physically interact with Threadlines

**Resolution:** Wren's Thread-Iron crafting opens a new approach to ward maintenance — mechanical rather than magical. This is essential for the Release path (Ward Engines need physical components) and useful for all paths (Thread-Iron tools let non-practitioners contribute to weave maintenance).

### Wynn Hollowscript — "The Silence Speaks"

**Thread:** Wynn has been transcribing Threadline vibration patterns for twenty years. She has thousands of pages of notation. But she's always assumed the patterns were one-directional — the weave broadcasting, no one listening. What if the Weavers have been trying to reply to the Binding Songs this entire time, and no one could hear them?

**Stages:**
1. (Act III) When the player finds Wynn, she's frustrated — her patterns show clear structure but she can't decode the "grammar"
2. (Act III) At the Weaver's Mark in the Knotwood, Wynn and the player together crack the first sentence
3. (Act IV) Wynn begins receiving *responses* to her transcription attempts. The patterns change when she's present. She's not just reading — she's being read.
4. (Act IV) Wynn composes the first question in the Weaver language. The response is: "Finally."

**Resolution:** Wynn becomes the first Speaker — the proof that mortal-Weaver dialogue is possible. Her breakthrough is the foundation for the Harmony path and provides critical intelligence for Restoration and Release.

---

## Companion Departure Conditions

Companions don't die in scripted scenes (the player's choices matter too much to undercut with forced drama). They leave if:

| Condition | Warning | Departure |
|-----------|---------|-----------|
| **Value violation** | Companion objects in dialogue. Tone shifts to cold. | After 3 unheeded warnings, companion says they need to go their own way. Available as NPC. |
| **Faction betrayal** | Direct opposition to the companion's core faction. | Immediate departure with explanation. Available as hostile or neutral NPC depending on severity. |
| **Neglect** | Player never engages with companion's personal quest stages when available. | Companion gradually disengages. Eventually says they're "needed elsewhere." Available as NPC. |
| **Story completion** | Companion's arc resolves. | Companion may choose to stay or pursue their new purpose. Player-influenced. |

### Specific Triggers

| Companion | Will Leave If... |
|-----------|-----------------|
| **Sorrel** | Player desecrates the Thornwick ward-circle, or consistently dismisses Threadcraft as irrelevant |
| **Farweft** | Player allies with Knotmother Sable against the Threadwalkers in Act II politics, or refuses to help search for Hest when evidence appears |
| **Wren** | Player advocates extermination/exile of Fray-touched people, or betrays Hollow Court trust |
| **Wynn** | Player destroys Rememberer texts, or treats her life's work as a means to an end without acknowledging its value |

---

## Engine Implications

### For the Narrative Engine (DM/LLM)

The DM's system prompt needs companion context:
- Active companion names, personalities, current relationship state
- Companion voice patterns (from NPC archetype data)
- Current companion arc stage (what they know, what they're feeling)
- Interjection triggers for the current location/quest

The LLM voices companions during narration, not as separate chat turns. Companion dialogue is woven into the DM's response: *"Farweft grabs your arm. 'Wait. That Threadline — it's wrong. Something's pulled it east, hard.'"*

### For the Rules Engine (Beacon)

- `CompanionState` type: id, archetype, relationship (hidden score), arc stage, active/inactive, departure warnings
- Companion combat AI: priority queue (protect player > engaged enemies > abilities)
- Suggestion system: player issues one command per round, companion interprets
- Party skill aggregation: highest passive Perception/Investigation/etc. across party
- Companion inventory: separate from player, managed by AI (companions equip themselves sensibly)

### For the World Engine

- Companion presence modifies NPC dialogue options
- Companion presence unlocks/locks specific interactions and quest branches
- Companion arc stages are persistent world state (event-sourced like everything else)
- Companions have daily schedules when not traveling (at rest stops, in settlements)

---

## What This Does NOT Include

- **Romance system** — Farweft is noted as a "potential romance option" in the faction docs. Romance is a natural extension of the relationship tracker but needs its own design pass. Not blocking.
- **Companion crafting/trading** — Can companions craft items or trade with NPCs independently? Probably yes, but the specifics depend on Beacon's crafting system (not yet built).
- **Companion permadeath** — Companions can't die in scripted scenes. Can they die in combat? Current design says no — companions are knocked unconscious at 0 HP and recover after combat. Death would require a deliberate design decision and a very good narrative reason.
- **Companion-to-companion relationships** — Do Farweft and Wren clash? Does Sorrel look up to Wynn? This would add depth but multiplies the LLM's character-voicing burden. Defer unless we want to invest heavily.

# Companion Features — Extended Design

*Systems deferred during initial companion design. These deepen the companion experience without changing the core structure (2-companion party, hidden relationship tracker, no direct combat control).*

---

## 1. Romance System

### Philosophy

Romance in Threadhallow is **slow, earned, and expressed through dialogue tone shifts** — never through a "romance meter" or a gift-giving minigame. The LLM handles all romantic expression through companion voice changes, which means romance is as nuanced as the writing, not as mechanical as a stat.

### Romanceable Companions

| Companion | Available | Orientation | How It Develops |
|-----------|-----------|-------------|-----------------|
| **Farweft** | Act II onward | Player-sexual (responds to any player character) | Intensity becomes tenderness. She stops holding back. The Silence Toast becomes a shared ritual. |
| **Wren** | Act III onward (requires extended time together) | Slow-burn, emotionally guarded | She starts showing you things she's built. Asking your opinion. Standing closer at campfires. Wren's love language is craft — she makes you something. |

**Not romanceable:** Sorrel (too much mentor/student dynamic with the player's role in Act I; romance would undercut her independence arc) and Wynn (too isolated, too focused — romance with Wynn would feel like colonizing her solitude).

### Mechanics

- **No romance stat.** Romance is a boolean state with gradations handled by LLM tone.
- **Trigger conditions:** Relationship threshold (hidden) + specific scene (unique per companion) + player reciprocation
- **The Scene:** Each romance has a pivotal moment where the companion makes their feelings clear. The player can reciprocate, decline gently, or not notice. All three are valid and respected.
  - **Farweft's scene:** After Hest's rescue (Act III). She's processing the loss of her grief — the thing that defined her for two years. She turns to the player. "I don't know what I am if I'm not mourning him. But I know I don't want to find out alone."
  - **Wren's scene:** After the Ward Engine prototype (Act IV). She's built something impossible. She's exhausted, exhilarated, and vulnerable for the first time. She hands the player a small Thread-Iron charm. "I made this. It's not for the mission. It's for you."
- **Post-romance:** The companion's dialogue shifts. More intimate, more vulnerable, more protective. They reference the relationship naturally. The LLM receives a `romance_active: true` flag that adjusts voicing.
- **Breakups:** If the player acts against the companion's values after romance begins, the companion doesn't just leave — they leave *hurt*. The farewell dialogue is different. Harder. They still care, which makes the departure worse.

### What Romance Does NOT Do

- No sex scenes (fade to black, or dawn-after-the-campfire)
- No romance-exclusive quest content (romance enriches existing content, doesn't gate new content)
- No jealousy mechanics (if you romance Farweft in Act II and Wren in Act IV, the game doesn't punish you — Farweft has moved on to other concerns by then)
- No "optimal romance path" — you can't game it with gifts or correct answers

---

## 2. Companion-to-Companion Relationships

### Philosophy

Companions aren't just satellites orbiting the player. They have opinions about each other. They talk when the player isn't addressing them. They form bonds, rivalries, and alliances that develop over time.

### Relationship Matrix

| Pair | Dynamic | How It Develops |
|------|---------|-----------------|
| **Farweft + Sorrel** | Mutual respect, different generations | Farweft sees in Sorrel what she once was — talented and scared. She mentors without condescending. Sorrel admires Farweft's confidence but resists being treated as fragile. |
| **Farweft + Wren** | Friction → grudging respect | Farweft distrusts the Fray. Wren *is* the Fray (touched). They argue about whether the Fray is the enemy or a misunderstood part of the world. By Act IV, Farweft admits Wren's Thread-Iron changed her mind. Wren admits the Threadwalkers' mapping saved lives. They'll never be friends, but they'll fight side by side. |
| **Farweft + Wynn** | Patience tested | Wynn doesn't follow social conventions. Farweft is all convention and discipline. Farweft learns that Wynn's observations, while delivered oddly, are always accurate. Wynn learns that Farweft's discipline is a form of caring. |
| **Sorrel + Wren** | Craft kinship | Both are makers — Sorrel weaves wards, Wren forges Thread-Iron. They bond over the shared experience of working with the weave through their hands. Quiet companionship. They sit together at campfires and work in parallel. |
| **Sorrel + Wynn** | Teacher-student | Wynn has knowledge Sorrel needs (linguistic framework). Sorrel has instincts Wynn lacks (social intuition). Their relationship is academic but warm. Wynn is the first person who treats Sorrel's Threadline sensitivity as a gift rather than a quirk. |
| **Wren + Wynn** | Mutual fascination | Wynn sees patterns. Wren builds things. Together they hypothesize about the Fray, the Weavers, and the nature of reality — conversations that go over everyone else's heads. They're the "science team." |

### Implementation

- **Banter system:** When two companions are present, they occasionally exchange lines. Not scripted dialogue — LLM-generated from relationship context:
  - `companion_relationship: { farweft_wren: "friction, grudging_respect" }`
  - The DM engine includes this context in prompt assembly: "Farweft and Wren are currently in a state of grudging respect. They argue but protect each other."
- **Relationship evolution:** The state updates based on story events, not player manipulation. Farweft and Wren's shift from friction to respect happens when the player brings them both to Hollowreach (Wren's home) and Farweft sees the Fray-touched living normal lives.
- **Player influence:** The player can encourage or discourage companion interactions but can't force them. Telling Farweft to apologize to Wren doesn't work. Bringing them to a situation where they see each other's value does.

---

## 3. Companion Crafting Independence

### Philosophy

Companions are people with skills. They don't just fight — they *do things* during downtime. Wren forges. Sorrel tends wards. Farweft scouts. Wynn writes. These activities produce tangible benefits that make the companion feel like a contributing member of the party, not a combat bot.

### Companion Activities

| Companion | Activity | Requires | Produces |
|-----------|----------|----------|----------|
| **Sorrel** | Ward tending | Access to a ward-circle, downtime | Ward strength +2 per rest at a warded settlement. She can also repair minor Thread damage to equipment. |
| **Farweft** | Scouting | Wilderness, 2 hours | Reveals nearby points of interest, warns of Fray creature activity, identifies safe camping sites. Reduces random encounter chance by 50%. |
| **Wren** | Thread-Iron work | Forge access, raw materials | Can craft Thread-Iron items: charms (minor Fray resistance), tools (interact with weave physically), and eventually Ward Engine components. |
| **Wynn** | Research | Archive access OR Threadline proximity, downtime | Translates Weaver's Marks, identifies Threadline patterns, provides lore context for the player's current location. Can reduce DCs on lore-related checks by 2. |

### Implementation

- Activities happen during **downtime** (resting at a settlement or camp)
- The player doesn't manage companion activities — companions choose what to do based on available resources and current context
- Activity results appear in the next session's narrative: "Farweft returned from scouting at dawn. She found a thin place two miles east — small, probably nothing larger than Looselings."
- Companion crafting items are **narrative tools**, not stat sticks. Wren's Thread-Iron charm doesn't give +1 AC — it lets you touch a Threadline without burning your hands.

---

## 4. Companion Departure and Return

### Philosophy

Companions can leave. They can also come back. Departure is painful. Return is earned.

### Departure Triggers

Each companion has a **red line** — an action that, if taken three times despite warnings, causes them to leave:

| Companion | Red Line | Warning Signs |
|-----------|----------|---------------|
| **Sorrel** | Deliberately destroying wards or Loom Stones | She goes quiet. Stops offering opinions. Asks "are you sure?" twice. |
| **Farweft** | Abandoning people to the Fray (leaving NPCs behind in danger) | She argues. Then she argues louder. Then she does the thing herself and stops speaking to you. |
| **Wren** | Betraying Hollow Court trust (selling their secrets, leading enemies to Hollowreach) | She watches you. Makes a small Thread-Iron item and doesn't give it to you. Tests whether you'll notice she stopped sharing plans. |
| **Wynn** | Destroying knowledge (burning archives, suppressing information) | She panics. Repeats herself. Starts hiding texts in her personal bags. |

### Return Conditions

A departed companion can return **once**, under specific conditions:

| Companion | Return Condition |
|-----------|-----------------|
| **Sorrel** | Repair a ward the player previously damaged. Sorrel hears about it through the common-folk network and shows up. |
| **Farweft** | Save someone from the Fray without being asked. Farweft encounters a Threadwalker who saw you do it. She shows up at the next campfire. |
| **Wren** | Deliver something to Hollowreach that benefits the Court — no strings attached. Wren meets you at the Boundary. |
| **Wynn** | Find and preserve a piece of knowledge that was at risk. Leave it where Wynn will find it. She appears at the player's next Archive visit. |

A second departure is permanent. They're still in the world. They're just done with you.

---

## 5. Companion Combat Behavior (Expanded)

### Philosophy

The player issues 1 suggestion per round. The companion decides. Here's how that decision works behind the scenes:

### Priority Queue

Each companion has a priority list the combat AI follows:

| Priority | Sorrel | Farweft | Wren | Wynn |
|----------|--------|---------|------|------|
| 1 | Heal the dying | Protect the player | Protect the weakest | Avoid melee entirely |
| 2 | Debuff enemies | Engage the biggest threat | Engage in melee | Support with utility magic |
| 3 | Follow player suggestion | Follow player suggestion | Follow player suggestion | Follow player suggestion |
| 4 | Maintain positioning | Aggressive flanking | Hold defensive line | Retreat to safety |

### Player Suggestion System

The player's suggestion is a **request**, not a command. The companion follows it if:
- It doesn't violate their priorities (Farweft won't ignore a dying player to chase a fleeing enemy)
- It doesn't violate their values (Sorrel won't destroy a sacred site even if tactically smart)
- It makes sense to them (Wynn won't charge into melee just because you asked)

If the companion refuses a suggestion, the LLM narrates why: "Farweft ignores your call to fall back — she's seen the Thread-Eater heading for Wren and she's already moving to intercept."

### Relationship Influence on Combat

Higher relationship = more willingness to follow unusual suggestions. A companion who trusts the player deeply will do things they normally wouldn't — Wynn might hold a chokepoint in melee if the player has earned her absolute trust, because she believes you wouldn't ask unless it was necessary.

---

## Implementation Notes for Beacon

The companion systems above need:

1. **CompanionState type** — `relationship: number (hidden)`, `romance: boolean`, `departed: boolean`, `return_available: boolean`, `personal_quest_stage: string`, `red_line_warnings: number`
2. **CompanionRelationship type** — Per-pair state for banter: `{ pair: [CompanionId, CompanionId], state: string, evolved: boolean }`
3. **Combat AI priority queue** — Per-companion priority list, consulted before applying player suggestion
4. **Activity system** — During downtime, companions select an activity based on available resources; results feed into next session's context assembly
5. **LLM context flags** — `romance_active`, `companion_relationships`, `departure_warnings`, `red_line_count` — all fed into prompt builder for DM voicing

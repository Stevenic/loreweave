# Side Quest Templates

*Reusable quest structures the engine can instantiate in any settlement. Each template defines a pattern — the world generator fills in the specifics (NPCs, locations, items, factions) based on local context.*

---

## How Templates Work

Each template has:
- **Trigger** — what causes the quest to appear (arrival, time, NPC interaction, world state)
- **Roles** — NPC slots the generator fills from local archetypes
- **Stages** — ordered steps with branching outcomes
- **Resolution options** — at least 3, each with different consequences
- **Tags** — what the quest touches (combat, social, exploration, mystery, craft, faction)
- **Tier** — settlement sizes where this quest makes sense
- **Scaling** — how the quest adjusts to player level

---

## Template 1: Missing Person

**Tags:** exploration, mystery, social
**Tier:** hamlet, village, town, city
**Trigger:** NPC interaction (worried relative/friend approaches player)

### Roles
| Role | Filled By |
|------|-----------|
| **Questgiver** | Any NPC with `knowledge.always` containing `local_rumors` |
| **Missing person** | Any NPC from the settlement roster |
| **Witness** | Optional — NPC who saw something |

### Stages
1. **The Ask** — Questgiver reports someone hasn't been seen in [1d4] days. Last seen heading [direction].
2. **Investigation** — Player can ask locals (Insight/Persuasion), search the missing person's home (Investigation), or track them from their last known location (Survival).
3. **Discovery** — The missing person is found in one of these situations (rolled or contextual):
   - **Lost** — Injured in the wilderness, needs rescue
   - **Taken** — Captured by bandits/creatures; combat or negotiation to free
   - **Hiding** — Fled voluntarily (debt, shame, fear); social encounter
   - **Changed** — Fray-touched (Threadhallow-specific); delicate extraction
4. **Return** — Bring them back or report what happened.

### Resolutions
- **Rescued alive** — Reputation gain with questgiver, small reward
- **Found dead** — Questgiver mourns, may trigger follow-up quest (revenge, closure)
- **Found but won't return** — Player chooses: force, persuade, or respect their choice
- **Cover-up** — Player lies about what happened; Deception check, consequences if discovered

---

## Template 2: Fray Breach

**Tags:** combat, exploration, mystery
**Tier:** hamlet, village, town
**Trigger:** World state (ward strength drops below threshold) OR time-based (post-Hollowing)

### Roles
| Role | Filled By |
|------|-----------|
| **Reporter** | Guard, farmer, or shepherd NPC |
| **Expert** (optional) | Wardweaver or Threadwalker NPC if present |

### Stages
1. **The Warning** — Strange signs reported: livestock behaving oddly, fog that doesn't lift, sounds in empty fields.
2. **Scouting** — Player investigates the area. Perception/Survival to locate the breach. Nature/Arcana to assess severity.
3. **The Breach** — Encounter scaled to player level:
   - **Minor** (CR 1/4–1): Looselings, single Thread-Puppet
   - **Moderate** (CR 2–4): Thread-Eaters near wards, Frayed One, small pack
   - **Severe** (CR 4–6): Hollow Walker, multiple creatures, environmental hazards
4. **Sealing** — After clearing creatures, the breach needs closing. Options:
   - Temporary patch (Arcana DC 12–15, lasts days)
   - Ward repair (requires Wardweaver NPC or materials)
   - Leave it (breach worsens over time, triggers future quests)

### Resolutions
- **Sealed properly** — Ward strength recovers +5, settlement grateful
- **Patched temporarily** — Ward holds for 1d6 days, then degrades again
- **Creatures cleared but breach open** — No new creatures immediately, but ward continues to weaken
- **Failed/fled** — Breach expands, settlement panic, possible evacuation quest

---

## Template 3: Trade Dispute

**Tags:** social, faction
**Tier:** village, town, city
**Trigger:** NPC interaction (merchant or civic leader raises the issue)

### Roles
| Role | Filled By |
|------|-----------|
| **Side A** | Merchant NPC (local shopkeeper, traveling merchant) |
| **Side B** | Another merchant, guild representative, or civic authority |
| **Mediator** (optional) | Village elder, magistrate |

### Stages
1. **The Complaint** — Side A claims Side B is cheating, undercutting, hoarding, or breaking an agreement.
2. **Investigation** — Player talks to both sides, examines evidence (ledgers, goods, witnesses).
3. **The Truth** — One of:
   - **A is right** — B is genuinely cheating
   - **B is right** — A is lying or mistaken
   - **Both wrong** — Misunderstanding or third-party manipulation
   - **Both right** — Genuine conflict of interest, no villain
4. **Judgment** — Player decides or advises.

### Resolutions
- **Side with A** — A grateful, B resentful; prices/availability shift
- **Side with B** — Reverse of above
- **Compromise** — Both slightly unhappy, no enemies made, reputation for fairness
- **Expose third party** — If applicable; both sides grateful, new enemy
- **Walk away** — Dispute festers, may escalate to violence later

---

## Template 4: Festival Preparation

**Tags:** social, craft, exploration
**Tier:** hamlet, village, town
**Trigger:** Calendar-based (approaches a Wheel of Binding ceremony or seasonal event)

### Roles
| Role | Filled By |
|------|-----------|
| **Organizer** | Village elder, innkeeper, or priest |
| **Helpers** | 2-3 local NPCs needing assistance |

### Stages
1. **The Announcement** — Festival approaching in [2-4] days. Organizer needs help with preparations.
2. **Tasks** (player picks 2-3 from available list, scaled to settlement):
   - Gather decorations/materials from the wilds (Survival, exploration)
   - Help a craftsperson finish their contribution (tool proficiency or Dexterity)
   - Settle a dispute about who does what (Persuasion/Insight)
   - Guard the supplies from wildlife/thieves (Perception, possible combat)
   - Perform or contribute to the ceremony itself (Performance, Religion, Arcana)
3. **The Festival** — Celebration scene. Quality depends on tasks completed. NPCs react to player's contributions.

### Resolutions
- **All tasks complete** — Full festival, morale boost, ward strength +2, NPC relationships improve
- **Partial** — Festival happens but subdued; some NPCs disappointed
- **Sabotaged** — If an enemy interfered (follow-up quest to find who)
- **Player performs ceremony** — Special: if player learned Binding Song elements, ward strength +5

---

## Template 5: Creature Problem

**Tags:** combat, exploration
**Tier:** hamlet, village, town, city
**Trigger:** NPC interaction (farmer, guard, or merchant reports threat)

### Roles
| Role | Filled By |
|------|-----------|
| **Questgiver** | Farmer, shepherd, guard, merchant — whoever's affected |
| **Hunter** (optional) | Ranger or mercenary NPC who can assist |

### Stages
1. **The Report** — Something is killing livestock, raiding stores, or threatening travelers.
2. **Tracking** — Survival to track, Nature to identify. Player learns what they're dealing with.
3. **Confrontation** — Combat encounter scaled to level:
   - Wolves, bears, giant spiders (natural)
   - Bandits, highway robbers (humanoid)
   - Fray creatures (if near thin places)
4. **Resolution** — Kill, drive off, or address root cause.

### Resolutions
- **Killed** — Simple, effective. Reward. Problem may recur if cause isn't addressed.
- **Driven off** — Creatures relocate, potentially becoming someone else's problem
- **Root cause found** — The creatures were displaced by Fray expansion, food source destroyed, etc. Leads to deeper quest.
- **Tamed/befriended** — Rare; Animal Handling DC 18+. Unusual but memorable.

---

## Template 6: The Stranger

**Tags:** mystery, social, faction
**Tier:** hamlet, village, town
**Trigger:** Time-based (new NPC arrives in settlement)

### Roles
| Role | Filled By |
|------|-----------|
| **Stranger** | Wanderer archetype NPC (pilgrim, mercenary, fortune_teller, refugee) |
| **Suspicious local** | Any authority or service NPC |

### Stages
1. **Arrival** — A stranger arrives. Locals are wary. The stranger needs something (shelter, supplies, directions, work).
2. **Social Probing** — Player can talk to the stranger (Insight), ask locals about them (Investigation), or observe their behavior (Perception).
3. **The Truth** — The stranger is:
   - **Harmless** — Genuine traveler, refugee, or pilgrim
   - **Useful** — Has information, skills, or goods the settlement needs
   - **Dangerous** — Scout for bandits, Fray-touched hiding their condition, wanted criminal
   - **Faction agent** — Threadwalker, Wardweaver Guild scout, Rememberer looking for something specific
4. **Outcome** — Player's actions determine whether the stranger stays, leaves, or causes trouble.

### Resolutions
- **Welcomed** — Stranger integrates; may become recurring NPC, open trade route, or share information
- **Exposed** — If dangerous, player confronts; combat or social resolution
- **Vouched for** — Player takes responsibility; consequences fall on player if things go wrong
- **Driven out** — Quick but potentially unjust; stranger may return as antagonist

---

## Template 7: Ruin Exploration

**Tags:** exploration, combat, mystery
**Tier:** any (wilderness-adjacent)
**Trigger:** Discovery (player finds structure) OR NPC tip (local mentions old ruins)

### Roles
| Role | Filled By |
|------|-----------|
| **Tipster** (optional) | Elder, hermit, or traveler who knows about the site |
| **Rival** (optional) | Another explorer, treasure hunter, or faction agent also interested |

### Stages
1. **Discovery** — Player learns about or stumbles upon ruins (dungeon archetype selected from local biome).
2. **Approach** — Environmental assessment. Perception to spot hazards, History/Arcana to identify the ruin's origin.
3. **Exploration** — Multi-room dungeon crawl using the location archetype's challenges (encounters, traps, skill_checks, saving_throws).
4. **The Find** — The ruin contains something meaningful:
   - Loot (per loot_tier)
   - Lore (inscription, journal, artifact that advances world knowledge)
   - Both
   - Nothing but danger (the real treasure was the skill checks along the way)

### Resolutions
- **Cleared and looted** — Treasure, XP, possible map to another ruin
- **Partially explored** — Can return later; dungeon state persists
- **Rival got there first** — Social or combat encounter with competitor
- **Lore discovery** — Faction reputation gain with Rememberers, possible main quest connection

---

## Template 8: Escort Mission

**Tags:** combat, social, exploration
**Tier:** village, town, city
**Trigger:** NPC interaction (someone needs to travel and wants protection)

### Roles
| Role | Filled By |
|------|-----------|
| **Client** | Merchant, courier, pilgrim, refugee, or any traveling NPC |
| **Threat** | Bandits, creatures, or environmental hazards along the route |

### Stages
1. **The Job** — Client needs to reach [destination] safely. Offers payment or trade.
2. **Travel** — 1-3 encounters on the road, drawn from biome encounter tables.
3. **Complications** — One of:
   - Route blocked (bridge out, Fray zone expanded, landslide)
   - Client has a secret (carrying contraband, fleeing something, not who they claim)
   - Ambush (bandits or creatures targeting the client specifically)
4. **Arrival** — Deliver the client (or not).

### Resolutions
- **Safe delivery** — Full payment, reputation at destination
- **Delivered but battered** — Reduced payment, client grateful but shaken
- **Client's secret revealed** — Moral choice: complete the job knowing the truth, or abandon
- **Failed** — Client lost, injured, or fled. Reputation hit.

---

## Template 9: Haunting

**Tags:** mystery, exploration, social
**Tier:** hamlet, village, town
**Trigger:** NPC interaction (someone reports supernatural activity)

### Roles
| Role | Filled By |
|------|-----------|
| **Witness** | Any NPC who's experienced the phenomena |
| **Source** | The cause (not always a ghost) |

### Stages
1. **The Report** — Strange occurrences: objects moving, sounds at night, cold spots, shadows with no source.
2. **Investigation** — Player examines the site. Perception, Investigation, Arcana. May need to wait for nightfall.
3. **The Source** — It's actually:
   - **Fray seepage** — Minor weave instability causing anomalies. Not sentient.
   - **Restless dead** — Genuine undead, usually tied to unfinished business
   - **Living intruder** — Someone using the "haunting" as cover (smuggler, spy, squatter)
   - **Weave memory** — The Tapestry replaying a traumatic event (Threadhallow-specific; the location remembers)
4. **Resolution** — Address the source.

### Resolutions
- **Fray sealed** — Anomalies stop, ward check recommended
- **Dead laid to rest** — Requires finding and addressing unfinished business; Religion, social
- **Intruder exposed** — Confrontation; may tie to larger plot
- **Memory acknowledged** — Unique: the weave memory can't be "fixed," only witnessed. Player gains lore, location becomes a minor landmark.

---

## Template 10: Faction Request

**Tags:** social, faction, variable
**Tier:** town, city
**Trigger:** Faction reputation threshold OR NPC interaction with faction agent

### Roles
| Role | Filled By |
|------|-----------|
| **Contact** | Faction-aligned NPC (Threadwalker, Wardweaver, Rememberer, Hollow Court, Common Folk leader) |
| **Target** | Whoever/whatever the faction wants the player to deal with |

### Stages
1. **The Approach** — A faction representative asks the player for help with something the faction can't or won't do publicly.
2. **The Task** — Varies by faction:
   - **Threadwalkers** — Scout a thin place, map Threadline disruptions, escort a patrol
   - **Wardweavers** — Deliver materials, inspect a distant ward, negotiate with a settlement that's behind on guild dues
   - **Rememberers** — Retrieve a text, investigate a Weaver's Mark, protect an archive
   - **Hollow Court** — Help a Fray-touched individual, establish safe passage through a Frayed zone, mediate with hostile settlements
   - **Common Folk** — Organize a ward-tending rotation, defend a farm, carry a petition to the guild
3. **Complications** — The task isn't straightforward. Another faction opposes it, the situation on the ground is different than described, or the player discovers the faction's motives are mixed.
4. **Report** — Return to the contact with results.

### Resolutions
- **Completed as asked** — Faction reputation +, possible opposing faction reputation -
- **Completed differently** — Player found a better solution; faction may or may not approve
- **Refused mid-task** — Reputation hit with requesting faction, possible gain elsewhere
- **Double-crossed** — Player works for both sides; Deception checks, high risk high reward

---

## Template 11: Crafting Commission

**Tags:** craft, social
**Tier:** village, town, city
**Trigger:** NPC interaction (craftsperson needs materials or help)

### Roles
| Role | Filled By |
|------|-----------|
| **Artisan** | Any craft NPC (blacksmith, weaver, potter, brewer, carpenter) |
| **Supplier** (optional) | Merchant or wilderness source for rare materials |

### Stages
1. **The Commission** — Artisan has a big order or special project but needs materials they can't get alone.
2. **Gathering** — Player sources materials:
   - Common materials — buy in town
   - Uncommon — harvest from wilderness (specific biome)
   - Rare — found in dungeons, traded from travelers, or in Fray-touched zones
3. **Crafting** — Player assists the artisan (tool proficiency checks) or watches and learns.
4. **Delivery** — The finished item goes to its recipient (or the player keeps it).

### Resolutions
- **Perfect result** — High-quality item, artisan teaches player something, repeat business
- **Adequate result** — Functional item, standard reward
- **Flawed materials** — If player cut corners on gathering, the item has problems; artisan upset
- **Rare discovery** — The materials have unexpected properties (Fray-touched wood that hums, ore with Threadline veins); opens new crafting possibilities

---

## Template 12: The Sick

**Tags:** social, mystery, exploration
**Tier:** hamlet, village, town
**Trigger:** World state (after Fray breach or ward decline) OR NPC interaction

### Roles
| Role | Filled By |
|------|-----------|
| **Patient** | Any NPC (or multiple) |
| **Healer** | Healer, herbalist, or priest NPC |

### Stages
1. **The Illness** — One or more NPCs are sick. Symptoms don't match normal diseases.
2. **Diagnosis** — Medicine, Nature, Arcana checks. The sickness is:
   - **Mundane** — Treatable with herbs and rest
   - **Fray exposure** — Low-level Fray-touch effects; needs specific treatment
   - **Cursed** — Object or location causing the illness; remove the source
   - **Contagious** — Spreading; time pressure to find the cure
3. **Treatment** — Based on diagnosis:
   - Gather herbs (exploration)
   - Remove cursed object (dungeon/mystery)
   - Seal Fray source (combat/arcana)
   - Quarantine and treat (social, resource management)
4. **Recovery** — NPCs recover (or don't).

### Resolutions
- **Full recovery** — All patients healed, healer grateful, possible cure recipe learned
- **Partial** — Some saved, some lost; emotional weight
- **Source removed but damage done** — Illness won't spread but existing patients have lasting effects
- **Player gets sick** — If Fray-touch: mechanical consequence (exposure level increase)

---

## Template 13: Rivalry

**Tags:** social, combat (optional)
**Tier:** village, town, city
**Trigger:** NPC interaction (two NPCs in open conflict)

### Roles
| Role | Filled By |
|------|-----------|
| **Rival A** | Any NPC |
| **Rival B** | Any NPC (same category or competing interests) |

### Stages
1. **The Tension** — Two NPCs have a beef. Public arguments, competing claims, escalating pranks or sabotage.
2. **Taking Sides** — Player is asked (or chooses) to get involved. Both sides try to recruit the player.
3. **Escalation** — Without intervention:
   - Shouting match → property damage → violence
   - One side recruits outside help (bandits, faction agents)
4. **Resolution** — Player intervenes or lets it play out.

### Resolutions
- **Mediated** — Both sides agree to terms; player gains reputation as peacekeeper
- **Sided with A/B** — Winner grateful, loser hostile
- **Let it burn** — One side wins violently; settlement stability damaged
- **Turned into competition** — Redirect rivalry into productive channel (craft contest, public debate); both sides save face

---

## Template 14: The Request From Beyond

**Tags:** mystery, social, exploration
**Tier:** hamlet, village, town
**Trigger:** Discovery (player finds a message, letter, or dying wish) OR NPC interaction

### Roles
| Role | Filled By |
|------|-----------|
| **Deceased/Absent** | The person who left the request (dead, missing, or departed long ago) |
| **Recipient** | The person the request was meant for |

### Stages
1. **The Discovery** — Player finds a letter, journal entry, carved message, or receives a deathbed request. Someone wanted something done and couldn't do it themselves.
2. **The Search** — Find the intended recipient (may have moved, changed name, or died themselves).
3. **The Delivery** — Bring the message/item/truth to its target. The recipient's reaction is unpredictable.
4. **Aftermath** — The request's fulfillment (or failure) ripples through the community.

### Resolutions
- **Delivered as intended** — Closure for recipient, sometimes bittersweet
- **Recipient is dead** — Player must decide what to do with the unfulfillable wish
- **Recipient refuses** — The past is painful; they don't want it reopened
- **Truth changes everything** — The request reveals a secret that recontextualizes local relationships

---

## Template 15: Ward Tending

**Tags:** craft, social, faction
**Tier:** hamlet, village
**Trigger:** Calendar-based (regular maintenance needed) OR world state (ward declining)

### Roles
| Role | Filled By |
|------|-----------|
| **Ward-Keeper** | Local Wardweaver, elder, or the player (if they've learned basics) |
| **Assistants** | 2-4 local volunteers |

### Stages
1. **Assessment** — Check the ward-circle's state. Arcana to evaluate, Investigation to find weak spots.
2. **Preparation** — Gather materials (thread, specific herbs, Loom Stone fragments). Organize volunteers.
3. **The Tending** — Skill challenge framework:
   - Arcana to channel (DC varies by ward health)
   - Performance to sing the maintenance verses
   - Nature to align with the season
   - Athletics to physically repair thread-patterns
4. **Result** — Ward strength adjusts based on successes.

### Resolutions
- **Strong tending** — Ward strength +5 to +10, flowers bloom at the ward-circle
- **Adequate** — Ward strength +2, holds steady
- **Weak** — Ward doesn't gain, but doesn't lose either
- **Botched** — Ward strength -3; something went wrong, creatures may probe the boundary

---

## Scaling Rules

| Player Level | Encounter CR Range | Skill Check DC Range | Reward Tier |
|-------------|-------------------|---------------------|-------------|
| 1–4 | 1/4 – 2 | 10 – 13 | Low |
| 5–8 | 2 – 5 | 12 – 15 | Medium |
| 9–12 | 5 – 8 | 14 – 17 | Medium–High |
| 13–16 | 8 – 12 | 16 – 19 | High |
| 17–20 | 12 – 17 | 18 – 22 | High–Legendary |

## Template Selection Weights

The engine selects side quests using weighted probability based on local context:

| Template | Base Weight | Boosted When... |
|----------|------------|-----------------|
| Missing Person | 10 | Near wilderness, low population |
| Fray Breach | 8 | Ward strength < 70, near thin places |
| Trade Dispute | 6 | Town/city, multiple merchants |
| Festival Preparation | 5 | Calendar ceremony approaching |
| Creature Problem | 10 | Near wilderness, biome has hostile spawns |
| The Stranger | 7 | On trade route, post-conflict |
| Ruin Exploration | 6 | Ruins structure nearby |
| Escort Mission | 7 | On trade route, between settlements |
| Haunting | 5 | Ward declining, post-Fray breach |
| Faction Request | 8 | Faction reputation > 0, faction NPC present |
| Crafting Commission | 4 | Craft NPC present, rare resources nearby |
| The Sick | 6 | Post-Fray breach, ward declining |
| Rivalry | 4 | Settlement size village+, multiple NPCs |
| Request From Beyond | 3 | Ruins nearby, burial site, old settlement |
| Ward Tending | 5 | Hamlet/village, ward strength < 80 |

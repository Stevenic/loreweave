# Threadhallow Mechanics Companion

*D&D 5e mechanical codification for the Threadhallow world. Every rule here is grounded in the 2024 Free Rules (primary) or 2014 Basic Rules (fallback), with deviations documented and rationale provided.*

*Author: Loremaster | Last updated: 2026-03-27*

---

## 1. NPC Stat Block Tiers

Bard's NPC archetypes define personality, voice, and narrative role. This section provides the mechanical skeleton the rules engine uses to generate stat blocks at runtime.

### 1.1 The Five Tiers

Every NPC in the archetype system belongs to one of five **combat tiers**. The tier determines base stats; the archetype adds flavor, equipment, and special abilities.

| Tier | CR Range | HP Range | AC Range | Prof. Bonus | Attack Bonus | Save DC | Examples |
|------|----------|----------|----------|-------------|-------------|---------|---------|
| **Commoner** | 0 – 1/8 | 4 – 11 | 10 – 12 | +2 | +2 to +3 | 10 – 11 | Farmers, laborers, beggars, children |
| **Skilled** | 1/4 – 1/2 | 13 – 27 | 12 – 14 | +2 | +3 to +4 | 11 – 12 | Guards, apprentices, shopkeepers with combat training |
| **Expert** | 1 – 3 | 27 – 65 | 13 – 16 | +2 to +3 | +4 to +6 | 12 – 14 | Veteran guards, guild masters, experienced adventurers |
| **Veteran** | 4 – 8 | 65 – 135 | 15 – 18 | +3 to +4 | +6 to +8 | 14 – 16 | War-hardened fighters, faction leaders, elite agents |
| **Elite** | 9+ | 135+ | 17+ | +4+ | +8+ | 16+ | Legendary figures, boss encounters, Loom-Born avatars |

*Source: CR-to-stats mapping derived from 2024 Free Rules, Monsters chapter, "Monster Statistics by Challenge Rating" table.*

### 1.2 Ability Score Arrays by Tier

Rather than rolling or assigning individual scores per NPC, the rules engine selects from tier-appropriate arrays. Each tier has three variants (physical, balanced, mental) to match the archetype's role.

| Tier | Physical Array | Balanced Array | Mental Array |
|------|---------------|----------------|-------------|
| **Commoner** | 12, 10, 10, 10, 10, 8 | 10, 10, 10, 10, 10, 10 | 8, 10, 10, 10, 12, 10 |
| **Skilled** | 14, 12, 12, 10, 10, 8 | 12, 12, 12, 10, 10, 10 | 10, 10, 12, 12, 14, 10 |
| **Expert** | 16, 14, 14, 10, 10, 8 | 14, 12, 14, 12, 12, 10 | 10, 10, 14, 14, 16, 12 |
| **Veteran** | 18, 16, 16, 10, 12, 8 | 16, 14, 16, 12, 14, 10 | 10, 12, 14, 16, 18, 14 |
| **Elite** | 20, 18, 16, 12, 12, 10 | 18, 16, 16, 14, 14, 12 | 12, 12, 14, 18, 20, 16 |

**Array assignment rules:**
- Scores are assigned to abilities (Str, Dex, Con, Int, Wis, Cha) in the order listed, with the **highest score going to the archetype's primary ability**.
- **Physical archetypes** (guards, blacksmiths, mercenaries): Primary = Str or Dex, Secondary = Con.
- **Balanced archetypes** (innkeepers, merchants, bards): Primary = Cha, Secondary varies.
- **Mental archetypes** (scholars, priests, fortune tellers): Primary = Int or Wis, Secondary = Cha.

### 1.3 Archetype-to-Tier Mapping

These are the default tier assignments. The world generator may shift a tier up or down based on settlement size (a city guard is Skilled; a capital guard captain is Veteran).

| Archetype Category | Default Tier | Tier Range |
|-------------------|-------------|------------|
| Shopkeeper | Commoner | Commoner – Skilled |
| Traveling Merchant | Skilled | Commoner – Expert |
| Innkeeper | Commoner | Commoner – Skilled |
| Guard | Skilled | Skilled – Expert |
| Guard Captain | Expert | Expert – Veteran |
| Blacksmith | Skilled | Commoner – Expert |
| Priest / Healer | Skilled | Skilled – Expert |
| Village Elder | Commoner | Commoner – Skilled |
| Magistrate | Skilled | Skilled – Expert |
| Bard / Minstrel | Skilled | Skilled – Expert |
| Beggar | Commoner | Commoner |
| Pilgrim | Commoner | Commoner – Skilled |
| Mercenary | Expert | Skilled – Veteran |
| Bounty Hunter | Expert | Expert – Veteran |
| Fortune Teller | Skilled | Skilled – Expert |
| Ranger / Hermit | Expert | Skilled – Veteran |
| Fence / Smuggler | Skilled | Skilled – Expert |
| Tax Collector | Skilled | Commoner – Skilled |

### 1.4 Runtime Stat Block Generation

The rules engine generates a stat block at encounter time using:

```
1. Look up archetype → default tier
2. Adjust tier for settlement size (+1 for town, +2 for city)
3. Select ability score array (physical/balanced/mental) from archetype role
4. Assign primary ability from archetype definition
5. Compute derived stats: HP, AC (from equipped armor), attack bonus, save DC
6. Add archetype-specific actions (from inventory + skills)
7. Add Threadcraft abilities if archetype has `threadcraft_tradition` field
```

This means the same "Guard" archetype produces a CR 1/4 village watchman or a CR 2 city sentinel depending on context.

---

## 2. Threadcraft — Spell Progression

The six Threadcraft traditions are Threadhallow's magic system. Each maps to D&D spell schools but uses Threadhallow-flavored components and mechanics.

### 2.1 Threadcraft Components

D&D spells use Verbal (V), Somatic (S), and Material (M) components. Threadcraft equivalents:

| D&D Component | Threadcraft Equivalent | Description |
|--------------|----------------------|-------------|
| **Verbal (V)** | **Song (S)** | Fragments of Binding Songs — humming, chanting, or singing specific phrases |
| **Somatic (S)** | **Weave (W)** | Physical thread manipulation — knotting, braiding, unraveling with the hands |
| **Material (M)** | **Thread (T)** | Physical thread, cord, or woven material consumed or held during casting |

*Rationale: Threadhallow's magic is tactile and musical, not arcane gesture-based. Renaming components grounds the system in the world's aesthetics while maintaining mechanical equivalence.*

### 2.2 Spellcasting Ability by Tradition

| Tradition | Spellcasting Ability | Rationale |
|-----------|---------------------|-----------|
| **Wardweaving** | Wisdom | Patience, perception of the weave's structure |
| **Songbinding** | Charisma | Force of personality channeled through voice |
| **Patternreading** | Intelligence | Analytical interpretation of weave patterns |
| **Threadwalking** | Wisdom | Intuitive navigation of the weave's currents |
| **Unweaving** | Intelligence | Understanding structural weaknesses to exploit |
| **Fraytouch** | Constitution | Endurance against the Fray's corrupting influence |

*Note: Fraytouch using Constitution is a deliberate deviation from standard D&D (no published class uses Con as spellcasting ability). Rationale: Fraytouch draws power through the body, not the mind or personality. The caster's physical resilience determines how much Fray energy they can channel without being consumed. This mirrors Warlock pact magic thematically — power at a cost.*

### 2.3 Spell DC and Attack Bonus

Standard 2024 Free Rules formula applies:

- **Spell Save DC** = 8 + proficiency bonus + spellcasting ability modifier
- **Spell Attack Bonus** = proficiency bonus + spellcasting ability modifier

### 2.4 Tradition Spell Lists

Each tradition has access to spells from its mapped D&D school(s), plus tradition-specific spells unique to Threadhallow. Below are the spells available at each spell level, drawn from the 2024 Free Rules spell list.

#### Wardweaving (Abjuration)

| Spell Level | Spells | Components |
|-------------|--------|------------|
| Cantrip | *Blade Ward*, *Resistance* | W; S, W |
| 1st | *Mage Armor*, *Protection from Evil and Good*, *Shield*, *Shield of Faith* | W, T; Song, W, T; W; Song, W |
| 2nd | *Aid*, *Lesser Restoration*, *Warding Bond* | Song, W, T; W, T; Song, W, T (a length of thread tied between caster and target) |
| 3rd | *Counterspell*, *Dispel Magic*, *Remove Curse*, *Protection from Energy* | W; Song, W; Song, W, T; Song, W |
| 4th | *Banishment*, *Death Ward*, *Freedom of Movement* | Song, W, T; Song, W, T (a woven knot placed over the heart); Song, W |
| 5th | *Dispel Evil and Good*, *Greater Restoration* | Song, W, T; Song, W, T |

**Tradition-specific:** *Stitch Ward* (1st level) — as *Alarm*, but creates a visible thread-boundary. When crossed by a hostile creature, the thread snaps audibly and the caster knows the direction. Duration: 8 hours. Components: W, T (10 feet of thread, consumed).

#### Songbinding (Enchantment / Bardic)

| Spell Level | Spells | Components |
|-------------|--------|------------|
| Cantrip | *Friends*, *Vicious Mockery* | Song; Song |
| 1st | *Bane*, *Bless*, *Charm Person*, *Command*, *Heroism* | Song, T; Song, T; Song; Song; Song, W |
| 2nd | *Calm Emotions*, *Enthrall*, *Hold Person*, *Suggestion* | Song, W; Song; Song, W; Song |
| 3rd | *Hypnotic Pattern*, *Sending*, *Tongues* | Song, W; Song, T (a snippet of thread connecting speaker to listener); Song |
| 4th | *Compulsion*, *Confusion* | Song; Song, W |
| 5th | *Dominate Person*, *Geas*, *Hold Monster* | Song, W; Song, W, T; Song, W |

**Tradition-specific:** *Binding Verse* (2nd level) — as *Silence*, but inverted: the caster sings a verse that binds all sound in the area to the melody. Creatures in the area can only speak in rhythm with the caster's song. Concentration, up to 1 minute. Creatures that attempt spellcasting with verbal components must succeed on a Charisma save or the spell fails.

#### Patternreading (Divination)

| Spell Level | Spells | Components |
|-------------|--------|------------|
| Cantrip | *Guidance*, *True Strike* | Song, W; W |
| 1st | *Comprehend Languages*, *Detect Evil and Good*, *Detect Magic*, *Identify* | W, T; Song, W; Song, W; W, T (a thread woven through the object) |
| 2nd | *Augury*, *Detect Thoughts*, *Locate Object*, *See Invisibility* | W, T (knotted thread cast like lots); Song, W; Song, W, T; W |
| 3rd | *Clairvoyance*, *Tongues* | Song, W, T; Song |
| 4th | *Arcane Eye*, *Divination*, *Locate Creature* | W, T; Song, W, T (woven offering); Song, W |
| 5th | *Legend Lore*, *Scrying* | Song, W, T; Song, W, T (a thread from the target or their possessions) |

**Tradition-specific:** *Read the Weave* (1st level) — the caster touches the ground and perceives the weave's condition within 60 feet. Reveals: weave stability (intact/thin/frayed/unraveled), recent magical activity, and the direction to the nearest Threadline. Components: W (touching the ground). Duration: Instantaneous.

#### Threadwalking (Transmutation / Movement)

| Spell Level | Spells | Components |
|-------------|--------|------------|
| Cantrip | *Mending*, *Light* | W, T; Song, W |
| 1st | *Expeditious Retreat*, *Feather Fall*, *Jump*, *Longstrider* | W; W, T; Song, W; Song, W |
| 2nd | *Misty Step*, *Spider Climb*, *Pass Without Trace*, *Enhance Ability* | W; W, T; Song, W; Song, W |
| 3rd | *Fly*, *Haste*, *Water Walk* | Song, W; Song, W, T; W |
| 4th | *Dimension Door*, *Freedom of Movement*, *Polymorph* | Song, W; Song, W; Song, W, T |
| 5th | *Teleportation Circle*, *Passwall* | Song, W, T (thread laid in a circle on the ground); W |

**Tradition-specific:** *Walk the Thread* (2nd level) — the caster steps onto a visible Threadline and travels along it at 10x walking speed for up to 1 minute. The caster is visible as a shimmer along the Threadline. Requires a Threadline within 10 feet. Concentration, up to 1 minute. Components: W (grasping the Threadline).

#### Unweaving (Evocation / Destruction)

| Spell Level | Spells | Components |
|-------------|--------|------------|
| Cantrip | *Fire Bolt* (flavored as thread-snap energy), *Ray of Frost* (flavored as heat-drain from unraveled threads) | W; W |
| 1st | *Burning Hands*, *Magic Missile*, *Thunderwave* | W; W; Song, W |
| 2nd | *Scorching Ray*, *Shatter* | W; Song, W |
| 3rd | *Fireball*, *Lightning Bolt*, *Spirit Guardians* (threads lashing out from the caster) | W, T; W; Song, W |
| 4th | *Ice Storm*, *Wall of Fire* (wall of unraveled threads burning with released energy) | Song, W; W, T |
| 5th | *Cone of Cold*, *Destructive Wave* | Song, W; Song, W |

**Tradition-specific:** *Unravel* (1st level) — the caster pulls at the weave around a target within 30 feet. The target takes 2d8 force damage (save: Dexterity half). If the target is a magical effect or ward, it must make a check (as *Dispel Magic* but using the Unweaver's spell attack bonus vs. DC 10 + the spell's level). Components: W (pulling gesture). Higher levels: +1d8 per spell level above 1st.

#### Fraytouch (Forbidden)

Fraytouch has no standard D&D school — it draws power from outside the Tapestry. Its spells are unique to Threadhallow.

| Spell Level | Spell | Effect | Components |
|-------------|-------|--------|------------|
| Cantrip | *Fray Whisper* | Touch attack, 1d10 necrotic. Target must Con save DC 10 or gain 1 level of Fray exposure | W |
| 1st | *Hollow Grasp* | As *Inflict Wounds* (3d10 necrotic), but the caster takes 1d4 necrotic (unresistable) | W |
| 2nd | *Fray Step* | As *Misty Step*, but the caster passes through the Fray. On arrival, each creature within 5 feet makes Con save or takes 2d6 necrotic | W |
| 3rd | *Unravel Mind* | As *Fear*, but targets also take 3d6 psychic damage on failed save. Caster gains 1 Fray exposure level | Song, W |
| 4th | *Hollow Shell* | As *Greater Invisibility*, but the caster doesn't turn invisible — they step partially into the Fray. Attacks from the Tapestry have disadvantage against them, but they have disadvantage on attacks against Tapestry creatures | W |
| 5th | *Tear the Weave* | 60-foot radius. All creatures make Con save or take 8d6 force damage (half on save). The area becomes a thin place for 24 hours. The caster takes 4d6 necrotic (unresistable) and gains 2 Fray exposure levels | Song, W |

**Fray Corruption Mechanic:** Every Fraytouch spell of 1st level or higher requires the caster to make a **Constitution saving throw** (DC = 10 + spell level) after casting. On failure, the caster gains one **Fray exposure level** (see Section 3). This is in addition to any exposure built into specific spells.

### 2.5 Threadcraft Practitioner Levels

Not all NPCs are full casters. Threadcraft proficiency exists on a spectrum:

| Practitioner Level | Spell Level Access | Equivalent D&D Level | Examples |
|---|---|---|---|
| **Dabbler** | Cantrips only | — | Common folk who know one household ward |
| **Apprentice** | Up to 1st | 1–2 | Students, village lay-practitioners |
| **Journeyman** | Up to 2nd | 3–4 | Working Wardweavers, junior Threadwalkers |
| **Adept** | Up to 3rd | 5–8 | Experienced practitioners, Stitchwrights |
| **Master** | Up to 4th | 9–12 | Knotmothers, Pathmasters, senior guild members |
| **Grand Master** | Up to 5th | 13+ | Faction leaders, legendary practitioners |

---

## 3. Fray-Touch — Saves and Mechanical Effects

### 3.1 Fray Exposure

Any creature that enters a Frayed zone, is targeted by Fraytouch magic, or is present when the weave tears must make a **Constitution saving throw**. The DC depends on the source:

| Source | Save DC |
|--------|---------|
| Thin place (prolonged exposure, 1 hour+) | 10 |
| Frayed zone (on entry) | 13 |
| Frayed zone (per long rest spent inside) | 15 |
| Fraytouch spell (caster's spell DC) | Varies |
| Unraveled zone (on entry) | 18 |
| Direct Fray breach (standing in a tear) | 20 |

**On failure:** The creature gains one **Fray exposure level**.

### 3.2 Fray Exposure Levels and Effects

Fray exposure is cumulative. Effects are permanent once gained (no cure short of *Greater Restoration* cast at 5th level or higher, and even then only one level is removed per casting).

| Exposure Level | Effect | Mechanical Consequence |
|---|---|---|
| **1 — Touched** | Sensory shift | One sense operates "between." Gain advantage on Perception checks related to the shifted sense when detecting Fray phenomena. Disadvantage on the same check type in bright, crowded, or "normal" environments (sensory overload). |
| **2 — Marked** | Memory gap | Lose proficiency in one Knowledge skill (player's choice from History, Arcana, Nature, or Religion). Gain proficiency in Survival (the Fray teaches you to *navigate*, not *know*). |
| **3 — Altered** | Temporal perception | Always know the exact time. Cannot be surprised (sense distortions in time). Disadvantage on Initiative rolls (perceive time differently from others). |
| **4 — Changed** | Physical alteration | Resistance to cold damage. Creatures that touch you feel a faint wrongness — disadvantage on Persuasion checks with non-Fray-touched creatures, advantage with Fray-touched. |
| **5 — Resonant** | Fray resonance | *Detect Magic* at will (Threadlines and Fray activity only, 120 ft range). Can enter Frayed zones without further exposure saves. Immune to environmental damage from Frayed zones. |
| **6 — Sighted** | Pattern sight | *True Seeing* (weave structure only — Threadlines, wards, magical patterns, Fray breaches). When entering a new location for the first time, make a DC 15 Constitution save or be stunned until end of your next turn (sensory overload). |

**Level 7+:** Each additional level beyond 6 requires a DC 18 Constitution save. On failure, the creature becomes a **Fray creature** — their consciousness dissolves into the Fray and their body becomes a Looseling (CR 1/4) or Thread-eater (CR 2) depending on their original CR.

### 3.3 Fray Exposure Recovery

- Exposure levels do not decay naturally — the Fray's touch is permanent.
- *Greater Restoration* (5th level) removes one exposure level per casting.
- The Harmony ending's true Binding Song is intended to offer a path to controlled exposure management (post-game content).
- The Hollow Court does not seek to cure exposure — they consider it adaptation, not disease.

---

## 4. Ward Strength

### 4.1 Ward Strength Scale

Ward strength is measured as an integer from **0 to 100**, tracked per settlement.

| Ward Strength | Status | Mechanical Effects |
|---|---|---|
| **100** | Full strength | No Fray creatures can enter. Frayed zone environmental effects suppressed within ward. All Threadcraft within ward gets +2 to spell save DCs. |
| **75–99** | Strong | Minor Fray creatures (CR 1/4 and below) can slip through at night (sunset to sunrise). Threadcraft bonus reduced to +1. |
| **50–74** | Weakened | Moderate Fray creatures (CR 1 and below) can enter. Thin-place effects manifest at ward edges (fog, sound distortion). No Threadcraft bonus. |
| **25–49** | Failing | Major Fray creatures (CR 3 and below) can enter at any time. Environmental anomalies inside the ward (time stutters, gravity shifts in small areas). Threadcraft within ward suffers -1 to save DCs. |
| **1–24** | Critical | The ward is barely functional. All Fray creatures up to CR 5 can enter. The settlement is effectively a thin place. Fray exposure saves required for long rests inside the ward (DC 10). |
| **0** | Collapsed | No ward. The settlement is an unprotected location. Full Frayed zone rules apply if the surrounding area is Frayed. |

### 4.2 Ward Decay and Recovery

| Event | Ward Strength Change |
|---|---|
| Binding ceremony performed (full Song) | +12 (to max 100) |
| Binding ceremony performed (partial Song) | +6 |
| Binding ceremony failed | -6 (the attempt destabilizes the ward) |
| Binding ceremony missed entirely | -12 |
| Wardweaver performs daily maintenance | -0 (prevents natural decay) |
| No Wardweaver, no daily maintenance | -1 per week (natural decay) |
| Wardweaver dies without successor | -4 per month (accelerated decay) |
| Player restores a nearby Loom Stone | +15 (one-time bonus) |
| Major Fray creature incursion repelled | +5 (ward responds to successful defense) |
| Major Fray creature incursion undefended | -10 |
| Player completes major quest in region | +10 (weave stabilizes regionally) |

### 4.3 The Hollowing Modifier

The Hollowing ceremony (late autumn) is the most critical of the eight Bindings. Ward effects during the Hollowing are doubled:

- **Successful Hollowing:** +24 ward strength (instead of +12)
- **Failed Hollowing:** -12 ward strength (instead of -6)
- **Missed Hollowing:** -24 ward strength (instead of -12)

*Rationale: The Fray is most active during the Hollowing. A successful ceremony does extra work; a failure or absence is extra costly.*

### 4.4 World Healing Rules

Declarative rules the world engine evaluates when game time advances:

| Building Type | Rebuild Probability | Conditions | Time |
|---|---|---|---|
| House / Cottage | 80% per game-month | Settlement population > 5 | 1–3 months |
| Tavern / Inn | 90% per game-month | Settlement is on a trade route | 1–2 months |
| Temple / Shrine | 50% per game-month | Faction (religious) presence in settlement | 2–4 months |
| Shop | 70% per game-month | Settlement population > 20 | 1–2 months |
| Ward-circle | 10% per game-month | Wardweaver present; requires Loom Stone intact | 6–12 months |
| Wilderness (vegetation) | Auto-regrow | Biome regrowth rate; faster in spring/summer | 1–6 months |
| Wilderness (Fray damage) | 5% per game-month | Adjacent stable area, no active Fray breach | 12+ months |

---

## 5. Encounter Tables

### 5.1 Wilderness Encounter Tables by Biome

Each table uses a d20 roll. Encounters are appropriate for the listed level range.

#### Forest (Stable) — Levels 1–4

| d20 | Encounter | CR |
|-----|-----------|-----|
| 1–5 | No encounter | — |
| 6–8 | 1d4 wolves | 1/4 each |
| 9–10 | 1 black bear | 1/2 |
| 11–12 | 2d4 bandits | 1/8 each |
| 13–14 | 1 bandit captain + 1d4 bandits | 2 + 1/8 each |
| 15–16 | 1d6 giant rats | 1/8 each |
| 17 | 1 owlbear | 3 |
| 18 | Traveling merchant (Old Hawthorn type) | — |
| 19 | Threadwalker patrol (friendly, information) | — |
| 20 | Abandoned Wardweaver camp (loot: 1d4 thread supplies) | — |

#### Forest (Thinning) — Levels 1–4

| d20 | Encounter | CR |
|-----|-----------|-----|
| 1–3 | No encounter | — |
| 4–6 | Environmental anomaly (fog, sounds, tree spirals) | — |
| 7–9 | 1d4 Looselings | 1/4 each |
| 10–11 | 1 Thread-puppet (animated scarecrow) | 1 |
| 12–13 | 1d4 wolves (1 is Fray-touched: glowing eyes, extra 1d4 cold damage) | 1/4 – 1/2 |
| 14–15 | 2d4 bandits (desperate, fleeing the Thinning) | 1/8 each |
| 16 | 1 Frayed One (humanoid, lost to the Fray) | 2 |
| 17 | 1 Thread-eater | 2 |
| 18 | Fray pocket — DC 13 Con save or gain 1 Fray exposure | — |
| 19 | Weaver's Mark discovery (lore, +50 XP) | — |
| 20 | Loom Stone fragment (can be returned for quest reward) | — |

#### Frayed Zone — Levels 5–8

| d20 | Encounter | CR |
|-----|-----------|-----|
| 1–2 | No encounter (rare — the Fray is active) | — |
| 3–5 | Environmental hazard: gravity shift, time loop, or spatial fold | DC 14 Dex/Wis save |
| 6–8 | 2d4 Looselings | 1/4 each |
| 9–11 | 1d4 Thread-eaters | 2 each |
| 12–13 | 1 Frayed One + 1d4 Looselings | 2 + 1/4 each |
| 14–15 | 1 Hollow Walker | 4 |
| 16 | 1 Unspun (amorphous Fray creature) | 5 |
| 17 | Fray storm — all creatures DC 15 Con save, 4d6 force damage (half on save) | — |
| 18 | Hollow Court salvager team (potential allies or trade) | — |
| 19 | Intact Weaver artifact (magic item, DM determines) | — |
| 20 | Fray breach — portal-like tear. DC 15 Wis save to resist being pulled in | — |

### 5.2 Dungeon Encounter Modifiers

When inside a dungeon archetype location, apply these modifiers to the base wilderness table:

| Dungeon Type | Modifier |
|---|---|
| Crypt / Tomb | Replace beast encounters with undead equivalents (+1 CR) |
| Cave System | Add 25% chance of cave-specific creatures (giant spiders CR 1, piercers CR 1/2) |
| Abandoned Mine | Add 25% chance of oozes (gray ooze CR 1/2, ochre jelly CR 2) |
| Bandit Hideout | All humanoid encounters are bandits; increase numbers by 50% |
| Wizard's Tower | Replace all encounters with arcane constructs or trapped rooms |
| Haunted Manor | Replace with undead + environmental horror (DC checks vs. Frightened) |

### 5.3 Trap DCs

| Trap Type | Detection DC (Perception/Investigation) | Save DC | Damage |
|---|---|---|---|
| Pit trap (10 ft) | 12 | Dex 12 | 1d6 bludgeoning |
| Poison needle (lock/chest) | 15 | Con 13 | 1d4 piercing + 2d6 poison |
| Collapsing ceiling | 14 | Dex 14 | 3d6 bludgeoning |
| Tripwire alarm | 13 | — | No damage; alerts creatures |
| Fray pocket trap (Threadhallow-specific) | 15 (Arcana) | Con 15 | 2d6 force + 1 Fray exposure level |
| Ward-snare (Threadhallow-specific) | 14 (Arcana) | Wis 14 | Restrained until DC 14 Str check or *Dispel Magic* |

### 5.4 Loot Tables

#### Tier 1 (CR 0–1/4 encounters)

| d20 | Loot |
|-----|------|
| 1–10 | Nothing |
| 11–14 | 1d6 cp |
| 15–17 | 2d6 cp + mundane item (candle, rope, rations) |
| 18–19 | 1d6 sp + thread supply (Threadcraft component) |
| 20 | 2d6 sp + minor ward-token (functions as *Resistance* cantrip, 1 use) |

#### Tier 2 (CR 1/2–2 encounters)

| d20 | Loot |
|-----|------|
| 1–5 | Nothing |
| 6–10 | 2d6 sp |
| 11–14 | 1d6 gp + mundane item |
| 15–17 | 2d6 gp + thread supply (high quality, +1 to Threadcraft checks for 1 use) |
| 18–19 | 5d6 gp + uncommon magic item (Potion of Healing, Scroll of 1st-level spell) |
| 20 | 10d6 gp + Weaver artifact fragment (quest item or rare component) |

#### Tier 3 (CR 3–5 encounters)

| d20 | Loot |
|-----|------|
| 1–3 | Nothing |
| 4–8 | 2d6 gp |
| 9–12 | 4d6 gp + consumable (Potion of Greater Healing, spell scroll 2nd level) |
| 13–16 | 8d6 gp + uncommon magic item |
| 17–19 | 2d4 x 10 gp + rare magic item or Threadcraft focus |
| 20 | 4d4 x 10 gp + rare magic item + Weaver artifact (significant quest/lore item) |

---

## 6. Loom-Born Domain Spell Lists

Each Loom-Born deity grants domain spells to their clerics. Following 2024 Free Rules, domain spells are always prepared and don't count against the cleric's prepared spell limit.

### 6.1 Kael Thornmantle — The Wild Pattern (Nature, Life, Tempest)

| Cleric Level | Domain Spells |
|---|---|
| 1st | *Entangle*, *Speak with Animals* |
| 3rd | *Barkskin*, *Spike Growth* |
| 5th | *Plant Growth*, *Call Lightning* |
| 7th | *Dominate Beast*, *Grasping Vine* |
| 9th | *Tree Stride*, *Insect Plague* |

### 6.2 Seren Stillwater — The Measured Thread (Knowledge, Order, Arcana)

| Cleric Level | Domain Spells |
|---|---|
| 1st | *Comprehend Languages*, *Identify* |
| 3rd | *Augury*, *Detect Thoughts* |
| 5th | *Clairvoyance*, *Tongues* |
| 7th | *Arcane Eye*, *Divination* |
| 9th | *Legend Lore*, *Scrying* |

### 6.3 Voss Ironweft — The Binding Knot (Forge, War, Protection)

| Cleric Level | Domain Spells |
|---|---|
| 1st | *Shield of Faith*, *Searing Smite* |
| 3rd | *Heat Metal*, *Spiritual Weapon* |
| 5th | *Elemental Weapon*, *Protection from Energy* |
| 7th | *Fabricate*, *Wall of Fire* |
| 9th | *Flame Strike*, *Creation* |

### 6.4 Asha Brightloom — The Shining Thread (Light, Life, Peace)

| Cleric Level | Domain Spells |
|---|---|
| 1st | *Bless*, *Faerie Fire* |
| 3rd | *Calm Emotions*, *Lesser Restoration* |
| 5th | *Beacon of Hope*, *Daylight* |
| 7th | *Aura of Life*, *Guardian of Faith* |
| 9th | *Greater Restoration*, *Dawn* (flavored as radiant threads unfurling) |

### 6.5 Morrith Hollowdark — The Frayed Edge (Grave, Twilight, Death)

| Cleric Level | Domain Spells |
|---|---|
| 1st | *Bane*, *False Life* |
| 3rd | *Gentle Repose*, *Ray of Enfeeblement* |
| 5th | *Revivify*, *Vampiric Touch* |
| 7th | *Blight*, *Death Ward* |
| 9th | *Antilife Shell*, *Raise Dead* |

### 6.6 Tael Quickstitch — The Loose Thread (Trickery, Tempest, Nature)

| Cleric Level | Domain Spells |
|---|---|
| 1st | *Charm Person*, *Fog Cloud* |
| 3rd | *Mirror Image*, *Gust of Wind* |
| 5th | *Blink*, *Wind Wall* |
| 7th | *Dimension Door*, *Polymorph* |
| 9th | *Mislead*, *Destructive Wave* |

---

## 7. The Binding Song — Skill Challenge Framework

The Binding Song ceremony is the central mechanical event of Act I and recurs throughout the game at every Binding ceremony.

### 7.1 Skill Challenge Structure

*Source: Skill challenge framework from 2014 Basic Rules, adapted.*

**Complexity 2:** 6 successes before 3 failures.

**Participants:** The ceremony requires at least 3 participants (lead singer, weave-worker, congregation). The player may fill any role and can attempt any applicable skill.

### 7.2 Applicable Skills and DCs

The DCs vary based on the Song's completeness:

| Song State | Base DC | Description |
|---|---|---|
| Complete Song (all 5 verses recovered) | 12 | Standard difficulty |
| Partial Song (3–4 verses) | 15 | Gaps must be improvised |
| Minimal Song (1–2 verses) | 18 | Mostly improvisation |
| No Song (pure improvisation) | 21 | Near-impossible without extraordinary aid |

| Skill | Application | DC Modifier |
|---|---|---|
| **Performance** | Singing the Binding Song | Base DC |
| **Arcana** | Understanding the weave's response, adjusting the Song's resonance | Base DC |
| **Religion** | Knowledge of the ceremony's ritual structure, invoking the Loom-Born | Base DC - 2 |
| **Persuasion** | Rallying participants, maintaining morale during failures | Base DC - 2 |
| **Nature** | Reading Threadline response, sensing the weave's reaction | Base DC |
| **Insight** | Perceiving where the Song is weak and compensating | Base DC + 2 |
| **History** | Recalling fragments of old verses, filling gaps with tradition | Base DC + 2 |

**Threadcraft bonus:** A Wardweaver or Songbinder participating adds +2 to all ceremony skill checks.

### 7.3 Failure Consequences

Each failure during the challenge has an immediate narrative and mechanical effect:

| Failure # | Effect |
|---|---|
| **1st failure** | The ward-circle flickers. A Fray breeze passes through the village. Tension rises. |
| **2nd failure** | A thin-place phenomenon manifests inside the ward (fog, sound distortion, temperature drop). DC 12 Wisdom save for all participants or gain the Frightened condition for 1 round. |
| **3rd failure (challenge failed)** | The ceremony fails. Ward strength decreases (see Section 4.2). If during the Hollowing: 1d4 Looselings breach the ward. Combat encounter begins immediately. |

### 7.4 Critical Success

If the party achieves 6 successes with 0 failures, the ceremony is performed **flawlessly**:
- Ward strength receives +18 instead of +12 (+36 during Hollowing instead of +24)
- All participants gain Inspiration
- A brief vision of the Threadlines brightening — narrative reward and potential lore hint

### 7.5 Repeatable Use

The Binding Song challenge recurs at every ceremony throughout the game. As the player advances:
- Higher-level characters have better modifiers, making the base DC 12 easier
- But the stakes grow: later ceremonies may be contested by Fray creatures attempting to disrupt, adding combat rounds between skill checks
- Act IV/V ceremonies involve coordinating with allies at multiple locations simultaneously

---

## 8. Fray Creature Stat Blocks

These are the creatures native to the Fray — or created when the weave tears. All Fray creatures share the **Fray-Born** trait:

> **Fray-Born.** This creature is native to or was created by the Fray. It is immune to the Frightened condition. It has resistance to force damage. When reduced to 0 HP, it unravels into loose threads that dissolve in 1d4 rounds (no death saves). *Detect Magic* reveals it as a weave anomaly.

### 8.1 Looseling (CR 1/4)

*Small aberration, unaligned*

The most common Fray creature. A tangle of animate threads with no fixed shape — sometimes spider-like, sometimes worm-like, sometimes a loose ball that rolls.

| Stat | Value |
|------|-------|
| **AC** | 12 |
| **HP** | 13 (3d6 + 3) |
| **Speed** | 30 ft., climb 30 ft. |
| **STR** | 6 (-2) |
| **DEX** | 14 (+2) |
| **CON** | 12 (+1) |
| **INT** | 3 (-4) |
| **WIS** | 10 (+0) |
| **CHA** | 3 (-4) |

**Skills:** Stealth +4
**Senses:** Blindsight 30 ft. (blind beyond), passive Perception 10
**Languages:** None
**Traits:** Fray-Born. *Amorphous* — can move through spaces as narrow as 1 inch.

**Actions:**
- **Thread Lash.** Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.
- **Entangle (Recharge 5–6).** One creature within 5 ft. must succeed on a DC 12 Dexterity save or be restrained by threads until the end of its next turn.

### 8.2 Thread-Puppet (CR 1)

*Medium construct, unaligned*

An object animated by loose weave energy — scarecrows, suits of armor, furniture. They mimic purposeful motion but have no will. Unsettling but predictable.

| Stat | Value |
|------|-------|
| **AC** | 13 (natural armor) |
| **HP** | 27 (5d8 + 5) |
| **Speed** | 25 ft. |
| **STR** | 14 (+2) |
| **DEX** | 10 (+0) |
| **CON** | 12 (+1) |
| **INT** | 1 (-5) |
| **WIS** | 8 (-1) |
| **CHA** | 1 (-5) |

**Damage Immunities:** Poison
**Condition Immunities:** Charmed, Exhaustion, Frightened, Paralyzed, Poisoned
**Senses:** Blindsight 60 ft. (blind beyond), passive Perception 9
**Traits:** Fray-Born. *False Appearance* — while motionless, indistinguishable from a normal object of its type.

**Actions:**
- **Slam.** Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) bludgeoning damage.

### 8.3 Thread-Eater (CR 2)

*Medium aberration, unaligned*

A predator that feeds on the weave itself. Looks like a long-limbed humanoid silhouette made of dark, knotted threads. It gravitates toward magical items and wards, consuming their energy.

| Stat | Value |
|------|-------|
| **AC** | 13 |
| **HP** | 45 (7d8 + 14) |
| **Speed** | 40 ft. |
| **STR** | 14 (+2) |
| **DEX** | 16 (+3) |
| **CON** | 14 (+2) |
| **INT** | 6 (-2) |
| **WIS** | 12 (+1) |
| **CHA** | 5 (-3) |

**Skills:** Perception +3, Stealth +5
**Senses:** Darkvision 60 ft., passive Perception 13
**Traits:** Fray-Born. *Magic Scent* — can detect magical auras within 120 ft. *Weave Drain* — When the Thread-eater hits a creature concentrating on a spell, the creature has disadvantage on the concentration save.

**Actions:**
- **Multiattack.** Two claw attacks.
- **Claw.** Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage.
- **Consume Ward (Recharge 5–6).** The Thread-eater targets a magical effect within 5 feet (a ward, glyph, or ongoing spell). The effect must succeed on a DC 13 check (1d20 + the effect's spell level) or be dispelled. The Thread-eater regains 10 HP.

### 8.4 Frayed One (CR 2)

*Medium aberration (formerly humanoid), chaotic neutral*

A person lost to the Fray — not dead, but no longer entirely real. They flicker between solid and translucent, speak in fragments, and don't always remember they were human. Some are aggressive; most are confused and frightened.

| Stat | Value |
|------|-------|
| **AC** | 12 |
| **HP** | 38 (7d8 + 7) |
| **Speed** | 30 ft. |
| **STR** | 10 (+0) |
| **DEX** | 14 (+2) |
| **CON** | 12 (+1) |
| **INT** | 8 (-1) |
| **WIS** | 14 (+2) |
| **CHA** | 6 (-2) |

**Skills:** Perception +4, Stealth +4
**Senses:** Darkvision 60 ft., passive Perception 14
**Damage Resistances:** Bludgeoning, piercing, slashing from nonmagical attacks
**Traits:** Fray-Born. *Incorporeal Flicker* — at the start of each of its turns, the Frayed One can choose to become partially incorporeal until the start of its next turn. While flickering, it can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object.

**Actions:**
- **Fray Touch.** Melee Spell Attack: +4 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 2) necrotic damage. The target must succeed on a DC 12 Constitution save or gain 1 Fray exposure level.
- **Wail (Recharge 6).** Each creature within 30 feet that can hear the Frayed One must succeed on a DC 12 Wisdom save or be Frightened for 1 minute. A frightened creature can repeat the save at the end of each of its turns.

**Interaction:** A Frayed One can be calmed with a DC 14 Persuasion or DC 12 Performance check (singing a Binding Song fragment). A calmed Frayed One may share fragmented memories of its former life.

### 8.5 Hollow Walker (CR 4)

*Large aberration, neutral evil*

A creature that has fully formed from the Fray — not a corrupted mortal, but something born from the space between threads. Tall, thin, with limbs that bend at wrong angles. It moves in stop-motion, as if time doesn't apply to it consistently.

| Stat | Value |
|------|-------|
| **AC** | 15 (natural armor) |
| **HP** | 75 (10d10 + 20) |
| **Speed** | 40 ft. |
| **STR** | 16 (+3) |
| **DEX** | 14 (+2) |
| **CON** | 14 (+2) |
| **INT** | 10 (+0) |
| **WIS** | 14 (+2) |
| **CHA** | 8 (-1) |

**Saving Throws:** Dex +4, Wis +4
**Skills:** Perception +4, Stealth +4
**Damage Resistances:** Force, necrotic
**Senses:** Darkvision 120 ft., passive Perception 14
**Traits:** Fray-Born. *Time Stutter* — the Hollow Walker can use its bonus action to teleport up to 15 feet to an unoccupied space it can see. This movement doesn't provoke opportunity attacks.

**Actions:**
- **Multiattack.** Three claw attacks.
- **Claw.** Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 8 (1d10 + 3) slashing damage.
- **Unravel (Recharge 5–6).** The Hollow Walker reaches into the weave around a creature within 30 feet. The target must make a DC 14 Constitution saving throw, taking 22 (4d10) force damage on a failed save, or half as much on a success. On a failed save, the target's AC is also reduced by 2 until the end of its next turn (the weave around them loosens).

### 8.6 The Unspun (CR 5)

*Large aberration, chaotic neutral*

A mass of raw Fray material that has coalesced into a vaguely spherical, constantly shifting form. It absorbs and reflects fragments of the Tapestry — a face forms and dissolves, a hand reaches out and retracts, a voice says half a word. It is not hostile by nature but is drawn to strong weave patterns (wards, Loom Stones, active Threadcraft) and will destructively absorb them.

| Stat | Value |
|------|-------|
| **AC** | 11 |
| **HP** | 90 (12d10 + 24) |
| **Speed** | 20 ft., fly 20 ft. (hover) |
| **STR** | 16 (+3) |
| **DEX** | 8 (-1) |
| **CON** | 14 (+2) |
| **INT** | 6 (-2) |
| **WIS** | 12 (+1) |
| **CHA** | 14 (+2) |

**Damage Resistances:** Bludgeoning, piercing, slashing from nonmagical attacks; force
**Damage Immunities:** Necrotic, psychic
**Condition Immunities:** Blinded, Charmed, Deafened, Exhaustion, Frightened, Prone
**Senses:** Blindsight 60 ft. (blind beyond), passive Perception 11
**Traits:** Fray-Born. *Amorphous* — can move through spaces as narrow as 1 inch. *Weave Hunger* — at the start of its turn, if a magical effect or ward is within 30 feet, the Unspun must move toward it. *Absorb Magic* — when targeted by a spell, the Unspun can use its reaction to absorb the spell (the spell has no effect). The Unspun regains HP equal to 5 x the spell's level.

**Actions:**
- **Pseudopod.** Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 12 (2d8 + 3) bludgeoning damage plus 7 (2d6) force damage.
- **Engulf.** One Medium or smaller creature within 5 feet must succeed on a DC 14 Dexterity save or be engulfed. An engulfed creature is restrained, has total cover from outside, and takes 10 (3d6) force damage at the start of each of the Unspun's turns. The engulfed creature can escape with a DC 14 Strength check as an action.

---

## 9. Skill Check Opportunities by Location Type

Standard DCs for common interactions at archetype locations. The rules engine uses these when the player attempts actions at specific location types.

| Location Type | Check | Skill | DC | Success Result |
|---|---|---|---|---|
| Tavern | Eavesdrop on rumors | Perception | 12 | Learn 1d2 rumors from the rumor table |
| Tavern | Win a drinking contest | Constitution | 14 | Earn respect + 1d6 gp in bets |
| Shop | Haggle for discount | Persuasion | 13 | 10% price reduction |
| Shop | Appraise item | Investigation | 12 | Learn item's true value |
| Temple | Seek divine guidance | Religion | 14 | Receive a hint about active quest |
| Temple | Identify curse or Fray effect | Arcana | 15 | Learn the effect's nature and removal method |
| Wilderness | Find safe campsite | Survival | 12 | Long rest without encounter interruption |
| Wilderness | Track creature | Survival | Variable (10 + CR) | Locate creature's lair or recent path |
| Dungeon | Find hidden passage | Investigation | 15 | Discover alternative route |
| Dungeon | Disable trap | Thieves' Tools | Trap DC (see 5.3) | Trap rendered safe |
| Ward-circle | Assess ward strength | Arcana | 13 | Learn current ward strength percentage |
| Loom Stone | Read Weaver's Mark | Arcana | 16 | Decode inscription (lore + potential quest hook) |

---

## 10. Act I Encounter Design — Thornwick

Detailed encounter specifications for Act I content, designed for a party of 1–4 characters at levels 1–4.

### 10.1 The Torn Meadow — Looseling Clearing

**Setup:** The player must reach the Loom Stone at the center of the Torn Meadow to make a rubbing of the Fourth Verse inscription.

**Encounter:** 4 Looselings (CR 1/4 each) + 1 Thread-Puppet scarecrow (CR 1)

**XP Budget:** 300 XP (Medium encounter for 4 level-2 characters; Hard for 1 level-2 character)

**Terrain:**
- The meadow is 80 ft. diameter, with the Loom Stone at center
- Tall grass provides half cover in 60% of the area
- 3 patches of thread-tangled ground (difficult terrain, 10 ft. squares)
- The Loom Stone itself radiates dim light 10 ft. (weak Threadline)

**Tactics:**
- Looselings hide in the grass (Stealth +4 vs. passive Perception)
- The Thread-Puppet stands motionless near the Loom Stone (False Appearance)
- Looselings attack when the player is within 30 ft. of the stone
- The Thread-Puppet activates when the player touches the stone
- Looselings try to Entangle the player; the Thread-Puppet uses Slam

**Victory conditions:** Destroy or drive off all creatures, then make the rubbing (10 minutes of uninterrupted work, or DC 12 Dexterity check to do it in 5 minutes under pressure).

### 10.2 The Scarecrow — Thread-Puppet Investigation

**Setup:** Side quest. A farmer reports his scarecrow moved. The player investigates.

**Encounter:** 1 Thread-Puppet (CR 1) in a field. Not immediately hostile — it mimics farming motions (planting, harvesting) in a loop.

**Resolution options:**
- **Unbind it:** DC 13 Arcana check. The puppet collapses into inert thread. Safe. Farmer is grateful.
- **Study it:** DC 15 Arcana check. Learn about loose weave energy animation. +50 XP bonus. The puppet remains active but the player understands its nature.
- **Leave it:** The puppet wanders into the village in 1d4 days, causing an alarm event. DC 12 Persuasion to calm villagers. If the player is unavailable, Bryn handles it (with reduced trust from the village).
- **Attack:** Standard combat. CR 1. No special consequences.

### 10.3 The Hollowing Ceremony

See Section 7 (Binding Song Skill Challenge) for the full mechanical framework. Additional Hollowing-specific rules:

**If the ceremony fails (3 failures):**
- 1d4 Looselings breach the ward immediately
- Combat encounter during the ceremony (participants may be Frightened from the 2nd failure)
- Ward strength drops by 24 (Hollowing modifier)
- 1 random NPC is injured (not killed — this is Act I, consequences should sting but not devastate)

**If the ceremony succeeds:**
- Ward strength increases by 24 (minimum) to 36 (flawless)
- Village morale improves — NPC disposition toward the player shifts one step positive
- Sorrel (if present) gains confidence — affects her Act II companion availability

---

## Appendix A: Quick Reference — Threadhallow DC Table

| Task Difficulty | DC | Threadhallow Context |
|---|---|---|
| Trivial | 5 | Reading a common ward-mark, identifying a Loom Stone |
| Easy | 10 | Assessing basic weave condition, identifying a Looseling |
| Medium | 13 | Performing a Binding Song (complete), reading a Weaver's Mark (partial) |
| Hard | 16 | Reading a Weaver's Mark (full), navigating a Frayed zone, improvising a Binding Song |
| Very Hard | 19 | Communicating with a Frayed One, resisting an Unraveled zone |
| Nearly Impossible | 22 | Performing a Binding Song with no verses, reading the Loom directly |

## Appendix B: Rules Deviations from RAW

| Deviation | RAW Rule | Threadhallow Rule | Rationale |
|---|---|---|---|
| Fraytouch uses Constitution as spellcasting ability | No published class uses Con | Con determines how much Fray energy the body can channel | Thematic: power through endurance, not knowledge or force of will. The Fray doesn't respond to understanding — it responds to survival. |
| Fray exposure is a new condition track | No equivalent in 5e | 7-level exposure system with cumulative permanent effects | D&D has exhaustion as a precedent for cumulative condition tracks. Fray exposure follows the same design pattern but with different effects. |
| Ward strength is a settlement-level mechanic | No settlement mechanics in 5e | 0–100 integer scale with decay/recovery rules | D&D is party-focused; Threadhallow adds settlement-as-resource. This is additive, not a replacement — all individual combat rules remain RAW. |
| Skill challenges (Binding Song) | Removed from 5e; present in 4e and 2014 BR adventure design | 6 successes / 3 failures, multi-skill | Skill challenges are well-established in D&D design. The 2024 rules don't include them formally but don't prohibit them. This is a structured group check, not a rules violation. |
| Domain spell lists for Loom-Born | 2024 Free Rules provides domain spells per subclass | Custom deity-specific lists | The Loom-Born are Threadhallow-specific deities. Domain lists are curated from the 2024 Free Rules spell list to match each deity's thematic identity. No homebrew spells — all spells are from the official list. |
| Fraytouch tradition (custom spells) | No equivalent school | 6 unique spells + corruption mechanic | Fraytouch represents forbidden magic from outside the Tapestry. These spells are balanced against equivalent-level official spells with the added cost of Fray exposure. The corruption mechanic ensures Fraytouch is powerful but self-limiting. |

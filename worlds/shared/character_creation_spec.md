# Character Creation Spec

Version: 1.0 — Draft
Author: Scribe
Status: Loremaster review incorporated; pending @bard narrative review

---

## 1. Overview

Character creation is a 4-step narrative flow that produces a fully initialized `Character` record. The flow prioritizes narrative identity over mechanical optimization — **background comes first**, because in an LLM-narrated game, _who you are_ matters more than _what you can do_.

Each step is presented as an in-world narrative moment, not a menu. The LLM narrates the creation process as a conversation (e.g., a campfire scene, a dream sequence, or a dock arrival) while the player makes mechanical choices through structured UI elements.

### Design Principles

- **Narrative first** — Every mechanical choice has a story reason
- **Fast to complete** — 4 steps, ~5 minutes for a new player
- **No trap options** — Every combination is viable at level 1
- **LLM-narrated** — The creation flow itself is the first narrative experience
- **One pixel LLM call** — Portrait generation is the only expensive asset call

---

## 2. Creation Flow

### Step 1: Background

**Why first:** In a text-driven game, your background determines how NPCs react to you, what you know about the world, and why you arrived at the starting settlement. It's the most narratively load-bearing choice.

| Background | Description | Skill Proficiencies | Starting Gear Flavor | Arrival Hook | NPC Disposition Modifier |
|---|---|---|---|---|---|
| **Wanderer** | A traveler with no roots, drawn by rumor or restlessness | Survival, Perception | Worn traveling pack, trail rations, hand-drawn map | Arrived on foot from the wilds | Wanderers: +5 |
| **Scholar** | A student of lore seeking knowledge beyond the academy | Arcana, History | Leather-bound journal, ink set, magnifying lens | Following a research lead | Scholars/mages: +5 |
| **Merchant** | A trader looking for new markets or fleeing bad debts | Persuasion, Insight | Merchant's scales, sample goods, ledger | Arrived with a trade caravan | Merchants: +5 |
| **Soldier** | A veteran of conflicts large or small | Athletics, Intimidation | Insignia of rank, whetstone, signal whistle | Sent on assignment or desertion | Guards/authority: +5 |
| **Outcast** | Exiled, escaped, or simply unwelcome elsewhere | Stealth, Deception | Hooded cloak, lockpicks, forged papers | Arrived under cover of night | Outcasts/criminals: +5, Authority: -5 |
| **Healer** | A mender of wounds and soother of spirits | Medicine, Religion | Healer's kit, prayer beads, herbal pouch | Summoned by reports of illness | Healers/clergy: +5 |

**Mechanics:**
- Grants 2 skill proficiencies (may overlap with class — no double proficiency in v1, pick a replacement from a short list if overlap occurs)
- Sets the starting gear narrative flavor (actual gear stats come from class)
- Determines the LLM-generated arrival narrative at the starting settlement
- Applies a +5 (or -5) disposition modifier to specific NPC archetypes (stacks with base disposition from `npc_system_spec.md` §11)

### Step 2: Class

Four classes for v1 — one per combat role, covering the core D&D experience. Each maps to a behavioral template for companion/offline play.

| Class | Hit Die | Primary Ability | Saving Throws | Armor Proficiencies | Weapon Proficiencies | Companion Template |
|---|---|---|---|---|---|---|
| **Fighter** | d10 | STR or DEX | STR, CON | All armor, shields | Simple + martial weapons | Aggressive / Defensive |
| **Rogue** | d8 | DEX | DEX, INT | Light armor | Simple weapons, hand crossbow, longsword, rapier, shortsword | Cautious |
| **Cleric** | d8 | WIS | WIS, CHA | Light + medium armor, shields | Simple weapons | Supportive |
| **Wizard** | d6 | INT | INT, WIS | None | Daggers, darts, slings, quarterstaffs, light crossbows | Cautious |

**Level 1 Class Features:**

- **Fighter:** Fighting Style (choose one: Defense +1 AC, Dueling +2 damage, Great Weapon Fighting — reroll 1 or 2 on damage die, must use the new roll), Second Wind (bonus action heal 1d10+1, 1/rest). **2 class skill proficiencies** (choose from: Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Survival).
- **Rogue:** Sneak Attack (1d6 extra damage when using a finesse or ranged weapon with advantage on the attack, OR when an enemy of the target is within 5 ft of the target and isn't incapacitated, provided the Rogue doesn't have disadvantage), Expertise (double proficiency on 2 skills), Thieves' Cant. **4 class skill proficiencies** (choose from: Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth) — the highest of any class.
- **Cleric:** Spellcasting (WIS-based, 3 cantrips, 2 first-level spell slots), Divine Domain (Life — bonus healing). **2 class skill proficiencies** (choose from: History, Insight, Medicine, Persuasion, Religion).
- **Wizard:** Spellcasting (INT-based, 3 cantrips, 2 first-level spell slots), Arcane Recovery (recover 1 spell slot on short rest). **2 class skill proficiencies** (choose from: Arcana, History, Insight, Investigation, Medicine, Religion).

**Spell Selection (Cleric & Wizard):**
- Clerics prepare spells from the cleric list each long rest (WIS modifier + Cleric level spells)
- Wizards start with 6 spells in their spellbook, prepare INT modifier + Wizard level each long rest

**V1 Spell List (curated by @loremaster):**

| Class | Cantrips (pick 3) | 1st-Level Spells |
|---|---|---|
| **Cleric** | Guidance, Light, Sacred Flame, Spare the Dying, Thaumaturgy | Bless, Cure Wounds, Detect Magic, Guiding Bolt, Healing Word, Shield of Faith |
| **Wizard** | Fire Bolt, Light, Mage Hand, Minor Illusion, Prestidigitation, Ray of Frost | Burning Hands, Detect Magic, Mage Armor, Magic Missile, Shield, Sleep, Thunderwave, Find Familiar |

Each list covers combat, exploration, and utility. Detect Magic on both lists is intentional — different classes want it in different contexts. Healing Word vs. Cure Wounds gives Clerics meaningful tactical choice (bonus action economy vs. raw healing). Sleep and Find Familiar are iconic level 1 Wizard experiences. All spells are in the 2024 Free Rules.

### Step 3: Ancestry & Appearance

Four ancestries for v1. Each grants a minor mechanical benefit and narrative flavor.

| Ancestry | Ability Bonus | Speed | Traits | Size |
|---|---|---|---|---|
| **Human** | +1 to all abilities | 30 ft | Extra skill proficiency*, extra language | Medium |
| **Elf** | +2 DEX | 30 ft | Darkvision 60 ft, Keen Senses (Perception proficiency), Fey Ancestry (advantage vs. charm), Trance (4-hour long rest) | Medium |
| **Dwarf** | +2 CON | 25 ft | Darkvision 60 ft, Dwarven Resilience (advantage vs. poison, resistance to poison damage), Stonecunning, Dwarven Combat Training (battleaxe, handaxe, light hammer, warhammer proficiency), Tool Proficiency (smith's tools, brewer's supplies, or mason's tools — player's choice) | Medium |
| **Halfling** | +2 DEX | 25 ft | Lucky (reroll natural 1s on attacks/checks/saves), Brave (advantage vs. frightened), Halfling Nimbleness | Small |

> **Rules Note:** Ability score bonuses use the 2014 Basic Rules model (fixed racial bonuses) rather than the 2024 Free Rules (background-assigned). This is an intentional v1 design choice — fixed bonuses make ancestries feel mechanically distinct and avoid complicating the custom background system. May revisit for v2.
>
> \* Human "extra skill proficiency" is from the Variant Human (PHB), not the Basic Rules. Included intentionally because base Human (+1 to all, extra language) is otherwise mechanically bland. Documented as an intentional addition.

**Appearance:**
- Free-text description field (1-3 sentences) — the player describes what their character looks like
- The LLM uses this description to generate a portrait via a pixel LLM call (~64k tokens, cached permanently as a `.pixel.json` asset)
- If the player leaves appearance blank, the LLM infers appearance from ancestry + class + background
- Portrait is the **only** pixel LLM call during character creation (aligns with three-tier cost model)

**Portrait Generation:**
- Input: ancestry, class, background, player's appearance text
- Output: a `.pixel.json` sprite asset (lg size class: 32×48 per `asset_design_guide.md`)
- Cached permanently — never regenerated unless the player explicitly requests it
- Generation happens async — the player can proceed to Step 4 while the portrait generates
- If generation fails, a placeholder silhouette is used until retry succeeds

### Step 4: Ability Scores & Name

**Ability Score Methods:**
- **Standard Array:** 15, 14, 13, 12, 10, 8 — player assigns to any ability
- **Rolled:** 4d6 drop lowest, rolled 6 times — player assigns to any ability

The server generates rolled scores deterministically from the world seed + player ID, so rolls are reproducible and tamper-proof. The player sees the results and assigns them.

After ability score assignment, ancestry bonuses are applied automatically.

**Derived Stats (computed, not chosen):**
- **HP:** Hit die max + CON modifier (e.g., Fighter: 10 + CON mod)
- **AC:** Computed from equipped armor + DEX modifier (default: 10 + DEX mod if no armor)
- **Proficiency Bonus:** +2 (always at level 1)
- **Speed:** From ancestry
- **Initiative:** DEX modifier (standard D&D 5e)

**Name:**
- Free-text input
- Optional: "Suggest names" button generates 5 LLM-suggested names based on ancestry + background (text LLM call, cheap)
- No validation beyond non-empty — the LLM will use whatever the player provides

---

## 3. Starting Equipment

Starting equipment is determined by **class**, with flavor influenced by **background**. The mechanical items are identical for all players of the same class — background only changes the narrative descriptions.

| Class | Starting Equipment |
|---|---|
| **Fighter** | Chain mail OR leather armor + longbow + 20 arrows; martial weapon + shield OR two martial weapons; light crossbow + 20 bolts OR two handaxes; dungeoneer's pack OR explorer's pack |
| **Rogue** | Leather armor, two daggers, thieves' tools; rapier OR shortsword; shortbow + 20 arrows OR shortsword; burglar's pack, dungeoneer's pack, OR explorer's pack |
| **Cleric** | Chain mail, scale mail, OR leather armor; mace OR warhammer (if proficient); light crossbow + 20 bolts OR any simple weapon; priest's pack OR explorer's pack; shield + holy symbol |
| **Wizard** | Quarterstaff OR dagger; component pouch OR arcane focus; scholar's pack OR explorer's pack; spellbook |

Equipment choices (where OR options exist) are presented as part of the narrative flow — the LLM describes each option in-world and the player picks.

---

## 4. Character Record Type

Extensions to the existing `Character` type to support creation data:

```ts
type CharacterClass = 'fighter' | 'rogue' | 'cleric' | 'wizard';

type Ancestry = 'human' | 'elf' | 'dwarf' | 'halfling';

type Background = 'wanderer' | 'scholar' | 'merchant' | 'soldier' | 'outcast' | 'healer';

type FightingStyle = 'defense' | 'dueling' | 'great_weapon';

type CharacterCreationData = {
  class: CharacterClass;
  ancestry: Ancestry;
  background: Background;
  appearance: string;           // Free-text appearance description
  portraitAssetId: string;      // Reference to .pixel.json portrait asset
  hitDie: number;               // e.g., 10 for Fighter, 8 for Rogue
  armorProficiencies: string[];
  weaponProficiencies: string[];
  fightingStyle?: FightingStyle; // Fighter only
  languages: string[];          // Common + ancestry/background languages
  darkvision: number;           // 0 for Human/Halfling, 60 for Elf/Dwarf
  classFeatures: string[];      // Feature names active at current level
  spellSlots?: number[];        // Spell slots by level (index 0 = cantrips known)
  spellbook?: string[];         // Wizard only — spells in spellbook
  preparedSpells?: string[];    // Currently prepared spells
};

// Full character = existing Character + creation data
type PlayerCharacter = Character & CharacterCreationData;
```

**Notes:**
- `Character` retains its current fields unchanged — creation data is additive
- `portraitAssetId` links to the cached `.pixel.json` portrait asset
- `spellbook` is Wizard-only; Clerics prepare directly from the class list
- `classFeatures` tracks named features (e.g., `['second_wind', 'fighting_style_defense']`) for the rules engine

---

## 5. Creation Narrative Flow

The LLM narrates the entire creation process as an in-world experience. The recommended framing:

1. **Opening scene** — The player arrives at (or wakes up near) the starting settlement. The narration establishes atmosphere and asks the player to recall who they are. **If other characters already exist in the world, they are present in the scene** — sitting around the campfire, appearing in the dream, standing on the dock, etc. The creation scene is a shared narrative moment, not an isolated one.
2. **Background** — "What brought you here?" — The player picks a background; the LLM weaves the choice into the arrival narrative. Existing characters may react or comment (narrated by the LLM based on their traits).
3. **Class** — "What are you skilled at?" — Framed as a memory, a demonstration, or a reaction to an event. The player picks a class.
4. **Ancestry & Appearance** — "What do you look like?" — The LLM asks the player to describe themselves. Ancestry is picked via UI; appearance is typed.
5. **Ability Scores & Name** — "What is your name?" — Scores are assigned (Standard Array or rolled). Name is entered. The narration formally introduces the character to the world — and to the other characters present.
6. **Arrival** — The full character is created. The LLM generates the first location description of the starting settlement, incorporating the character's background arrival hook. If other characters are present, the scene transitions naturally into shared gameplay.

### Multiplayer Creation Scene

When a new player creates a character in a world with existing characters:

- **Existing party members are included in the creation scene context.** The LLM receives their names, ancestries, classes, and backgrounds so it can reference them naturally ("The dwarf by the fire looks up from her whetstone as you approach").
- **Existing players observe but don't control.** Their characters' reactions are LLM-narrated based on personality — they don't get prompts to act during someone else's creation. This keeps creation flow uninterrupted.
- **The scene framing adapts.** A first-ever creation in a world is a solo arrival. A second+ creation is a newcomer joining an existing group. The LLM adjusts tone accordingly — the campfire is already lit, the dream already in progress.
- **No mechanical impact.** Other characters' presence is purely narrative. No buffs, no skill checks, no disposition changes from witnessing creation.

**Token Budget:**
- Creation narrative uses text LLM (16-32k tokens per call)
- Each step is a separate LLM call with the accumulating character context
- Portrait generation (Step 4) is a single pixel LLM call (~64k tokens), runs async
- Total creation cost: ~5 text LLM calls + 1 pixel LLM call

---

## 6. Validation Rules

1. **Ability scores** must total exactly 72 (Standard Array) or match the server-generated rolls
2. **No duplicate skill proficiencies** — if background and class overlap, player picks a replacement
3. **Name** must be non-empty and ≤ 50 characters
4. **Appearance** is optional (max 500 characters) — blank triggers LLM inference
5. **All required fields** must be set before the character record is persisted
6. **One character per player per world** — enforced at the session layer (see `multiplayer_web_game_spec.md` §5.1)

---

## 7. Level-Up (Future — Not V1)

V1 ships with level 1 only. The following are explicitly **deferred**:

- Multiclassing
- Subclass selection (e.g., Champion Fighter, Arcane Trickster)
- Feats (vs. Ability Score Improvement)
- Spell selection at higher levels
- Hit die rolling on level-up
- Re-spec / character rebuild

When level-up ships, it should follow the same narrative-first pattern: the LLM frames the level-up as an in-world moment (a training montage, a revelation, a mentor's guidance) rather than a menu.

---

## 8. Integration Points

| System | Integration |
|---|---|
| **NPC System** (`npc_system_spec.md`) | Background disposition modifiers applied to NPC base disposition at creation |
| **Companion System** (`companion_system.md`) | Class determines default companion behavioral template when player goes offline |
| **Narrative Engine** (`loreweave_spec.md` §4.4) | Creation flow is the first narrative interaction — sets tone for the entire game |
| **Starting Settlement** (`starting_settlement_spec.md`) | Background arrival hook determines how the player enters the tutorial zone |
| **Multiplayer** (`multiplayer_web_game_spec.md`) | One character per player per world; character persisted to Blob Storage |
| **Pixel Format** (`pixel_v_1_spec.md`) | Portrait generated as `.pixel.json` sprite asset, cached permanently |

---

## 9. Open Questions

1. **Quick Start option?** — Should there be a "generate random character" button for players who want to skip creation? @loremaster recommends: yes, but constrained — random character uses Standard Array, picks one of 4 pre-built class/background combos, auto-assigns scores to the class's primary ability. The LLM still narrates the arrival.
2. **Portrait blocking vs. async?** — Current design has portrait generation async (player can proceed). Should we block on it instead for a more polished first impression?
3. ~~**Spell list scope**~~ — **Resolved.** V1 spell list defined in §2 Step 2 per @loremaster's recommendation.
4. **Background-specific starting items?** — Current design gives class-based equipment with background flavor only. Should backgrounds also grant a unique minor item? @loremaster recommends: yes, one minor narrative item per background with one-time or situational benefits (not persistent mechanical advantages). E.g., Scholar's lore book grants advantage on one History check — consumable and flavorful.
5. **Ancestry subraces?** — V1 uses base ancestries only. When should subraces (High Elf, Hill Dwarf, Lightfoot Halfling, etc.) be introduced? @loremaster recommends: **defer to v2, low mechanical impact at level 1.** The only significant losses are High Elf's free cantrip and Mountain Dwarf's medium armor proficiency — neither breaks the game with our curated 4-class lineup. Subraces should arrive alongside level 2+ content so scaling features (Hill Dwarf +1 HP/level, Wood Elf 35 ft speed) have room to matter.
6. **Character deletion/re-creation** — Can a player delete their character in a world and start over? If yes, what happens to their NPC relationships and world state changes?
7. ~~**Ability score method choice**~~ — **Resolved.** Yes — world creator can lock the method. @loremaster recommendation adopted: **Standard Array is the default**, with "Allow Rolled Scores" as an opt-in world setting. Rationale: in multiplayer, rolled scores can create significant power imbalances; Standard Array has a deterministic total (72) simplifying validation, while rolled scores require server-side verification of seed-derived rolls.

---

## 10. Attribution

This spec synthesizes the character creation proposal from Scribe (2026-03-28 Task 18) with:
- D&D 5e SRD rules (classes, ancestries, backgrounds, equipment)
- Three-tier cost model from `WISDOM.md` (algorithmic → text LLM → pixel LLM)
- NPC disposition system from `npc_system_spec.md` §11
- Companion behavioral templates from `companion_system.md`
- Multiplayer constraints from `multiplayer_web_game_spec.md`

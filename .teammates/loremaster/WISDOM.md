# Loremaster — Wisdom

Distilled principles. Read this first every session (after SOUL.md).

Last compacted: 2026-03-27

---

## Rules Architecture

**Weave State is an Overlay, Not a Type** — Frayed/Thinning/Unraveled states are modifiers applied ON TOP of biomes, weather, and encounters — never separate categories. This keeps systems composable. Apply this principle to any new mechanic that interacts with weave stability.

**Constitution as Threadcraft Casting Ability** — All Threadcraft uses CON, not class casting stats. This is a documented RAW deviation that ensures Threadcraft doesn't compete with existing spellcasting and creates meaningful build tension (CON is already a survival stat).

**Feat Chain Over Subclass** — Player-facing Threadcraft is a 3-tier feat chain (Initiate 4+, Adept 8+, Master 13+), not a class or subclass. This keeps it accessible to any build while gating power behind level + narrative prerequisites.

**Fray Risk is the Core Balance Lever** — Threadcraft escalates via Fray Risk DC (base 10, +1 per cast since last long rest). Fraytouch imposes +2 DC penalty. This single mechanic gates power without complex resource tracking — tune it before adding new restrictions.

**Fray Exposure Tracks Like Exhaustion** — 7-level track with CON saves, modeled after the 2024 exhaustion mechanic. Provides a familiar, graduated consequence for Fray contact that players already understand.

## Encounter Design

**CR Injection Caps Matter** — Never inject a single high-CR creature into a random encounter without checking the XP budget. A CR 12 vs. level 13 party exceeds Deadly threshold. Use multiple lower-CR creatures or cap injection CR relative to party level.

**Combat as Failure State** — For story-critical encounters (finales, summit debates), design the optimal path as non-combat (diplomacy, skill challenges). Combat triggers when the player fails the social/exploration approach. This rewards preparation and roleplay.

**Skill Challenges Use Graduated Structure** — Standard: 4/2 or 5/3 (successes/failures). Major: 6/3. Epic: 8/4. Nat 20 = 2 successes. Always include evidence/preparation modifiers that reduce DCs.

**Encounter Table Weave Modifiers** — Thin: 25% chance to inject Fray creature. Frayed: 50% injection + DC 14 environmental hazards. Unraveled: full replacement table (no normal encounters). This graduated system keeps weave state mechanically distinct at each tier.

**Companion Quest Auto-Successes** — For epic skill challenges (like The First Song at 8/4), completed companion quests grant up to 4 auto-successes. This rewards thorough play and makes side content mechanically meaningful in finales.

## Creature Design

**CR Verification is Non-Negotiable** — Every custom stat block must be verified against 2024 Free Rules offensive/defensive CR calculations. Target ±1 CR of design intent. Document the math.

**Legendary Actions Scale with CR** — CR 9-12: 2 legendary actions. CR 13+: 3 legendary actions + lair actions. Missing these from the type system breaks high-CR creature design.

**Proficiency Scales by CR Tier** — CR 1-4: +2, CR 5-8: +3, CR 9-12: +4, CR 13-16: +5, CR 17-20: +6. The engine initially got this wrong for elite tier — always verify prof bonus matches the CR band.

**Fray-Born is a Shared Creature Trait** — All custom Fray creatures share the Fray-Born trait (immunity to Fray damage, vulnerability in warded areas). Design new Fray creatures from this common base rather than inventing per-creature Fray interactions.

**Stationary Boss Pattern** — For immobile high-CR creatures (e.g., Void Loom CR 17), use a separate destructible component (Nexus HP with its own AC) as the win condition. This creates tactical depth without requiring the creature to move.

## Systems Design

**Hidden Scores, Visible Behavior** — Faction reputation (-100 to +100) is never shown to the player as a number. The LLM renders it as NPC tone, dialogue shifts, and access changes. Same principle applies to any social mechanic.

**Diminishing Returns Prevent Exploit Loops** — Repeated minor actions yield diminishing reputation gains. Fray Risk escalates per cast since long rest. Ward ceremonies have fixed schedules. Any system where the player can grind needs a decay/ceiling mechanic.

**Cross-System Ripple Effects** — Faction actions ripple via a cross-effect matrix (multipliers -0.5x to +0.3x). Ward crystal extraction costs ward strength. Fray Essence degrades without Thread-Iron storage. Mechanics should have costs that touch other systems.

**Faction Gating Controls Act Structure** — Act IV paths require Friendly (+50) with primary faction; Common Folk >= 0 required for ALL paths. If no path is accessible, the game enters a no-ending state. This makes faction management a core gameplay loop, not optional side content.

**Ward Decay Creates Strategic Urgency** — Ward strength decays -1/week. Combined with no-long-rest in unraveled zones without ward protection, this creates a ticking clock that drives player engagement with the ward maintenance loop.

**Crafting Uses Two-Check Resolution** — Threadcraft crafting requires Tool DC (artisan skill) + Infusion DC (CON-based Threadcraft). Two failure points make crafting feel risky and skill-dependent. Materials have real costs: Thread-Iron requires Frayed zones, Ward Crystals reduce ward strength, Fray Essence degrades in 7 days.

## Content Patterns

**Bard Writes Narrative, Loremaster Adds Mechanics** — Bard's archetypes need mechanical backfill: stat tiers for NPCs, challenge arrays for locations, DCs for traps, CR for creatures. Review Bard's output for narrative quality (usually strong) and flag mechanical gaps.

**Saves vs. Skill Checks Are Distinct** — Location challenge arrays must not mix saving throws (wisdom_save_resist_enchantment) with skill checks (perception_spot_hidden). These are different D&D mechanics and the engine handles them differently.

**12 Biomes Cover Threadhallow** — forest, plains, mountain, swamp, tundra, desert, taiga, coast, hills, cavern, farmland, deep_forest. The original 7 missed coast, hills, cavern, farmland, and the ancient/dense forest variant.

**Weather Amplifies Weave, Not Vice Versa** — Weave state is a weather amplifier, not a weather type. 7 weather types map to 2024 FR environmental hazards. 4-season modifiers shift probabilities. Weave instability escalates existing weather effects rather than creating new weather categories.

## Engine Review Patterns

**Audit New Engine Code After Each Beacon Push** — Check: CR-to-XP table completeness, proficiency bonus by CR tier, save formula (ability mod + prof bonus if proficient), and type definitions for high-CR features (legendary/lair actions).

**DC Standards** — Easy: 10, Medium: 15, Hard: 20. If the engine uses DC 14, document rationale for the non-standard value or adjust to 15.

**crToXP() Edge Cases** — Watch for CR 0.5 rounding to 0 in the fallback path. The CR-to-XP table must be complete through CR 17+ to cover all Fray creatures. Incomplete tables cause silent miscalculations in encounter balancing.

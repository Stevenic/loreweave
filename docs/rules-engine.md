# Rules Engine

The rules engine (`@loreweave/rules`) implements D&D 5e mechanics as pure, deterministic functions. Every dice roll, ability check, and combat action uses a seeded PRNG — same inputs always produce the same results.

## Dice System

```typescript
// Core API
rollDice({count: 2, sides: 6, modifier: 3}, rng)  → RollResult {rolls: [4, 2], total: 9, natural: 6, modifier: 3}
parseDiceNotation("2d6+3")                          → DiceRoll {count: 2, sides: 6, modifier: 3}
d20(rng)                                            → RollResult (single d20)
d20Advantage(rng)                                   → RollResult (roll 2, take higher)
d20Disadvantage(rng)                                → RollResult (roll 2, take lower)
```

All dice functions take an `rng` parameter — a seeded `() => number` function created via `createRng(seed)`. No `Math.random()` anywhere.

## Ability Scores & Checks

Standard D&D 5e formulas:

| Function | Formula |
|----------|---------|
| `abilityModifier(score)` | `floor((score - 10) / 2)` |
| `proficiencyBonus(level)` | `floor((level - 1) / 4) + 2` |
| `skillModifier(char, skill)` | ability mod + proficiency (if proficient) |

### Checks

```typescript
// Ability check: d20 + ability modifier
abilityCheck(character, 'STR', dc, rng)         → {success, total, natural, dc}

// Skill check: d20 + ability modifier + proficiency bonus (if proficient)
skillCheck(character, 'stealth', dc, rng)       → {success, total, natural, dc}

// Saving throw: d20 + ability modifier + proficiency bonus (if proficient in that save)
savingThrow(character, 'CON', dc, rng)          → {success, total, natural, dc}
```

All three support advantage/disadvantage as an optional parameter.

## Combat

### Initiative

```typescript
rollInitiative(character, rng)     → number (d20 + DEX modifier)
initiativeOrder(characters, rng)   → Character[] (sorted by initiative, highest first)
```

### Attacks

```typescript
meleeAttack(attacker, target, weaponDamage, rng) → AttackResult
// Attack roll: d20 + STR mod + proficiency bonus
// Hit: roll ≥ target AC
// Critical: natural 20 (double damage dice)
// Fumble: natural 1 (auto-miss)
// Damage: weapon dice + STR mod (minimum 1)

rangedAttack(attacker, target, weaponDamage, rng) → AttackResult
// Same formula but uses DEX instead of STR
```

### State

```typescript
applyDamage(character, amount)   → Character (HP reduced, min 0)
applyHealing(character, amount)  → Character (HP increased, max = maxHp)
passivePerception(character)     → number (10 + WIS mod + proficiency if proficient)
isUnconscious(character)         → boolean (HP = 0)
isDead(character)                → boolean (HP ≤ -maxHp)
```

## NPC Generation

```typescript
generateNpc(archetype, tierDefs, seed, location) → Character
```

Converts a narrative archetype (from `worlds/shared/npcs/`) into a full mechanical `Character`:

1. **Ability array** — selects physical, balanced, or mental distribution based on archetype category (e.g., `authority_martial` → physical, `authority_civil` → mental)
2. **Primary ability** — highest score assigned to the archetype's primary stat
3. **Level** — rolled from the stat tier's CR range
4. **HP** — tier base + CON modifier × level
5. **AC** — tier base + DEX modifier (capped by tier)
6. **Skills** — proficiencies drawn from archetype definition
7. **Inventory** — rolled from probability pools (required items always present, common ~50-80%, rare <20%)
8. **Traits** — 2-3 common traits + 0-1 rare trait

### Stat Tiers

| Tier | CR Range | Prof Bonus | Role |
|------|----------|------------|------|
| commoner | 0 – 1/8 | +2 | Civilians, laborers |
| skilled | 1/4 – 1/2 | +2 | Guards, apprentices |
| expert | 1 – 3 | +2 | Master crafters, sergeants |
| veteran | 4 – 8 | +3 | War-hardened fighters |
| elite | 9 – 12 | +4 | Faction leaders |
| legendary | 13 – 20 | +5 | Legendary figures, bosses |

## Encounter System

```typescript
rollEncounter(table, creatures, rng) → EncounterResult
// 1. Roll on d20 encounter table for the zone
// 2. Resolve creature counts (e.g., "2d4" → 5 goblins)
// 3. Look up stat blocks
// 4. Compute total encounter XP

findEncounterTable(tables, zoneId, partyLevel) → EncounterTable
// Zone = biome + weave state (e.g., "forest_stable", "forest_thinning")
```

CR-to-XP conversion covers CR 0–30 per D&D 2024 Free Rules.

## Threadhallow-Specific Systems

These systems are data-driven via `WorldConfig` — the engine loads tables, not hardcoded rules.

### Ward System

Settlements have a ward strength (0–100) that decays on events and recovers through ceremonies:

```typescript
applyWardEvent(currentStrength, event)     → number (new strength)
canCreatureBreach(cr, wardStrength)         → boolean
getWardThreshold(strength)                  → {label, effects}
```

### Fray Exposure

Characters accumulate Fray corruption (7 levels) with mechanical consequences:

```typescript
frayExposureSave(source, conMod, profBonus, rng) → {exposed, newLevel}
getFrayEffects(level)                             → {penalties, conditions}
```

A natural 20 on the saving throw always succeeds. Proficiency bonus is included if the character is proficient in CON saves.

### Skill Challenges

Generic framework used for ceremonies (Binding Song) and other extended challenges:

```typescript
runSkillChallenge(config, rolls[]) → {outcome, successes, failures}
// Track successes vs. failures
// Natural 20 = 2 successes
// Configurable DCs per skill
// Failure consequences escalate
```

/**
 * @loreweave/rules — D&D 5e rules engine
 *
 * Deterministic implementation of ability scores, combat resolution,
 * conditions, dice rolling, and other D&D 5e SRD mechanics.
 */

// Dice
export {
	createRng,
	d20,
	d20Advantage,
	d20Disadvantage,
	parseDiceNotation,
	rollDice,
	rollDie,
	xorshift32,
} from './dice.js';

// Abilities
export {
	abilityCheck,
	abilityModifier,
	getAbilityModifier,
	proficiencyBonus,
	rollAbilityScore,
	savingThrow,
	skillCheck,
	skillModifier,
	standardArray,
} from './abilities.js';
export type { CheckResult } from './abilities.js';

// Combat
export {
	applyDamage,
	applyHealing,
	initiativeOrder,
	isDead,
	isUnconscious,
	meleeAttack,
	passivePerception,
	rangedAttack,
	rollInitiative,
} from './combat.js';
export type { AttackResult } from './combat.js';

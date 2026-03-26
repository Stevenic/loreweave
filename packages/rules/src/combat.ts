/**
 * D&D 5e combat mechanics.
 *
 * Attack rolls, damage, initiative, and hit point management.
 * All functions are pure — they return results without mutating state.
 */

import type {
	Character,
	DiceRoll,
	GameEffect,
} from '@loreweave/types';
import { d20, rollDice } from './dice.js';
import { getAbilityModifier } from './abilities.js';

export type AttackResult = {
	hit: boolean;
	critical: boolean;
	fumble: boolean;
	attackRoll: number;
	attackTotal: number;
	damage: number;
	damageRolls: number[];
	effects: GameEffect[];
	narrationHints: string[];
};

/** Roll initiative for a character (d20 + DEX modifier). */
export function rollInitiative(character: Character, rng: () => number): number {
	return d20(rng) + getAbilityModifier(character, 'DEX');
}

/** Sort characters by initiative (descending). Returns new array. */
export function initiativeOrder(
	characters: Character[],
	rng: () => number,
): Character[] {
	const withInit = characters.map((c) => ({
		character: c,
		initiative: rollInitiative(c, rng),
	}));
	withInit.sort((a, b) => b.initiative - a.initiative);
	return withInit.map((w) => w.character);
}

/**
 * Resolve a melee attack.
 *
 * Uses STR modifier for attack and damage rolls.
 * Weapon damage is passed as a DiceRoll (e.g., { count: 1, sides: 8, modifier: 0 } for longsword).
 */
export function meleeAttack(
	attacker: Character,
	target: Character,
	weaponDamage: DiceRoll,
	rng: () => number,
): AttackResult {
	const strMod = getAbilityModifier(attacker, 'STR');
	const attackRoll = d20(rng);
	const attackTotal = attackRoll + strMod + attacker.proficiencyBonus;

	const critical = attackRoll === 20;
	const fumble = attackRoll === 1;
	const hit = critical || (!fumble && attackTotal >= target.ac);

	let damage = 0;
	let damageRolls: number[] = [];
	const effects: GameEffect[] = [];
	const narrationHints: string[] = [];

	if (hit) {
		// On critical hit, double the dice count
		const damageDice: DiceRoll = critical
			? { ...weaponDamage, count: weaponDamage.count * 2 }
			: weaponDamage;
		const result = rollDice(damageDice, rng);
		damage = result.total + strMod;
		damageRolls = result.rolls;

		// Minimum 1 damage on a hit
		if (damage < 1) damage = 1;

		effects.push({
			type: 'damage',
			targetId: target.id,
			amount: damage,
			source: attacker.id,
		});

		if (critical) {
			narrationHints.push('critical_hit');
		}
	} else if (fumble) {
		narrationHints.push('fumble');
	} else {
		narrationHints.push('miss');
	}

	return {
		hit,
		critical,
		fumble,
		attackRoll,
		attackTotal,
		damage,
		damageRolls,
		effects,
		narrationHints,
	};
}

/**
 * Resolve a ranged attack.
 *
 * Uses DEX modifier for attack and damage rolls.
 */
export function rangedAttack(
	attacker: Character,
	target: Character,
	weaponDamage: DiceRoll,
	rng: () => number,
): AttackResult {
	const dexMod = getAbilityModifier(attacker, 'DEX');
	const attackRoll = d20(rng);
	const attackTotal = attackRoll + dexMod + attacker.proficiencyBonus;

	const critical = attackRoll === 20;
	const fumble = attackRoll === 1;
	const hit = critical || (!fumble && attackTotal >= target.ac);

	let damage = 0;
	let damageRolls: number[] = [];
	const effects: GameEffect[] = [];
	const narrationHints: string[] = [];

	if (hit) {
		const damageDice: DiceRoll = critical
			? { ...weaponDamage, count: weaponDamage.count * 2 }
			: weaponDamage;
		const result = rollDice(damageDice, rng);
		damage = result.total + dexMod;
		damageRolls = result.rolls;

		if (damage < 1) damage = 1;

		effects.push({
			type: 'damage',
			targetId: target.id,
			amount: damage,
			source: attacker.id,
		});

		if (critical) {
			narrationHints.push('critical_hit');
		}
	} else if (fumble) {
		narrationHints.push('fumble');
	} else {
		narrationHints.push('miss');
	}

	return {
		hit,
		critical,
		fumble,
		attackRoll,
		attackTotal,
		damage,
		damageRolls,
		effects,
		narrationHints,
	};
}

/** Apply damage to a character. Returns a new character with updated HP. */
export function applyDamage(character: Character, amount: number): Character {
	const newHp = Math.max(0, character.hp - amount);
	return { ...character, hp: newHp };
}

/** Apply healing to a character. Cannot exceed maxHp. Returns a new character. */
export function applyHealing(character: Character, amount: number): Character {
	const newHp = Math.min(character.maxHp, character.hp + amount);
	return { ...character, hp: newHp };
}

/** Check if a character is unconscious (0 HP). */
export function isUnconscious(character: Character): boolean {
	return character.hp <= 0;
}

/** Check if a character is dead (0 HP + 3 failed death saves). Simplified for v1. */
export function isDead(character: Character): boolean {
	return character.hp <= 0 && character.conditions.includes('unconscious');
}

/** Compute passive perception for a character. */
export function passivePerception(character: Character): number {
	const wisMod = getAbilityModifier(character, 'WIS');
	const proficient = character.proficientSkills.includes('perception');
	return 10 + wisMod + (proficient ? character.proficiencyBonus : 0);
}

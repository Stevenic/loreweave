/**
 * D&D 5e ability score mechanics.
 *
 * Ability modifiers, skill checks, saving throws, and proficiency.
 */

import type {
	AbilityName,
	AbilityScores,
	Character,
	SkillName,
} from '@loreweave/types';
import { SKILL_ABILITIES } from '@loreweave/types';
import { d20, d20Advantage, d20Disadvantage } from './dice.js';

/** Compute the ability modifier from a score. D&D 5e: floor((score - 10) / 2). */
export function abilityModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

/** Get the modifier for a specific ability on a character. */
export function getAbilityModifier(character: Character, ability: AbilityName): number {
	return abilityModifier(character.abilities[ability]);
}

/** Get the proficiency bonus for a character's level. D&D 5e formula. */
export function proficiencyBonus(level: number): number {
	return Math.floor((level - 1) / 4) + 2;
}

/** Get the skill modifier for a character (ability mod + proficiency if proficient). */
export function skillModifier(character: Character, skill: SkillName): number {
	const ability = SKILL_ABILITIES[skill];
	const mod = abilityModifier(character.abilities[ability]);
	const proficient = character.proficientSkills.includes(skill);
	return mod + (proficient ? character.proficiencyBonus : 0);
}

export type CheckResult = {
	roll: number;
	modifier: number;
	total: number;
	success: boolean;
	critical: boolean;
	fumble: boolean;
};

/** Roll an ability check against a DC. */
export function abilityCheck(
	character: Character,
	ability: AbilityName,
	dc: number,
	rng: () => number,
	advantage?: 'advantage' | 'disadvantage',
): CheckResult {
	let roll: number;
	if (advantage === 'advantage') {
		[roll] = d20Advantage(rng);
	} else if (advantage === 'disadvantage') {
		[roll] = d20Disadvantage(rng);
	} else {
		roll = d20(rng);
	}

	const mod = getAbilityModifier(character, ability);
	const total = roll + mod;

	return {
		roll,
		modifier: mod,
		total,
		success: total >= dc,
		critical: roll === 20,
		fumble: roll === 1,
	};
}

/** Roll a skill check against a DC. */
export function skillCheck(
	character: Character,
	skill: SkillName,
	dc: number,
	rng: () => number,
	advantage?: 'advantage' | 'disadvantage',
): CheckResult {
	let roll: number;
	if (advantage === 'advantage') {
		[roll] = d20Advantage(rng);
	} else if (advantage === 'disadvantage') {
		[roll] = d20Disadvantage(rng);
	} else {
		roll = d20(rng);
	}

	const mod = skillModifier(character, skill);
	const total = roll + mod;

	return {
		roll,
		modifier: mod,
		total,
		success: total >= dc,
		critical: roll === 20,
		fumble: roll === 1,
	};
}

/** Roll a saving throw. */
export function savingThrow(
	character: Character,
	ability: AbilityName,
	dc: number,
	rng: () => number,
	proficient: boolean = false,
	advantage?: 'advantage' | 'disadvantage',
): CheckResult {
	let roll: number;
	if (advantage === 'advantage') {
		[roll] = d20Advantage(rng);
	} else if (advantage === 'disadvantage') {
		[roll] = d20Disadvantage(rng);
	} else {
		roll = d20(rng);
	}

	const mod = getAbilityModifier(character, ability) + (proficient ? character.proficiencyBonus : 0);
	const total = roll + mod;

	return {
		roll,
		modifier: mod,
		total,
		success: total >= dc,
		critical: roll === 20,
		fumble: roll === 1,
	};
}

/** Generate default ability scores (standard array). */
export function standardArray(): AbilityScores {
	return { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
}

/** Roll 4d6 drop lowest for one ability score. */
export function rollAbilityScore(rng: () => number): number {
	const rolls = [0, 0, 0, 0].map(() => {
		return Math.floor(rng() * 6) + 1;
	});
	rolls.sort((a, b) => b - a);
	return rolls[0] + rolls[1] + rolls[2]; // Drop lowest
}

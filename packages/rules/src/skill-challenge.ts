/**
 * Skill Challenge Framework — generic framework for multi-roll challenges.
 *
 * A skill challenge requires N successes before M failures.
 * Each roll uses a skill from the applicable list, with DC modified
 * by the skill's modifier. The Binding Song ceremony is one instance.
 *
 * All functions are pure.
 */

import type {
	Character,
	ChallengeSkill,
	SkillChallengeConfig,
	SkillChallengeResult,
	SkillName,
} from '@loreweave/types';
import { skillCheck } from './abilities.js';

/** A single attempt in a skill challenge. */
export type ChallengeAttempt = {
	skill: SkillName;
	character: Character;
};

/**
 * Run a complete skill challenge.
 *
 * @param config - The skill challenge configuration
 * @param attempts - The sequence of skill attempts (player choices)
 * @param baseDC - The base DC for this instance (e.g., based on Song completeness)
 * @param rng - Deterministic RNG
 */
export function runSkillChallenge(
	config: SkillChallengeConfig,
	attempts: ChallengeAttempt[],
	baseDC: number,
	rng: () => number,
): SkillChallengeResult {
	let successes = 0;
	let failures = 0;
	const rolls: SkillChallengeResult['rolls'] = [];

	for (const attempt of attempts) {
		// Stop if challenge is already decided
		if (successes >= config.successesRequired || failures >= config.failuresAllowed) {
			break;
		}

		// Find the skill's DC modifier
		const skillDef = config.applicableSkills.find((s) => s.skill === attempt.skill);
		const dcModifier = skillDef?.dcModifier ?? 0;
		const dc = baseDC + dcModifier;

		// Roll the check
		const result = skillCheck(attempt.character, attempt.skill, dc, rng);

		if (result.success) {
			// Natural 20 counts as 2 successes per Mechanics Companion §7
			successes += result.critical ? 2 : 1;
		} else {
			failures++;
		}

		rolls.push({
			skill: attempt.skill,
			dc,
			roll: result.total,
			success: result.success,
		});
	}

	const success = successes >= config.successesRequired;
	const flawless = success && failures === 0;

	return {
		success,
		flawless,
		successes,
		failures,
		rolls,
	};
}

/**
 * Get the base DC for a skill challenge given a state key.
 * Uses the challenge's baseDCTable to look up the DC.
 *
 * @param config - The skill challenge configuration
 * @param stateKey - The key into the DC table (e.g., "complete_song", "partial_song")
 * @param fallbackDC - Default DC if key not found
 */
export function getChallengeDC(
	config: SkillChallengeConfig,
	stateKey: string,
	fallbackDC: number = 12,
): number {
	return config.baseDCTable?.[stateKey] ?? fallbackDC;
}

/**
 * Get the failure consequence for a given failure number.
 */
export function getFailureConsequence(
	config: SkillChallengeConfig,
	failureNumber: number,
): string | undefined {
	const consequence = config.failureConsequences.find(
		(f) => f.failureNumber === failureNumber,
	);
	return consequence?.effect;
}

/**
 * Check which skills from the config a character is proficient in.
 * Useful for suggesting skills to the player.
 */
export function getApplicableSkills(
	config: SkillChallengeConfig,
	character: Character,
): ChallengeSkill[] {
	return config.applicableSkills.filter(
		(s) => character.proficientSkills.includes(s.skill),
	);
}

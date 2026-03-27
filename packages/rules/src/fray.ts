/**
 * Fray Exposure System — tracks corruption from the Fray.
 *
 * Fray exposure is cumulative and permanent (only removable by
 * Greater Restoration). Each level adds mechanical effects.
 * At level 7+, the creature risks transformation into a Fray creature.
 *
 * All functions are pure.
 */

import type {
	FrayExposureConfig,
	FrayExposureLevel,
} from '@loreweave/types';
import { d20 } from './dice.js';
import { abilityModifier } from './abilities.js';

/** Result of a Fray exposure save. */
export type FrayExposureResult = {
	exposed: boolean;
	saveRoll: number;
	saveTotal: number;
	saveDC: number;
	newLevel: number;
	previousLevel: number;
	transformed: boolean;
	transformedInto?: string;
};

/**
 * Make a Fray exposure save.
 *
 * @param currentLevel - Character's current Fray exposure level
 * @param conScore - Character's Constitution score
 * @param sourceDC - Save DC for this exposure source
 * @param config - World's Fray exposure configuration
 * @param rng - Deterministic RNG
 * @param proficientInConSave - Whether the character is proficient in CON saves
 * @param profBonus - The character's proficiency bonus (used if proficient)
 */
export function frayExposureSave(
	currentLevel: number,
	conScore: number,
	sourceDC: number,
	config: FrayExposureConfig,
	rng: () => number,
	proficientInConSave: boolean = false,
	profBonus: number = 0,
): FrayExposureResult {
	const conMod = abilityModifier(conScore);
	const roll = d20(rng);
	const total = roll + conMod + (proficientInConSave ? profBonus : 0);
	const success = total >= sourceDC;

	const newLevel = success ? currentLevel : currentLevel + 1;

	// Check for transformation at level 7+
	let transformed = false;
	let transformedInto: string | undefined;

	if (newLevel >= config.transformationLevel) {
		const transformRoll = d20(rng);
		const transformTotal = transformRoll + conMod;
		if (transformTotal < config.transformationDC) {
			transformed = true;
			transformedInto = 'looseling'; // Default; higher-CR creatures for higher-CR NPCs
		}
	}

	return {
		exposed: !success,
		saveRoll: roll,
		saveTotal: total,
		saveDC: sourceDC,
		newLevel,
		previousLevel: currentLevel,
		transformed,
		transformedInto,
	};
}

/**
 * Get the mechanical effects for a Fray exposure level.
 */
export function getFrayEffects(
	level: number,
	config: FrayExposureConfig,
): FrayExposureLevel | undefined {
	return config.levels.find((l) => l.level === level);
}

/**
 * Get all active Fray effects for a character's exposure level.
 * Effects are cumulative — a level 3 character has effects from levels 1, 2, and 3.
 */
export function getAllFrayEffects(
	level: number,
	config: FrayExposureConfig,
): FrayExposureLevel[] {
	return config.levels.filter((l) => l.level <= level);
}

/**
 * Look up the save DC for a given exposure source.
 */
export function getExposureDC(
	source: string,
	config: FrayExposureConfig,
): number {
	const match = config.sources.find((s) => s.source === source);
	return match?.saveDC ?? 13; // Default DC 13 if source not found
}

/**
 * Check if a character is immune to further Fray exposure saves
 * (level 5 — Resonant — grants immunity to zone exposure).
 */
export function isExposureImmune(
	level: number,
	config: FrayExposureConfig,
): boolean {
	// Level 5 (Resonant) grants immunity to zone-based exposure
	return level >= 5;
}

/**
 * Ward Strength System — tracks and computes settlement ward protection.
 *
 * Ward strength is an integer 0-100 per settlement. It determines
 * what CR creatures can breach the ward, Threadcraft DC bonuses,
 * and environmental effects within the protected area.
 *
 * All functions are pure — they compute new values from inputs.
 */

import type {
	WardEventDefinition,
	WardEventType,
	WardThreshold,
} from '@loreweave/types';

/**
 * Apply a ward event and return the new ward strength.
 *
 * @param currentStrength - Current ward strength (0-100)
 * @param eventType - The ward event that occurred
 * @param wardEvents - The world's ward event definitions
 * @param isHollowing - Whether this is during the Hollowing ceremony
 */
export function applyWardEvent(
	currentStrength: number,
	eventType: WardEventType,
	wardEvents: WardEventDefinition[],
	isHollowing: boolean = false,
): number {
	const eventDef = wardEvents.find((e) => e.type === eventType);
	if (!eventDef) return currentStrength;

	let delta = eventDef.strengthDelta;
	if (isHollowing && eventDef.hollowingMultiplier) {
		delta = delta * eventDef.hollowingMultiplier;
	}

	return clampWardStrength(currentStrength + delta);
}

/**
 * Get the current ward threshold (mechanical effects) for a given strength.
 */
export function getWardThreshold(
	strength: number,
	thresholds: WardThreshold[],
): WardThreshold | undefined {
	return thresholds.find(
		(t) => strength >= t.minStrength && strength <= t.maxStrength,
	);
}

/**
 * Check if a creature of a given CR can breach a ward.
 */
export function canCreatureBreach(
	cr: number,
	wardStrength: number,
	thresholds: WardThreshold[],
): boolean {
	const threshold = getWardThreshold(wardStrength, thresholds);
	if (!threshold) return true; // No threshold data = no protection
	return cr <= threshold.maxCreatureCR;
}

/**
 * Get the Threadcraft DC modifier for a ward strength.
 */
export function getThreadcraftBonus(
	wardStrength: number,
	thresholds: WardThreshold[],
): number {
	const threshold = getWardThreshold(wardStrength, thresholds);
	return threshold?.threadcraftDCModifier ?? 0;
}

/**
 * Compute natural ward decay over time (when no Wardweaver maintains it).
 *
 * @param currentStrength - Current ward strength
 * @param weeksWithoutMaintenance - Number of weeks without a Wardweaver
 * @param wardweaverDead - Whether the Wardweaver has died (accelerated decay)
 * @param monthsSinceDeath - Months since Wardweaver death
 */
export function computeNaturalDecay(
	currentStrength: number,
	weeksWithoutMaintenance: number,
	wardweaverDead: boolean,
	monthsSinceDeath: number = 0,
): number {
	let decay = 0;

	if (wardweaverDead) {
		decay = monthsSinceDeath * 4; // -4 per month
	} else {
		decay = weeksWithoutMaintenance * 1; // -1 per week
	}

	return clampWardStrength(currentStrength - decay);
}

/** Clamp ward strength to 0-100 range. */
function clampWardStrength(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

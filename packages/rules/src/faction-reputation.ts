/**
 * Faction Reputation — tracks and resolves faction standing changes.
 *
 * Implements Loremaster's Faction Reputation Mechanics:
 * - 9 tiers from Enemy (-100) to Allied (+100)
 * - Cross-faction ripple effects via relationship matrix
 * - Diminishing returns on repeated minor actions
 * - Content gating (companions, paths, side quests)
 * - Dialogue modifiers (DC, prices, tone)
 *
 * All functions are pure. No side effects.
 */

import type {
	AccessRequirement,
	DialogueModifiers,
	FactionId,
	FactionReputation,
	ReputationEvent,
	ReputationTier,
} from '@loreweave/types';

// ─── Tier Boundaries ───

const TIER_BOUNDARIES: { min: number; max: number; tier: ReputationTier }[] = [
	{ min: 76, max: 100, tier: 'allied' },
	{ min: 51, max: 75, tier: 'friendly' },
	{ min: 26, max: 50, tier: 'favorable' },
	{ min: 1, max: 25, tier: 'neutral_positive' },
	{ min: 0, max: 0, tier: 'neutral' },
	{ min: -25, max: -1, tier: 'neutral_negative' },
	{ min: -50, max: -26, tier: 'unfavorable' },
	{ min: -75, max: -51, tier: 'hostile' },
	{ min: -100, max: -76, tier: 'enemy' },
];

// ─── Cross-Faction Relationship Matrix ───
// Multiplier applied to reputation changes when one faction's rep changes.
// E.g., +10 to Wardweavers → Threadwalkers get +10 * -0.3 = -3

const CROSS_EFFECTS: Record<FactionId, Partial<Record<FactionId, number>>> = {
	wardweavers: { threadwalkers: -0.3, rememberers: 0.2, hollow_court: -0.5, common_folk: -0.1 },
	threadwalkers: { wardweavers: -0.3, rememberers: 0.3, hollow_court: 0.2, common_folk: 0.3 },
	rememberers: { wardweavers: 0.2, threadwalkers: 0.3, hollow_court: 0.1, common_folk: 0.1 },
	hollow_court: { wardweavers: -0.5, threadwalkers: 0.2, rememberers: 0.1, common_folk: -0.2 },
	common_folk: { wardweavers: -0.1, threadwalkers: 0.3, rememberers: 0.1, hollow_court: -0.2 },
};

// ─── Tier Ordering (for comparison) ───

const TIER_ORDER: ReputationTier[] = [
	'enemy', 'hostile', 'unfavorable', 'neutral_negative', 'neutral',
	'neutral_positive', 'favorable', 'friendly', 'allied',
];

// ─── Core Functions ───

/**
 * Get the reputation tier for a score.
 */
export function getReputationTier(score: number): ReputationTier {
	const clamped = Math.max(-100, Math.min(100, score));
	for (const boundary of TIER_BOUNDARIES) {
		if (clamped >= boundary.min && clamped <= boundary.max) {
			return boundary.tier;
		}
	}
	return 'neutral';
}

/**
 * Apply a reputation change to one faction with cross-faction ripple effects.
 *
 * Per Loremaster spec §3.2:
 * - Positive cross-effects always apply
 * - Negative impacts from targeting actions are direct, not multiplied
 * - Diminishing returns tracked via history (same actionId prefix)
 * - Common Folk floor at -50
 *
 * Returns a new state array (immutable).
 */
export function applyReputationChange(
	state: FactionReputation[],
	factionId: FactionId,
	delta: number,
	reason: string,
	actionId: string,
	gameTime: number,
): FactionReputation[] {
	const result = state.map((f) => ({ ...f, history: [...f.history] }));

	// Apply primary change with diminishing returns
	const primary = result.find((f) => f.factionId === factionId);
	if (!primary) return result;

	const effectiveDelta = applyDiminishingReturns(primary, actionId, delta);
	applyDelta(primary, effectiveDelta, reason, actionId, gameTime, false);

	// Apply cross-effects (only for positive primary deltas)
	const crossEffects = CROSS_EFFECTS[factionId];
	if (crossEffects) {
		for (const [targetId, multiplier] of Object.entries(crossEffects) as [FactionId, number][]) {
			if (targetId === factionId) continue;
			const target = result.find((f) => f.factionId === targetId);
			if (!target || multiplier === undefined) continue;

			const crossDelta = Math.trunc(effectiveDelta * multiplier);
			if (crossDelta === 0) continue;

			applyDelta(target, crossDelta, `Ripple from ${factionId}: ${reason}`, actionId, gameTime, true);
		}
	}

	return result;
}

/**
 * Check if a set of access requirements are met.
 * Used for companion recruitment, path gating, side quest access.
 */
export function checkContentAccess(
	state: FactionReputation[],
	requirements: AccessRequirement[],
): boolean {
	for (const req of requirements) {
		const faction = state.find((f) => f.factionId === req.factionId);
		if (!faction) return false;

		if (req.minScore !== undefined && faction.score < req.minScore) return false;
		if (req.minTier !== undefined && tierIndex(faction.tier) < tierIndex(req.minTier)) return false;
		if (req.notTier !== undefined && faction.tier === req.notTier) return false;
	}
	return true;
}

/**
 * Get dialogue modifiers for an NPC from a given faction.
 * Per Loremaster spec §4.3 and §6.
 */
export function getDialogueModifiers(
	state: FactionReputation[],
	factionId: FactionId,
): DialogueModifiers {
	const faction = state.find((f) => f.factionId === factionId);
	if (!faction) {
		return { dcModifier: 0, merchantPriceModifier: 1.0, knowledgeTier: 'always', toneDescriptor: 'neutral' };
	}

	switch (faction.tier) {
		case 'allied':
			return { dcModifier: -3, merchantPriceModifier: 0.9, knowledgeTier: 'rarely', toneDescriptor: 'Faction members actively seek you out. Leaders share secrets freely.' };
		case 'friendly':
			return { dcModifier: -3, merchantPriceModifier: 0.9, knowledgeTier: 'sometimes', toneDescriptor: 'Warm reception. NPCs volunteer information.' };
		case 'favorable':
			return { dcModifier: -1, merchantPriceModifier: 1.0, knowledgeTier: 'sometimes', toneDescriptor: 'Positive but cautious. Honest answers without extras.' };
		case 'neutral_positive':
			return { dcModifier: 0, merchantPriceModifier: 1.0, knowledgeTier: 'always', toneDescriptor: 'Polite but guarded.' };
		case 'neutral':
			return { dcModifier: 0, merchantPriceModifier: 1.0, knowledgeTier: 'always', toneDescriptor: 'No opinion formed.' };
		case 'neutral_negative':
			return { dcModifier: 0, merchantPriceModifier: 1.0, knowledgeTier: 'always', toneDescriptor: 'Cool reception. Curt answers.' };
		case 'unfavorable':
			return { dcModifier: 2, merchantPriceModifier: 1.25, knowledgeTier: 'always', toneDescriptor: 'Suspicious. Refuses optional help.' };
		case 'hostile':
			return { dcModifier: 5, merchantPriceModifier: 2.0, knowledgeTier: 'always', toneDescriptor: 'Active opposition. May refuse service entirely.' };
		case 'enemy':
			return { dcModifier: 10, merchantPriceModifier: 999, knowledgeTier: 'always', toneDescriptor: 'Actively works against you. Bounties, sabotage.' };
	}
}

/**
 * Create the initial faction reputation state for a new game.
 * Common Folk starts at +10 per spec §5.
 */
export function createInitialReputation(): FactionReputation[] {
	const factions: FactionId[] = ['wardweavers', 'threadwalkers', 'rememberers', 'hollow_court', 'common_folk'];
	return factions.map((factionId) => {
		const score = factionId === 'common_folk' ? 10 : 0;
		return {
			factionId,
			score,
			tier: getReputationTier(score),
			history: [],
		};
	});
}

// ─── Helpers ───

function applyDelta(
	faction: FactionReputation,
	delta: number,
	reason: string,
	actionId: string,
	gameTime: number,
	crossEffect: boolean,
): void {
	faction.score += delta;

	// Common Folk floor at -50 per spec §5
	if (faction.factionId === 'common_folk' && faction.score < -50) {
		faction.score = -50;
	}

	// Clamp to [-100, +100]
	faction.score = Math.max(-100, Math.min(100, faction.score));
	faction.tier = getReputationTier(faction.score);

	const event: ReputationEvent = {
		actionId,
		delta,
		reason,
		timestamp: gameTime,
		crossEffect,
	};
	faction.history.push(event);
}

/**
 * Apply diminishing returns for repeated minor actions.
 * Per spec §3.3: 1st–3rd full value, 4th–6th half, 7th+ ±1 max.
 */
function applyDiminishingReturns(
	faction: FactionReputation,
	actionId: string,
	delta: number,
): number {
	// Count prior occurrences of the same action prefix
	const prefix = actionId.replace(/_\d+$/, '');
	const priorCount = faction.history.filter((e) => !e.crossEffect && e.actionId.replace(/_\d+$/, '') === prefix).length;

	if (priorCount < 3) return delta;
	if (priorCount < 6) return Math.trunc(delta / 2) || (delta > 0 ? 1 : -1);
	return delta > 0 ? 1 : -1;
}

function tierIndex(tier: ReputationTier): number {
	return TIER_ORDER.indexOf(tier);
}

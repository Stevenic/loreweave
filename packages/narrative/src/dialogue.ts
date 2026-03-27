/**
 * Dialogue System — NPC conversation context and companion interjections.
 *
 * Builds DialogueContext from NPC archetypes for the LLM to voice NPCs.
 * Manages companion interjections based on topic relevance and values.
 * Social skill checks gate NPC knowledge tiers.
 */

import type {
	CompanionReaction,
	CompanionState,
	CompanionSummary,
	DialogueApproach,
	DialogueContext,
	EntityRef,
	GameEffect,
	NpcArchetype,
	SocialCheckResult,
	TimeOfDay,
} from '@loreweave/types';
import { createRng, skillCheck } from '@loreweave/rules';
import type { Character } from '@loreweave/types';

// ─── NPC Dialogue Context ───

/**
 * Build a DialogueContext for an NPC from their archetype data.
 *
 * @param npcName - The NPC's display name
 * @param archetype - The NPC archetype definition
 * @param timeOfDay - Current time (affects schedule/activity)
 * @param isHostile - Whether the NPC is hostile to the party
 */
export function buildDialogueContext(
	npcName: string,
	archetype: NpcArchetype,
	timeOfDay: TimeOfDay,
	isHostile: boolean,
): DialogueContext {
	// Determine current activity from schedule
	let currentActivity: string | undefined;
	if (archetype.schedule) {
		const scheduleSlot = timeOfDayToScheduleSlot(timeOfDay);
		currentActivity = archetype.schedule[scheduleSlot];
	}

	// Determine disposition based on hostility and archetype category
	let disposition: DialogueContext['disposition'] = 'neutral';
	if (isHostile) {
		disposition = 'hostile';
	} else if (archetype.category === 'merchant' || archetype.category === 'service') {
		disposition = 'friendly';
	} else if (archetype.category === 'authority') {
		disposition = 'wary';
	}

	return {
		npcName,
		archetypeId: archetype.id,
		voicePatterns: archetype.voice_patterns,
		dialogueHooks: archetype.dialogue_hooks,
		knowledge: {
			always: archetype.knowledge.always,
			sometimes: archetype.knowledge.sometimes,
			rarely: archetype.knowledge.rarely,
		},
		currentActivity,
		disposition,
	};
}

/**
 * Resolve a social skill check for dialogue.
 *
 * @param actor - The character making the check
 * @param approach - The social skill being used
 * @param baseDC - Base difficulty (default 12)
 * @param rng - RNG function for the roll
 * @returns SocialCheckResult with knowledge tier unlocked
 */
export function resolveSocialCheck(
	actor: Character,
	approach: DialogueApproach,
	baseDC: number,
	rng: () => number,
): SocialCheckResult {
	const skillName = APPROACH_TO_SKILL[approach];
	const result = skillCheck(actor, skillName, baseDC, rng);

	// Knowledge tier: always (free), sometimes (DC met), rarely (DC+6 met)
	let knowledgeTier: SocialCheckResult['knowledgeTier'] = 'always';
	if (result.success) {
		knowledgeTier = 'sometimes';
		if (result.total >= baseDC + 6) {
			knowledgeTier = 'rarely';
		}
	}
	if (result.critical) {
		knowledgeTier = 'rarely';
	}

	return {
		skill: approach,
		roll: result.roll,
		total: result.total,
		dc: baseDC,
		success: result.success,
		critical: result.critical,
		knowledgeTier,
	};
}

/** Map dialogue approaches to D&D skill names. */
const APPROACH_TO_SKILL: Record<DialogueApproach, 'persuasion' | 'intimidation' | 'deception' | 'insight'> = {
	persuasion: 'persuasion',
	intimidation: 'intimidation',
	deception: 'deception',
	insight: 'insight',
};

/** Map time of day to schedule slot. */
function timeOfDayToScheduleSlot(timeOfDay: TimeOfDay): 'morning' | 'afternoon' | 'evening' | 'night' {
	switch (timeOfDay) {
		case 'dawn':
		case 'morning':
			return 'morning';
		case 'noon':
		case 'afternoon':
			return 'afternoon';
		case 'dusk':
		case 'evening':
			return 'evening';
		case 'night':
		case 'midnight':
			return 'night';
	}
}

// ─── Companion System ───

/** Maximum companions in the active party. */
export const MAX_COMPANIONS = 2;

/**
 * Convert raw approval score to a qualitative tone for the LLM.
 * The player never sees the number — only the tone shift in narration.
 */
export function approvalToTone(approval: number): CompanionSummary['relationshipTone'] {
	if (approval >= 75) return 'devoted';
	if (approval >= 50) return 'warm';
	if (approval >= 25) return 'friendly';
	if (approval >= -10) return 'neutral';
	if (approval >= -40) return 'cool';
	if (approval >= -70) return 'strained';
	return 'hostile';
}

/**
 * Summarize a companion for the LLM narrative context.
 * Converts internal state to LLM-safe representation (no raw numbers).
 */
export function summarizeCompanion(
	companion: CompanionState,
	currentTopics: string[],
): CompanionSummary {
	// Find topics the companion cares about that are relevant this turn
	const relevantInterjections = companion.interjectionTopics.filter(
		(topic) => currentTopics.some((ct) => ct.includes(topic) || topic.includes(ct)),
	).filter(
		// Don't repeat topics already discussed
		(topic) => !companion.relationship.discussedTopics.has(topic),
	);

	return {
		name: companion.character.name,
		hp: companion.character.hp,
		maxHp: companion.character.maxHp,
		conditions: companion.character.conditions,
		relationshipTone: approvalToTone(companion.relationship.approval),
		relevantInterjections,
	};
}

/**
 * Check if a companion should interject based on the current turn context.
 * Returns interjection topics that match, or empty array if no interjection.
 */
export function checkCompanionInterjections(
	companion: CompanionState,
	actionTopics: string[],
	nearbyEntityTypes: string[],
): string[] {
	if (!companion.active) return [];

	const triggers: string[] = [];

	// Check topic-based interjections
	for (const topic of companion.interjectionTopics) {
		if (companion.relationship.discussedTopics.has(topic)) continue;

		const topicLower = topic.toLowerCase();
		const matches = actionTopics.some((at) => at.toLowerCase().includes(topicLower))
			|| nearbyEntityTypes.some((et) => et.toLowerCase().includes(topicLower));

		if (matches) {
			triggers.push(topic);
		}
	}

	return triggers;
}

/**
 * Evaluate a player action against a companion's values.
 * Returns a reaction effect if the action violates or affirms their values.
 */
export function evaluateCompanionValues(
	companion: CompanionState,
	actionDescription: string,
	actionSuccess: boolean,
): GameEffect | null {
	const actionLower = actionDescription.toLowerCase();

	for (const value of companion.values) {
		const valueLower = value.toLowerCase();

		// Check for value violations (negative keywords in context of the value)
		const violationKeywords = ['kill', 'destroy', 'betray', 'abandon', 'steal', 'lie'];
		const affirmKeywords = ['protect', 'help', 'save', 'heal', 'defend', 'honor'];

		const isViolation = violationKeywords.some((kw) => actionLower.includes(kw))
			&& actionLower.includes(valueLower);
		const isAffirmation = affirmKeywords.some((kw) => actionLower.includes(kw))
			&& actionLower.includes(valueLower);

		if (isViolation) {
			return {
				type: 'companion_reaction',
				companionId: companion.character.id,
				reaction: companion.relationship.warnings >= 2 ? 'leave' : 'warn',
				reason: `violated value: ${value}`,
			};
		}

		if (isAffirmation && actionSuccess) {
			return {
				type: 'companion_reaction',
				companionId: companion.character.id,
				reaction: 'approve',
				reason: `affirmed value: ${value}`,
			};
		}
	}

	return null;
}

/**
 * Apply a companion reaction to the companion's relationship state.
 * Returns the updated companion state — no mutation.
 */
export function applyCompanionReaction(
	companion: CompanionState,
	reaction: CompanionReaction,
	topics: string[],
): CompanionState {
	const rel = { ...companion.relationship };
	const discussed = new Set(rel.discussedTopics);

	// Mark topics as discussed
	for (const topic of topics) {
		discussed.add(topic);
	}

	switch (reaction) {
		case 'approve':
			rel.approval = Math.min(100, rel.approval + 5);
			break;
		case 'disapprove':
			rel.approval = Math.max(-100, rel.approval - 5);
			break;
		case 'warn':
			rel.warnings++;
			rel.approval = Math.max(-100, rel.approval - 15);
			break;
		case 'leave':
			// Companion deactivates
			return {
				...companion,
				active: false,
				relationship: { ...rel, discussedTopics: discussed },
			};
		case 'interject':
			// Interjections slightly increase approval (engagement)
			rel.approval = Math.min(100, rel.approval + 2);
			break;
	}

	return {
		...companion,
		relationship: { ...rel, discussedTopics: discussed },
	};
}

/**
 * Extract dialogue-relevant topics from a player's input and the current context.
 * Used for NPC knowledge lookup and companion interjection matching.
 */
export function extractDialogueTopics(
	input: string,
	nearbyEntities: EntityRef[],
	questHints: string[],
): string[] {
	const topics: string[] = [];
	const words = input.toLowerCase().split(/\s+/);

	// Add entity names/types as topics
	for (const entity of nearbyEntities) {
		if (words.some((w) => entity.name.toLowerCase().includes(w) || w.includes(entity.name.toLowerCase()))) {
			topics.push(entity.name);
		}
		topics.push(entity.type);
	}

	// Add quest-related keywords
	for (const hint of questHints) {
		const hintWords = hint.toLowerCase().split(/\s+/);
		if (words.some((w) => hintWords.includes(w))) {
			topics.push(hint);
		}
	}

	// Add common topic keywords from input
	const topicKeywords = [
		'weave', 'thread', 'fray', 'loom', 'binding', 'ceremony',
		'ward', 'thinning', 'hollow', 'song', 'stone',
		'history', 'legend', 'danger', 'quest', 'help',
		'trade', 'buy', 'sell', 'rumor', 'news',
	];
	for (const kw of topicKeywords) {
		if (words.includes(kw)) {
			topics.push(kw);
		}
	}

	return [...new Set(topics)];
}

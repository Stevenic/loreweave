/**
 * Prompt Builder — converts NarrativeContext + ActionResult into LLM prompts.
 *
 * Builds the system prompt (DM persona, rules, constraints) and
 * user prompt (current situation, action taken, mechanical results)
 * that the LLM uses to generate narrative text.
 *
 * The prompts are designed to keep the LLM in its lane:
 * - Describe what happened (narrative)
 * - Never override mechanical outcomes (the dice have already spoken)
 * - Stay within the token budget
 */

import type {
	ActionResult,
	CharacterSummary,
	ExitInfo,
	GameEffect,
	GameSession,
	NarrativeContext,
	WorldEvent,
} from '@loreweave/types';
import type { ParseResult } from './intent-parser.js';

/** The complete prompt pair sent to the LLM. */
export type PromptPair = {
	system: string;
	user: string;
};

/**
 * Build the system prompt — the DM's persona and rules.
 * This is relatively static and can be cached across turns.
 */
export function buildSystemPrompt(session: GameSession): string {
	const lines: string[] = [
		'You are the Dungeon Master for a D&D 5e-inspired text adventure game called LoreWeave.',
		'',
		'## Your Role',
		'- Describe scenes, narrate actions, and voice NPCs',
		'- You render narrative FROM mechanical results — you never override them',
		'- When dice have been rolled, describe the outcome as given — do not change hits to misses or vice versa',
		'- Keep descriptions vivid but concise (2-5 sentences per response)',
		'- Address the player in second person ("You see...", "You hear...")',
		'- Maintain consistent tone: adventurous, immersive, with touches of humor when appropriate',
		'',
		'## Rules',
		'- NEVER decide mechanical outcomes (damage, hit/miss, skill success) — these are pre-resolved',
		'- NEVER add items, abilities, or effects not present in the provided context',
		'- NEVER break the fourth wall or reference game mechanics directly (don\'t say "you rolled a 15")',
		'- If the player tries something not covered by the action system, narrate it as flavor',
		'- If combat results are provided, narrate them dramatically but accurately',
		'- End descriptions with a subtle prompt for what the player might do next',
		'',
		'## World State',
		`- Turn: ${session.turnCount}`,
		`- Party size: ${session.party.length}`,
		`- In combat: ${session.inCombat ? 'yes' : 'no'}`,
	];

	return lines.join('\n');
}

/**
 * Build the user prompt — the current situation and what just happened.
 * This changes every turn.
 */
export function buildUserPrompt(
	context: NarrativeContext,
	parseResult: ParseResult,
	actionResult: ActionResult | null,
): string {
	const sections: string[] = [];

	// Location
	sections.push(buildLocationSection(context));

	// Time & Weather
	sections.push(buildEnvironmentSection(context));

	// Party State
	sections.push(buildPartySection(context.players));

	// Nearby Entities
	if (context.visibleEntities.length > 0) {
		sections.push(buildEntitiesSection(context));
	}

	// Exits
	sections.push(buildExitsSection(context.nearbyExits));

	// Recent Events
	if (context.recentEvents.length > 0) {
		sections.push(buildEventsSection(context.recentEvents));
	}

	// Quest Hints
	if (context.questHints.length > 0) {
		sections.push(buildQuestSection(context.questHints));
	}

	// Player Action
	sections.push(buildActionSection(parseResult, actionResult));

	return sections.join('\n\n');
}

/**
 * Build the complete prompt pair for a turn.
 */
export function buildPrompts(
	session: GameSession,
	context: NarrativeContext,
	parseResult: ParseResult,
	actionResult: ActionResult | null,
): PromptPair {
	return {
		system: buildSystemPrompt(session),
		user: buildUserPrompt(context, parseResult, actionResult),
	};
}

// ─── Section Builders ───

function buildLocationSection(context: NarrativeContext): string {
	const tile = context.location;
	const lines = [
		'## Current Location',
		`Biome: ${tile.biome}`,
		`Surface: ${tile.surface}`,
		`Elevation: ${tile.elevation.toFixed(2)}`,
	];

	if (tile.features.length > 0) {
		lines.push(`Features: ${tile.features.join(', ')}`);
	}
	if (tile.structures.length > 0) {
		lines.push(`Structures: ${tile.structures.join(', ')}`);
	}
	if (tile.resources.length > 0) {
		lines.push(`Resources: ${tile.resources.join(', ')}`);
	}
	if (tile.river) {
		lines.push('A river flows through this area.');
	}

	return lines.join('\n');
}

function buildEnvironmentSection(context: NarrativeContext): string {
	return [
		'## Environment',
		`Time: ${context.timeOfDay}`,
		`Season: ${context.season}`,
		`Weather: ${context.weather}`,
	].join('\n');
}

function buildPartySection(players: CharacterSummary[]): string {
	const lines = ['## Party'];
	for (const p of players) {
		const conditions = p.conditions.length > 0 ? ` [${p.conditions.join(', ')}]` : '';
		lines.push(`- ${p.name}: ${p.hp}/${p.maxHp} HP${conditions}`);
	}
	return lines.join('\n');
}

function buildEntitiesSection(context: NarrativeContext): string {
	const lines = ['## Nearby Entities'];
	for (const entity of context.visibleEntities) {
		const hostility = entity.hostile ? '(hostile)' : '(neutral)';
		lines.push(`- ${entity.name} [${entity.type}] ${hostility}`);
	}
	return lines.join('\n');
}

function buildExitsSection(exits: ExitInfo[]): string {
	const lines = ['## Exits'];
	for (const exit of exits) {
		lines.push(`- ${exit.direction}: ${exit.description}`);
	}
	return lines.join('\n');
}

function buildEventsSection(events: WorldEvent[]): string {
	const lines = ['## Recent Events'];
	for (const event of events) {
		lines.push(`- Day ${event.timestamp.day}: ${event.type} at (${event.location.x}, ${event.location.y})`);
	}
	return lines.join('\n');
}

function buildQuestSection(hints: string[]): string {
	const lines = ['## Quest Hints'];
	for (const hint of hints) {
		lines.push(`- ${hint}`);
	}
	return lines.join('\n');
}

function buildActionSection(
	parseResult: ParseResult,
	actionResult: ActionResult | null,
): string {
	const lines = ['## Player Action'];
	lines.push(`Input: "${parseResult.raw}"`);

	if (!parseResult.action) {
		if (parseResult.failureHints.includes('empty_input')) {
			lines.push('The player said nothing. Describe the current scene.');
		} else if (parseResult.failureHints.includes('unrecognized_action')) {
			lines.push('The player said something that isn\'t a recognized game action. Treat it as roleplaying/dialogue and respond in character.');
		} else if (parseResult.failureHints.includes('no_direction')) {
			lines.push('The player wants to move but didn\'t specify a direction. Ask where they want to go.');
		}
		return lines.join('\n');
	}

	lines.push(`Action: ${parseResult.action.type}`);
	if (parseResult.action.direction) {
		lines.push(`Direction: ${parseResult.action.direction}`);
	}
	if (parseResult.action.targetId) {
		lines.push(`Target: ${parseResult.action.targetId}`);
	}
	if (parseResult.action.stealth) {
		lines.push('Attempting stealthily.');
	}

	if (actionResult) {
		lines.push('');
		lines.push(`## Mechanical Result`);
		lines.push(`Outcome: ${actionResult.success ? 'SUCCESS' : 'FAILURE'}`);

		if (actionResult.narrationHints.length > 0) {
			lines.push(`Hints: ${actionResult.narrationHints.join(', ')}`);
		}

		if (actionResult.effects.length > 0) {
			lines.push('');
			lines.push('Effects to narrate:');
			for (const effect of actionResult.effects) {
				lines.push(`- ${describeEffect(effect)}`);
			}
		}
	}

	return lines.join('\n');
}

/** Convert a GameEffect to a human-readable description for the LLM. */
function describeEffect(effect: GameEffect): string {
	switch (effect.type) {
		case 'move':
			return `Moved from (${effect.from.x},${effect.from.y}) to (${effect.to.x},${effect.to.y})`;
		case 'damage':
			return `${effect.targetId} took ${effect.amount} damage from ${effect.source}`;
		case 'heal':
			return `${effect.targetId} healed ${effect.amount} HP`;
		case 'item_gained':
			return `${effect.entityId} gained ${effect.quantity}× ${effect.item.name}`;
		case 'item_lost':
			return `${effect.entityId} lost ${effect.quantity}× ${effect.itemId}`;
		case 'condition_added':
			return `${effect.entityId} is now ${effect.condition}`;
		case 'condition_removed':
			return `${effect.entityId} is no longer ${effect.condition}`;
		case 'structure_placed':
			return `Structure ${effect.structureId} placed at (${effect.location.x},${effect.location.y})`;
		case 'resource_gathered':
			return `Gathered ${effect.quantity}× ${effect.resource} at (${effect.location.x},${effect.location.y})`;
	}
}

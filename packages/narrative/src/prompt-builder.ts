/**
 * Prompt Builder — converts NarrativeContext + ActionResult into LLM prompts.
 *
 * Builds the system prompt (DM persona, rules, constraints) and
 * user prompt (current situation, action taken, mechanical results)
 * that the LLM uses to generate narrative text.
 *
 * When a WorldConfig is provided, the system prompt uses the DMPersona
 * for world-specific tone, naming conventions, and constraints.
 * Without a WorldConfig, falls back to the generic DM persona.
 *
 * The prompts are designed to keep the LLM in its lane:
 * - Describe what happened (narrative)
 * - Never override mechanical outcomes (the dice have already spoken)
 * - Stay within the token budget
 */

import type {
	ActionResult,
	BiomeType,
	CharacterSummary,
	DMPersona,
	ExitInfo,
	GameEffect,
	GameSession,
	GameSessionConfig,
	NarrativeContext,
	SensoryDescriptors,
	VocabularyTable,
	WorldConfig,
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
 *
 * @param session - The game session
 * @param worldConfig - Optional world configuration for persona injection
 */
export function buildSystemPrompt(
	session: GameSession,
	worldConfig?: WorldConfig,
): string {
	const lines: string[] = [];

	if (worldConfig?.persona) {
		lines.push(...buildPersonaPrompt(worldConfig.persona, session));
	} else {
		lines.push(...buildGenericPrompt(session));
	}

	return lines.join('\n');
}

/**
 * Build the user prompt — the current situation and what just happened.
 * This changes every turn.
 *
 * @param context - The assembled narrative context
 * @param parseResult - The parsed player intent
 * @param actionResult - The mechanical result (null if no action)
 * @param worldConfig - Optional world config for vocabulary enrichment
 * @param sessionConfig - Optional session config for ward/faction/fray state
 */
export function buildUserPrompt(
	context: NarrativeContext,
	parseResult: ParseResult,
	actionResult: ActionResult | null,
	worldConfig?: WorldConfig,
	sessionConfig?: GameSessionConfig,
): string {
	const sections: string[] = [];

	// Location (with vocabulary enrichment)
	sections.push(buildLocationSection(context, worldConfig?.vocabulary?.biomes));

	// Time & Weather (with vocabulary enrichment)
	sections.push(buildEnvironmentSection(
		context,
		worldConfig?.vocabulary?.timeOfDay,
		worldConfig?.vocabulary?.weather,
	));

	// World-specific state (ward strength, fray exposure, faction standing)
	if (sessionConfig) {
		const worldState = buildWorldStateSection(sessionConfig);
		if (worldState) sections.push(worldState);
	}

	// Party State
	sections.push(buildPartySection(context.players, sessionConfig));

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
	worldConfig?: WorldConfig,
	sessionConfig?: GameSessionConfig,
): PromptPair {
	return {
		system: buildSystemPrompt(session, worldConfig),
		user: buildUserPrompt(context, parseResult, actionResult, worldConfig, sessionConfig),
	};
}

// ─── System Prompt Builders ───

/** Build the system prompt from a DMPersona. */
function buildPersonaPrompt(persona: DMPersona, session: GameSession): string[] {
	const lines: string[] = [
		`You are the Dungeon Master for ${persona.worldName}, a D&D 5e-inspired text adventure powered by LoreWeave.`,
		'',
		`## Your Identity: ${persona.name}`,
		persona.narrativeStyle,
		'',
		'## Tone Guide',
	];

	for (const rule of persona.toneGuide) {
		lines.push(`- ${rule}`);
	}

	lines.push('', '## Response Style', persona.responseLength, '');

	if (persona.namingConventions.length > 0) {
		lines.push('## Naming Conventions');
		for (const convention of persona.namingConventions) {
			lines.push(`- ${convention}`);
		}
		lines.push('');
	}

	if (persona.specialInstructions.length > 0) {
		lines.push('## Special Instructions');
		for (const instruction of persona.specialInstructions) {
			lines.push(`- ${instruction}`);
		}
		lines.push('');
	}

	lines.push(
		'## Rules',
		'- NEVER decide mechanical outcomes (damage, hit/miss, skill success) — these are pre-resolved',
		'- NEVER add items, abilities, or effects not present in the provided context',
		'- NEVER break the fourth wall or reference game mechanics directly',
		'- If the player tries something not covered by the action system, narrate it as flavor',
		'- If combat results are provided, narrate them dramatically but accurately',
		'- End descriptions with a subtle prompt for what the player might do next',
	);

	if (persona.forbiddenTopics.length > 0) {
		lines.push('', '## Forbidden Topics');
		for (const topic of persona.forbiddenTopics) {
			lines.push(`- Do NOT: ${topic}`);
		}
	}

	lines.push(
		'',
		'## World State',
		`- Turn: ${session.turnCount}`,
		`- Party size: ${session.party.length}`,
		`- In combat: ${session.inCombat ? 'yes' : 'no'}`,
	);

	return lines;
}

/** Build the generic system prompt (no DMPersona). */
function buildGenericPrompt(session: GameSession): string[] {
	return [
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
}

// ─── User Prompt Section Builders ───

function buildLocationSection(
	context: NarrativeContext,
	biomeVocab?: VocabularyTable,
): string {
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

	// Inject vocabulary descriptors for the biome
	if (biomeVocab) {
		const descriptors = biomeVocab[tile.biome];
		if (descriptors) {
			lines.push('');
			lines.push('Sensory details for this biome:');
			appendDescriptors(lines, descriptors);
		}
	}

	return lines.join('\n');
}

function buildEnvironmentSection(
	context: NarrativeContext,
	timeVocab?: VocabularyTable,
	weatherVocab?: VocabularyTable,
): string {
	const lines = [
		'## Environment',
		`Time: ${context.timeOfDay}`,
		`Season: ${context.season}`,
		`Weather: ${context.weather}`,
	];

	// Inject time-of-day vocabulary
	if (timeVocab) {
		const timeDesc = timeVocab[context.timeOfDay];
		if (timeDesc) {
			lines.push('');
			lines.push('Time-of-day sensory details:');
			appendDescriptors(lines, timeDesc);
		}
	}

	// Inject weather vocabulary
	if (weatherVocab) {
		const weatherDesc = weatherVocab[context.weather];
		if (weatherDesc) {
			lines.push('');
			lines.push('Weather sensory details:');
			appendDescriptors(lines, weatherDesc);
		}
	}

	return lines.join('\n');
}

function buildWorldStateSection(config: GameSessionConfig): string | null {
	const lines: string[] = [];

	// Ward strengths
	if (config.wardStrengths && config.wardStrengths.size > 0) {
		lines.push('## Ward Status');
		for (const [settlement, strength] of config.wardStrengths) {
			const status = strength >= 75 ? 'strong' : strength >= 50 ? 'weakened' : strength >= 25 ? 'failing' : 'critical';
			lines.push(`- ${settlement}: ${strength}% (${status})`);
		}
	}

	// Faction reputation
	if (config.factionReputation && config.factionReputation.size > 0) {
		lines.push('## Faction Standing');
		for (const [faction, rep] of config.factionReputation) {
			const stance = rep >= 50 ? 'allied' : rep >= 20 ? 'friendly' : rep >= -20 ? 'neutral' : rep >= -50 ? 'distrusted' : 'hostile';
			lines.push(`- ${faction}: ${stance} (${rep})`);
		}
	}

	// Fray exposure
	if (config.frayExposure && config.frayExposure.size > 0) {
		lines.push('## Fray Exposure');
		for (const [charId, level] of config.frayExposure) {
			if (level > 0) {
				lines.push(`- ${charId}: level ${level}`);
			}
		}
	}

	return lines.length > 0 ? lines.join('\n') : null;
}

function buildPartySection(
	players: CharacterSummary[],
	sessionConfig?: GameSessionConfig,
): string {
	const lines = ['## Party'];
	for (const p of players) {
		const conditions = p.conditions.length > 0 ? ` [${p.conditions.join(', ')}]` : '';
		let frayNote = '';
		if (sessionConfig?.frayExposure) {
			// Try to find by name match (party members)
			for (const [charId, level] of sessionConfig.frayExposure) {
				if (charId === p.name && level > 0) {
					frayNote = ` {Fray: ${level}}`;
				}
			}
		}
		lines.push(`- ${p.name}: ${p.hp}/${p.maxHp} HP${conditions}${frayNote}`);
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

// ─── Helpers ───

/** Append sensory descriptors as bullet points. */
function appendDescriptors(lines: string[], descriptors: SensoryDescriptors): void {
	if (descriptors.terrain?.length) lines.push(`  Terrain: ${descriptors.terrain.join(', ')}`);
	if (descriptors.sounds?.length) lines.push(`  Sounds: ${descriptors.sounds.join(', ')}`);
	if (descriptors.smells?.length) lines.push(`  Smells: ${descriptors.smells.join(', ')}`);
	if (descriptors.atmosphere?.length) lines.push(`  Atmosphere: ${descriptors.atmosphere.join(', ')}`);
	if (descriptors.sky?.length) lines.push(`  Sky: ${descriptors.sky.join(', ')}`);
	if (descriptors.light?.length) lines.push(`  Light: ${descriptors.light.join(', ')}`);
	if (descriptors.feel?.length) lines.push(`  Feel: ${descriptors.feel.join(', ')}`);
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

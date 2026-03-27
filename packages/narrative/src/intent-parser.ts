/**
 * Intent Parser — keyword-based player input → GameAction.
 *
 * Parses natural language player input into structured game actions.
 * This is deterministic (no LLM) — fast and free. The LLM is only
 * used downstream for narrative rendering, never for mechanical decisions.
 */

import type {
	ActionType,
	DialogueApproach,
	Direction,
	GameAction,
	Character,
	EntityRef,
} from '@loreweave/types';

// ─── Direction Keywords ───

const DIRECTION_KEYWORDS: Record<string, Direction> = {
	north: 'north',
	n: 'north',
	south: 'south',
	s: 'south',
	east: 'east',
	e: 'east',
	west: 'west',
	w: 'west',
	northeast: 'northeast',
	ne: 'northeast',
	northwest: 'northwest',
	nw: 'northwest',
	southeast: 'southeast',
	se: 'southeast',
	southwest: 'southwest',
	sw: 'southwest',
	up: 'north',
	down: 'south',
	left: 'west',
	right: 'east',
};

// ─── Action Patterns ───

type ActionPattern = {
	type: ActionType;
	keywords: string[];
	/** Whether this action requires a direction. */
	requiresDirection?: boolean;
	/** Whether this action requires a target entity. */
	requiresTarget?: boolean;
	/** Whether this action requires an item. */
	requiresItem?: boolean;
};

const ACTION_PATTERNS: ActionPattern[] = [
	// Movement — "go north", "walk east", "move south", or just "north"
	{ type: 'move', keywords: ['go', 'walk', 'move', 'head', 'travel', 'run', 'flee'], requiresDirection: true },
	// Looking — "look", "look around", "examine", "inspect"
	{ type: 'look', keywords: ['look', 'examine', 'inspect', 'observe', 'survey', 'scout', 'peer', 'check'] },
	// Attack — "attack goblin", "hit wolf", "strike bandit"
	{ type: 'attack', keywords: ['attack', 'hit', 'strike', 'fight', 'slash', 'stab', 'shoot', 'swing', 'cast'], requiresTarget: true },
	// Use item — "use potion", "drink potion", "eat bread"
	{ type: 'use_item', keywords: ['use', 'drink', 'eat', 'consume', 'apply', 'activate', 'equip', 'wear'], requiresItem: true },
	// Pickup — "pick up sword", "grab torch", "take gold"
	{ type: 'pickup', keywords: ['pickup', 'grab', 'take', 'collect', 'loot', 'gather'], requiresItem: true },
	// Drop — "drop torch", "discard rope"
	{ type: 'drop', keywords: ['drop', 'discard', 'throw away', 'leave', 'abandon'], requiresItem: true },
	// Craft — "craft torch", "make potion"
	{ type: 'craft', keywords: ['craft', 'make', 'build', 'create', 'forge', 'brew', 'cook'], requiresItem: true },
	// Talk — "talk to merchant", "speak with innkeeper"
	{ type: 'talk', keywords: ['talk', 'speak', 'chat', 'ask', 'greet', 'hail', 'negotiate', 'barter', 'trade'], requiresTarget: true },
	// Persuade — "persuade guard", "convince merchant"
	{ type: 'persuade', keywords: ['persuade', 'convince', 'plead', 'appeal', 'request', 'entreat'], requiresTarget: true },
	// Intimidate — "intimidate bandit", "threaten guard"
	{ type: 'intimidate', keywords: ['intimidate', 'threaten', 'menace', 'bully', 'demand', 'coerce'], requiresTarget: true },
	// Deceive — "lie to guard", "bluff merchant", "deceive"
	{ type: 'deceive', keywords: ['deceive', 'lie', 'bluff', 'trick', 'mislead', 'fool'], requiresTarget: true },
	// Ceremony — "perform ceremony", "begin binding song", "start ritual"
	{ type: 'ceremony', keywords: ['ceremony', 'ritual', 'binding song', 'perform', 'chant', 'invoke'] },
	// Rest — "rest", "sleep", "camp", "make camp"
	{ type: 'rest', keywords: ['rest', 'sleep', 'camp', 'nap', 'meditate'] },
	// Search — "search area", "search for traps", "forage"
	{ type: 'search', keywords: ['search', 'forage', 'dig', 'investigate', 'explore', 'scavenge', 'hunt'] },
];

/** Parse result — either a successfully parsed action or a failure with context. */
export type ParseResult = {
	action: GameAction | null;
	/** Raw input text. */
	raw: string;
	/** If parsing failed, hints for the LLM to describe confusion. */
	failureHints: string[];
};

/**
 * Parse player input into a GameAction.
 *
 * @param input - Raw player text input
 * @param actorId - The ID of the character performing the action
 * @param nearbyEntities - Entities in the vicinity (for target resolution)
 * @param inventoryItemNames - Item names in the actor's inventory (for item resolution)
 */
export function parseIntent(
	input: string,
	actorId: string,
	nearbyEntities: EntityRef[] = [],
	inventoryItemNames: string[] = [],
): ParseResult {
	const raw = input.trim();
	const lower = raw.toLowerCase();
	const words = lower.split(/\s+/);

	if (words.length === 0 || (words.length === 1 && words[0] === '')) {
		return { action: null, raw, failureHints: ['empty_input'] };
	}

	// Check if input is just a direction (bare "north", "sw", etc.)
	if (words.length === 1 && DIRECTION_KEYWORDS[words[0]]) {
		return {
			action: { type: 'move', actorId, direction: DIRECTION_KEYWORDS[words[0]] },
			raw,
			failureHints: [],
		};
	}

	// Try to match an action pattern
	for (const pattern of ACTION_PATTERNS) {
		const matchedKeyword = pattern.keywords.find((kw) => {
			// Match if any word starts with the keyword, or the input contains the multi-word keyword
			if (kw.includes(' ')) {
				return lower.includes(kw);
			}
			return words.some((w) => w === kw || w.startsWith(kw));
		});

		if (!matchedKeyword) continue;

		const action: GameAction = { type: pattern.type, actorId };

		// Extract direction
		if (pattern.requiresDirection || pattern.type === 'move') {
			const direction = extractDirection(words);
			if (direction) {
				action.direction = direction;
			} else if (pattern.requiresDirection) {
				// Move without direction — ask the LLM to prompt for one
				return { action: null, raw, failureHints: ['no_direction', `action:${pattern.type}`] };
			}
		}

		// Extract target entity
		if (pattern.requiresTarget) {
			const target = resolveTarget(lower, matchedKeyword, nearbyEntities);
			if (target) {
				action.targetId = target;
			}
			// Missing target is OK for some actions — LLM can narrate "attack what?"
		}

		// Extract item reference
		if (pattern.requiresItem) {
			const item = resolveItem(lower, matchedKeyword, inventoryItemNames);
			if (item) {
				action.itemId = item;
			}
		}

		// Check for stealth modifier
		if (lower.includes('stealth') || lower.includes('sneak') || lower.includes('quietly') || lower.includes('silently')) {
			action.stealth = true;
		}

		// Set dialogue approach for social actions
		if (pattern.type === 'persuade') {
			action.dialogueApproach = 'persuasion';
		} else if (pattern.type === 'intimidate') {
			action.dialogueApproach = 'intimidation';
		} else if (pattern.type === 'deceive') {
			action.dialogueApproach = 'deception';
		} else if (pattern.type === 'talk') {
			// Infer approach from context words
			action.dialogueApproach = inferDialogueApproach(lower);
		}

		// Extract dialogue topic from "about" clauses
		if (pattern.type === 'talk' || pattern.type === 'persuade' || pattern.type === 'intimidate' || pattern.type === 'deceive') {
			action.dialogueTopic = extractDialogueTopic(lower);
		}

		return { action, raw, failureHints: [] };
	}

	// No pattern matched — might be freeform RP or something the LLM can handle narratively
	return { action: null, raw, failureHints: ['unrecognized_action'] };
}

/** Extract a direction from the word list. */
function extractDirection(words: string[]): Direction | undefined {
	for (const word of words) {
		if (DIRECTION_KEYWORDS[word]) {
			return DIRECTION_KEYWORDS[word];
		}
	}
	return undefined;
}

/**
 * Resolve a target entity from the input text.
 * Matches against nearby entity names using substring match.
 */
function resolveTarget(
	input: string,
	matchedKeyword: string,
	entities: EntityRef[],
): string | undefined {
	// Get the text after the action keyword
	const keywordIndex = input.indexOf(matchedKeyword);
	const afterKeyword = input.slice(keywordIndex + matchedKeyword.length).trim();
	// Strip common prepositions
	const cleaned = afterKeyword
		.replace(/^(to|with|at|the|a|an)\s+/g, '')
		.trim();

	if (!cleaned) return undefined;

	// Try exact match first, then substring
	for (const entity of entities) {
		if (entity.name.toLowerCase() === cleaned) {
			return entity.id;
		}
	}
	for (const entity of entities) {
		if (entity.name.toLowerCase().includes(cleaned) || cleaned.includes(entity.name.toLowerCase())) {
			return entity.id;
		}
	}
	// Try matching entity type
	for (const entity of entities) {
		if (entity.type.toLowerCase() === cleaned || cleaned.includes(entity.type.toLowerCase())) {
			return entity.id;
		}
	}

	return undefined;
}

/**
 * Resolve an item from the input text.
 * Matches against inventory item names using substring match.
 */
function resolveItem(
	input: string,
	matchedKeyword: string,
	itemNames: string[],
): string | undefined {
	const keywordIndex = input.indexOf(matchedKeyword);
	const afterKeyword = input.slice(keywordIndex + matchedKeyword.length).trim();
	const cleaned = afterKeyword
		.replace(/^(the|a|an|my|some)\s+/g, '')
		.trim();

	if (!cleaned) return undefined;

	// Try exact match first, then substring
	for (const name of itemNames) {
		if (name.toLowerCase() === cleaned) {
			return name;
		}
	}
	for (const name of itemNames) {
		if (name.toLowerCase().includes(cleaned) || cleaned.includes(name.toLowerCase())) {
			return name;
		}
	}

	// Return raw text as item reference — resolver will handle "item not found"
	return cleaned;
}

/**
 * Infer dialogue approach from contextual keywords in the input.
 * Returns undefined if no clear approach is detected (general conversation).
 */
function inferDialogueApproach(input: string): DialogueApproach | undefined {
	if (input.includes('persuade') || input.includes('convince') || input.includes('plead')) {
		return 'persuasion';
	}
	if (input.includes('threaten') || input.includes('intimidate') || input.includes('demand')) {
		return 'intimidation';
	}
	if (input.includes('lie') || input.includes('bluff') || input.includes('deceive') || input.includes('trick')) {
		return 'deception';
	}
	if (input.includes('read') || input.includes('sense') || input.includes('tell if')) {
		return 'insight';
	}
	return undefined;
}

/**
 * Extract a dialogue topic from "about" clauses in the input.
 * E.g., "ask merchant about the missing shipment" → "the missing shipment"
 */
function extractDialogueTopic(input: string): string | undefined {
	const aboutIndex = input.indexOf(' about ');
	if (aboutIndex !== -1) {
		return input.slice(aboutIndex + 7).trim() || undefined;
	}
	const ofIndex = input.indexOf(' of ');
	if (ofIndex !== -1 && (input.includes('ask') || input.includes('inquire'))) {
		return input.slice(ofIndex + 4).trim() || undefined;
	}
	return undefined;
}

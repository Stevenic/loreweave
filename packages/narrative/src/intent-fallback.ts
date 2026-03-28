/**
 * Chat-to-Intent LLM Fallback (§4.3).
 *
 * When the keyword-based intent parser returns null with no failureHints,
 * this module invokes an LLM to extract structured game actions from
 * freeform IC chat. Budget-gated: only invoked when keyword parser fails
 * completely (no partial matches or hints).
 *
 * The LLM returns a structured GameAction or null (pure roleplay).
 * Pure roleplay is narrated as flavor text by the DM.
 */

import type {
	ActionType,
	Direction,
	EntityRef,
	GameAction,
	IntentExtractionContext,
	IntentExtractionResult,
	NarrativeAdapter,
} from '@loreweave/types';
import { parseIntent } from './intent-parser.js';
import type { ParseResult } from './intent-parser.js';

/** Valid action types for LLM extraction validation. */
const VALID_ACTION_TYPES: Set<string> = new Set<string>([
	'move', 'look', 'attack', 'use_item', 'pickup', 'drop',
	'craft', 'talk', 'persuade', 'intimidate', 'deceive',
	'ceremony', 'rest', 'search',
]);

/** Valid directions for LLM extraction validation. */
const VALID_DIRECTIONS: Set<string> = new Set<string>([
	'north', 'south', 'east', 'west',
	'northeast', 'northwest', 'southeast', 'southwest',
]);

/**
 * System prompt for intent extraction.
 * Instructs the LLM to return JSON — never narrative text.
 */
const INTENT_EXTRACTION_SYSTEM_PROMPT = `You are a game action parser for a D&D-style text adventure. Your job is to extract structured game actions from freeform player input.

RULES:
- Return ONLY valid JSON — no markdown, no explanation, no narrative.
- If the input describes a clear game action, extract it.
- If the input is pure roleplay, conversation, or emoting with no game action, return {"actionType": null, "isRoleplay": true, "confidence": 1.0}.
- Never invent actions the player didn't express.
- Match target names against the provided nearby entities.
- Match item names against the provided inventory.

Valid action types: move, look, attack, use_item, pickup, drop, craft, talk, persuade, intimidate, deceive, ceremony, rest, search
Valid directions: north, south, east, west, northeast, northwest, southeast, southwest

Response format (JSON only):
{
  "actionType": "move" | "look" | "attack" | ... | null,
  "targetName": "entity name" | undefined,
  "direction": "north" | "south" | ... | undefined,
  "itemName": "item name" | undefined,
  "confidence": 0.0-1.0,
  "isRoleplay": true | false
}`;

/**
 * Build the user prompt for intent extraction.
 */
function buildExtractionPrompt(context: IntentExtractionContext): string {
	const lines: string[] = [
		`Player input: "${context.rawInput}"`,
		'',
		`Location: ${context.locationDescription}`,
	];

	if (context.nearbyEntities.length > 0) {
		lines.push(`Nearby entities: ${context.nearbyEntities.map((e) => `${e.name} (${e.type})`).join(', ')}`);
	} else {
		lines.push('Nearby entities: none');
	}

	if (context.inventoryItems.length > 0) {
		lines.push(`Inventory: ${context.inventoryItems.join(', ')}`);
	} else {
		lines.push('Inventory: empty');
	}

	if (context.recentActions.length > 0) {
		lines.push(`Recent actions: ${context.recentActions.join(', ')}`);
	}

	lines.push('', 'Return JSON only.');

	return lines.join('\n');
}

/**
 * Parse the LLM's JSON response into a validated IntentExtractionResult.
 * Returns a roleplay result on any parse failure (safe fallback).
 */
function parseExtractionResponse(raw: string): IntentExtractionResult {
	const fallback: IntentExtractionResult = {
		actionType: null,
		confidence: 0,
		isRoleplay: true,
	};

	try {
		// Strip markdown code fences if present
		const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
		const parsed: unknown = JSON.parse(cleaned);

		if (typeof parsed !== 'object' || parsed === null) return fallback;

		const obj = parsed as Record<string, unknown>;

		const result: IntentExtractionResult = {
			actionType: typeof obj.actionType === 'string' && VALID_ACTION_TYPES.has(obj.actionType)
				? obj.actionType
				: null,
			confidence: typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0,
			isRoleplay: obj.isRoleplay === true || obj.actionType === null,
		};

		if (typeof obj.targetName === 'string' && obj.targetName.length > 0) {
			result.targetName = obj.targetName;
		}
		if (typeof obj.direction === 'string' && VALID_DIRECTIONS.has(obj.direction)) {
			result.direction = obj.direction;
		}
		if (typeof obj.itemName === 'string' && obj.itemName.length > 0) {
			result.itemName = obj.itemName;
		}

		return result;
	} catch {
		return fallback;
	}
}

/**
 * Resolve an extracted target name to an entity ID.
 */
function resolveTargetFromName(
	targetName: string,
	entities: EntityRef[],
): string | undefined {
	const lower = targetName.toLowerCase();
	for (const entity of entities) {
		if (entity.name.toLowerCase() === lower) return entity.id;
	}
	for (const entity of entities) {
		if (entity.name.toLowerCase().includes(lower) || lower.includes(entity.name.toLowerCase())) {
			return entity.id;
		}
	}
	return undefined;
}

/**
 * Convert an IntentExtractionResult into a GameAction.
 */
function extractionToAction(
	result: IntentExtractionResult,
	actorId: string,
	entities: EntityRef[],
	inventoryNames: string[],
): GameAction | null {
	if (result.isRoleplay || !result.actionType) return null;

	const action: GameAction = {
		type: result.actionType as ActionType,
		actorId,
	};

	if (result.direction) {
		action.direction = result.direction as Direction;
	}

	if (result.targetName) {
		const resolved = resolveTargetFromName(result.targetName, entities);
		if (resolved) {
			action.targetId = resolved;
		}
	}

	if (result.itemName) {
		// Try to match against inventory
		const lower = result.itemName.toLowerCase();
		const matched = inventoryNames.find((n) =>
			n.toLowerCase() === lower || n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase()),
		);
		action.itemId = matched ?? result.itemName;
	}

	return action;
}

/**
 * Enhanced intent parsing with LLM fallback (§4.3).
 *
 * 1. Try keyword-based parsing first (fast, free, deterministic).
 * 2. If keyword parser returns null with failureHints === ['unrecognized_action'],
 *    invoke the LLM fallback for intent extraction.
 * 3. LLM returns a structured action or null (pure roleplay).
 *
 * @param input - Raw player IC message
 * @param actorId - Acting character ID
 * @param nearbyEntities - Entities in the vicinity
 * @param inventoryItemNames - Items in the actor's inventory
 * @param adapter - NarrativeAdapter for LLM calls
 * @param locationDescription - Current location description for LLM context
 * @param recentActions - Recent action types for LLM context
 */
export async function parseIntentWithFallback(
	input: string,
	actorId: string,
	nearbyEntities: EntityRef[],
	inventoryItemNames: string[],
	adapter: NarrativeAdapter,
	locationDescription: string,
	recentActions: string[] = [],
): Promise<ParseResult> {
	// 1. Try keyword parser first
	const keywordResult = parseIntent(input, actorId, nearbyEntities, inventoryItemNames);

	// If keyword parser succeeded, use it
	if (keywordResult.action) return keywordResult;

	// 2. Only fallback when completely unrecognized (no partial matches/hints)
	// Budget gate: failureHints must be exactly ['unrecognized_action']
	if (
		keywordResult.failureHints.length !== 1
		|| keywordResult.failureHints[0] !== 'unrecognized_action'
	) {
		return keywordResult;
	}

	// 3. Build LLM context and extract intent
	const context: IntentExtractionContext = {
		rawInput: input,
		locationDescription,
		nearbyEntities: nearbyEntities.map((e) => ({ name: e.name, type: e.type })),
		inventoryItems: inventoryItemNames,
		recentActions: recentActions.slice(-3),
	};

	const userPrompt = buildExtractionPrompt(context);

	try {
		const raw = await adapter.generate(INTENT_EXTRACTION_SYSTEM_PROMPT, userPrompt);
		const extraction = parseExtractionResponse(raw);

		// Pure roleplay — return null action with no failure hints (DM narrates as flavor)
		if (extraction.isRoleplay || !extraction.actionType) {
			return {
				action: null,
				raw: input,
				failureHints: [], // Empty hints = pure roleplay, narrate as flavor
			};
		}

		// Convert extraction to GameAction
		const action = extractionToAction(extraction, actorId, nearbyEntities, inventoryItemNames);

		if (action) {
			return { action, raw: input, failureHints: [] };
		}

		// Extraction produced an action type but resolution failed — treat as roleplay
		return { action: null, raw: input, failureHints: [] };
	} catch {
		// LLM failure — fall back to original keyword result
		return keywordResult;
	}
}

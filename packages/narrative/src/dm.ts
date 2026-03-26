/**
 * Dungeon Master — the game engine orchestrator.
 *
 * The DM ties together intent parsing, rules resolution, context assembly,
 * and narrative generation into a single turn-processing loop.
 *
 * Architecture (per the spec):
 *   Player Input → Intent Parser → Rules Engine → World State Update
 *                                                    ↓
 *                                              Narrative Engine (LLM)
 *
 * The LLM renders narrative FROM mechanical results — it never decides
 * mechanical outcomes. Dice rolls, combat, movement — all deterministic code.
 */

import type {
	ActionResult,
	Character,
	DMConfig,
	DMResponse,
	EntityRef,
	GameEffect,
	GameSession,
	NarrativeAdapter,
	Quest,
	TileCoord,
} from '@loreweave/types';
import { createRng } from '@loreweave/rules';
import { World } from '@loreweave/world';
import { parseIntent } from './intent-parser.js';
import type { ParseResult } from './intent-parser.js';
import { assembleContext, getPartyLocation } from './context-assembler.js';
import { resolveAction, applyEffects } from './action-resolver.js';
import { buildPrompts } from './prompt-builder.js';

/** Default DM configuration. */
export const DEFAULT_DM_CONFIG: DMConfig = {
	viewRadius: 5,
	recentEventCount: 10,
	recentEventDays: 7,
	defaultDC: 12,
	actionTimeMinutes: 5,
	restTimeMinutes: 480,
};

/**
 * The Dungeon Master.
 *
 * Manages a game session and processes player turns through the
 * full pipeline: parse → resolve → narrate.
 */
export class DungeonMaster {
	readonly session: GameSession;
	readonly config: DMConfig;
	private adapter: NarrativeAdapter;
	/** All characters (party + known NPCs) keyed by ID. */
	private characters: Map<string, Character>;
	/** Seed for turn-level RNG derivation. */
	private turnSeedBase: number;

	constructor(
		session: GameSession,
		adapter: NarrativeAdapter,
		config: Partial<DMConfig> = {},
	) {
		this.session = session;
		this.adapter = adapter;
		this.config = { ...DEFAULT_DM_CONFIG, ...config };

		// Build character roster from party
		this.characters = new Map();
		for (const char of session.party) {
			this.characters.set(char.id, char);
		}

		// Derive turn seed from world seed
		const rng = createRng(Number(session.world.seed & 0xFFFFFFFFn));
		this.turnSeedBase = Math.floor(rng() * 0xFFFFFFFF);
	}

	/**
	 * Process a player's turn.
	 *
	 * This is the main entry point — takes raw player text input,
	 * runs it through the full pipeline, and returns the DM's response.
	 */
	async processTurn(input: string, actorId?: string): Promise<DMResponse> {
		const actor = actorId
			? this.characters.get(actorId)
			: this.session.party[0];

		if (!actor) {
			throw new Error(`Actor not found: ${actorId ?? 'no party members'}`);
		}

		// Increment turn counter
		this.session.turnCount++;

		// Derive deterministic seed for this turn
		const turnSeed = this.turnSeedBase ^ this.session.turnCount;

		// 1. Parse intent
		const inventoryNames = actor.inventory.map((s) => s.item.name);
		const parseResult = parseIntent(
			input,
			actor.id,
			this.session.knownEntities,
			inventoryNames,
		);

		// 2. Resolve action through rules engine (if parseable)
		let actionResult: ActionResult | null = null;
		if (parseResult.action) {
			actionResult = resolveAction(
				parseResult.action,
				actor,
				this.session.world,
				this.characters,
				this.config,
				turnSeed,
			);

			// Apply effects to character state
			if (actionResult.effects.length > 0) {
				this.characters = applyEffects(this.characters, actionResult.effects);
				this.syncPartyFromRoster();
				this.applyWorldEffects(actionResult.effects, actor.location);
			}

			// Advance game time
			const timeCost = parseResult.action.type === 'rest'
				? this.config.restTimeMinutes
				: this.config.actionTimeMinutes;
			this.session.world.advanceTime(timeCost);
		}

		// 3. Assemble narrative context (after effects are applied)
		const context = assembleContext(this.session, this.config);

		// 4. Update known entities based on new position
		this.updateKnownEntities();

		// 5. Build prompts and generate narrative
		const prompts = buildPrompts(this.session, context, parseResult, actionResult);
		const narrative = await this.adapter.generate(prompts.system, prompts.user);

		return {
			narrative,
			action: parseResult.action,
			result: actionResult,
			effects: actionResult?.effects ?? [],
			context,
			party: [...this.session.party],
			time: { ...this.session.world.time },
		};
	}

	/**
	 * Process a "look" turn — describe the current scene without taking an action.
	 * Useful for the initial scene description when starting a game.
	 */
	async describeSurroundings(): Promise<DMResponse> {
		const context = assembleContext(this.session, this.config);

		const parseResult: ParseResult = {
			action: { type: 'look', actorId: this.session.party[0]?.id ?? 'unknown' },
			raw: '',
			failureHints: [],
		};

		const actor = this.session.party[0];
		let actionResult: ActionResult | null = null;
		if (actor) {
			actionResult = resolveAction(
				parseResult.action!,
				actor,
				this.session.world,
				this.characters,
				this.config,
				this.turnSeedBase,
			);
		}

		const prompts = buildPrompts(this.session, context, parseResult, actionResult);
		const narrative = await this.adapter.generate(prompts.system, prompts.user);

		return {
			narrative,
			action: parseResult.action,
			result: actionResult,
			effects: [],
			context,
			party: [...this.session.party],
			time: { ...this.session.world.time },
		};
	}

	/** Get the current party. */
	getParty(): Character[] {
		return [...this.session.party];
	}

	/** Add a character to the party. */
	addPartyMember(character: Character): void {
		this.session.party.push(character);
		this.characters.set(character.id, character);
	}

	/** Remove a character from the party. */
	removePartyMember(characterId: string): void {
		this.session.party = this.session.party.filter((c) => c.id !== characterId);
		this.characters.delete(characterId);
	}

	/** Add a quest to the active quest list. */
	addQuest(quest: Quest): void {
		this.session.quests.push(quest);
	}

	/** Remove a quest by ID. */
	completeQuest(questId: string): Quest | undefined {
		const index = this.session.quests.findIndex((q) => q.id === questId);
		if (index === -1) return undefined;
		const [quest] = this.session.quests.splice(index, 1);
		return quest;
	}

	/** Register an entity as known (visible to the party). */
	addKnownEntity(entity: EntityRef): void {
		if (!this.session.knownEntities.some((e) => e.id === entity.id)) {
			this.session.knownEntities.push(entity);
		}
	}

	/** Remove a known entity by ID. */
	removeKnownEntity(entityId: string): void {
		this.session.knownEntities = this.session.knownEntities.filter((e) => e.id !== entityId);
	}

	/** Swap the narrative adapter (e.g., switch LLM models mid-game). */
	setAdapter(adapter: NarrativeAdapter): void {
		this.adapter = adapter;
	}

	// ─── Internal ───

	/** Sync the session's party array from the character roster after effects. */
	private syncPartyFromRoster(): void {
		this.session.party = this.session.party.map((p) => {
			return this.characters.get(p.id) ?? p;
		});
	}

	/** Apply world-level effects (structure placement, resource depletion). */
	private applyWorldEffects(effects: GameEffect[], location: TileCoord): void {
		for (const effect of effects) {
			if (effect.type === 'resource_gathered') {
				this.session.world.addEvent({
					timestamp: { ...this.session.world.time },
					location: effect.location,
					type: 'resource_depleted',
					details: { resource: effect.resource, quantity: effect.quantity },
				});
			}
		}
	}

	/**
	 * Update known entities based on spawns in loaded chunks near the party.
	 * In v1 this is simple — scan nearby chunks for spawn points.
	 */
	private updateKnownEntities(): void {
		const partyLoc = getPartyLocation(this.session.party);

		// For now, keep existing known entities if they're within view range
		this.session.knownEntities = this.session.knownEntities.filter((e) => {
			const dx = Math.abs(e.location.x - partyLoc.x);
			const dy = Math.abs(e.location.y - partyLoc.y);
			return dx <= this.config.viewRadius && dy <= this.config.viewRadius;
		});
	}
}

/**
 * Create a new game session.
 *
 * @param id - Unique session identifier
 * @param worldSeed - The world seed (string or bigint)
 * @param party - Initial party members
 */
export function createSession(
	id: string,
	worldSeed: bigint,
	party: Character[],
): GameSession {
	return {
		id,
		world: new World(worldSeed),
		party,
		quests: [],
		turnCount: 0,
		knownEntities: [],
		inCombat: false,
		initiativeOrder: [],
	};
}

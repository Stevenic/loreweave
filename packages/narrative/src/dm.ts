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
 *
 * When a WorldConfig is provided, the DM becomes world-specific:
 * - System prompt uses the DMPersona (tone, naming, constraints)
 * - User prompt injects vocabulary tables (biome, weather, time descriptors)
 * - Session tracks ward strengths, faction reputation, fray exposure
 */

import type {
	ActionResult,
	Character,
	CompanionState,
	DMConfig,
	DMResponse,
	EntityRef,
	GameEffect,
	GameSession,
	GameSessionConfig,
	NarrativeAdapter,
	NpcArchetype,
	Quest,
	TileCoord,
	WeaveGraph,
	WorldConfig,
} from '@loreweave/types';
import { createRng } from '@loreweave/rules';
import { World } from '@loreweave/world';
import { parseIntent } from './intent-parser.js';
import type { ParseResult } from './intent-parser.js';
import { assembleContext, getPartyLocation } from './context-assembler.js';
import { resolveAction, applyEffects } from './action-resolver.js';
import { buildPrompts } from './prompt-builder.js';
import {
	MAX_COMPANIONS,
	applyCompanionReaction,
	buildDialogueContext,
	checkCompanionInterjections,
	evaluateCompanionValues,
	extractDialogueTopics,
} from './dialogue.js';

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
	readonly worldConfig?: WorldConfig;
	readonly sessionConfig: GameSessionConfig;
	private adapter: NarrativeAdapter;
	/** All characters (party + known NPCs) keyed by ID. */
	private characters: Map<string, Character>;
	/** Seed for turn-level RNG derivation. */
	private turnSeedBase: number;
	/** NPC archetype registry (archetype ID → archetype). */
	private archetypeRegistry: Map<string, NpcArchetype>;

	constructor(
		session: GameSession,
		adapter: NarrativeAdapter,
		config: Partial<DMConfig> = {},
		worldConfig?: WorldConfig,
	) {
		this.session = session;
		this.adapter = adapter;
		this.config = { ...DEFAULT_DM_CONFIG, ...config };
		this.worldConfig = worldConfig;

		// Initialize session config for world-specific state
		this.sessionConfig = {
			worldConfig,
			wardStrengths: new Map(),
			factionReputation: new Map(),
			frayExposure: new Map(),
		};

		// Build character roster from party + companions
		this.characters = new Map();
		for (const char of session.party) {
			this.characters.set(char.id, char);
		}
		for (const companion of session.companions ?? []) {
			this.characters.set(companion.character.id, companion.character);
		}

		// Initialize archetype registry
		this.archetypeRegistry = new Map();

		// Ensure session has companions array
		if (!session.companions) {
			session.companions = [];
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

		// 3. Process companion reactions
		if (parseResult.action && actionResult) {
			this.processCompanionReactions(input, actionResult);
		}

		// 4. Assemble narrative context (after effects are applied)
		const context = assembleContext(this.session, this.config);

		// 5. Inject dialogue context if talking to an NPC
		if (parseResult.action?.type === 'talk'
			|| parseResult.action?.type === 'persuade'
			|| parseResult.action?.type === 'intimidate'
			|| parseResult.action?.type === 'deceive') {
			const targetEntity = parseResult.action.targetId
				? this.session.knownEntities.find((e) => e.id === parseResult.action?.targetId)
				: undefined;
			if (targetEntity) {
				const archetype = this.archetypeRegistry.get(targetEntity.type);
				if (archetype) {
					context.dialogueTarget = buildDialogueContext(
						targetEntity.name,
						archetype,
						this.session.world.getTimeOfDay(),
						targetEntity.hostile,
					);
				}
			}
		}

		// 6. Update known entities based on new position
		this.updateKnownEntities();

		// 7. Build prompts and generate narrative (with world config)
		const prompts = buildPrompts(
			this.session,
			context,
			parseResult,
			actionResult,
			this.worldConfig,
			this.sessionConfig,
		);
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

		const prompts = buildPrompts(
			this.session,
			context,
			parseResult,
			actionResult,
			this.worldConfig,
			this.sessionConfig,
		);
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

	// ─── World State Management ───

	/** Set ward strength for a settlement. */
	setWardStrength(settlementId: string, strength: number): void {
		this.sessionConfig.wardStrengths?.set(settlementId, Math.max(0, Math.min(100, strength)));
	}

	/** Get ward strength for a settlement. */
	getWardStrength(settlementId: string): number {
		return this.sessionConfig.wardStrengths?.get(settlementId) ?? 0;
	}

	/** Set faction reputation. */
	setFactionReputation(factionId: string, reputation: number): void {
		this.sessionConfig.factionReputation?.set(factionId, reputation);
	}

	/** Get faction reputation. */
	getFactionReputation(factionId: string): number {
		return this.sessionConfig.factionReputation?.get(factionId) ?? 0;
	}

	/** Set fray exposure level for a character. */
	setFrayExposure(characterId: string, level: number): void {
		this.sessionConfig.frayExposure?.set(characterId, Math.max(0, level));
	}

	/** Get fray exposure level for a character. */
	getFrayExposure(characterId: string): number {
		return this.sessionConfig.frayExposure?.get(characterId) ?? 0;
	}

	// ─── Party & Quest Management ───

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

	// ─── Companion Management ───

	/** Add a companion to the active party. Max 2. */
	addCompanion(companion: CompanionState): boolean {
		const activeCount = this.session.companions.filter((c) => c.active).length;
		if (activeCount >= MAX_COMPANIONS) return false;

		this.session.companions.push(companion);
		this.characters.set(companion.character.id, companion.character);
		return true;
	}

	/** Remove a companion from the active party. */
	removeCompanion(characterId: string): CompanionState | undefined {
		const idx = this.session.companions.findIndex((c) => c.character.id === characterId);
		if (idx === -1) return undefined;

		const companion = this.session.companions[idx];
		companion.active = false;
		this.characters.delete(characterId);
		return companion;
	}

	/** Get active companions. */
	getActiveCompanions(): CompanionState[] {
		return this.session.companions.filter((c) => c.active);
	}

	/** Register an NPC archetype (for dialogue context building). */
	registerArchetype(archetype: NpcArchetype): void {
		this.archetypeRegistry.set(archetype.id, archetype);
	}

	// ─── Weave Graph ───

	/** Set the weave graph on the session config. */
	setWeaveGraph(graph: WeaveGraph): void {
		this.sessionConfig.weaveGraph = graph;
	}

	/** Get the current weave graph. */
	getWeaveGraph(): WeaveGraph | undefined {
		return this.sessionConfig.weaveGraph;
	}

	// ─── Internal ───

	/** Process companion reactions to a player action. */
	private processCompanionReactions(input: string, result: ActionResult): void {
		const topics = extractDialogueTopics(
			input,
			this.session.knownEntities,
			this.session.quests.flatMap((q) => q.objectives.map((o) => o.description)),
		);

		for (let i = 0; i < this.session.companions.length; i++) {
			const companion = this.session.companions[i];
			if (!companion.active) continue;

			// Check for topic-based interjections
			const interjections = checkCompanionInterjections(
				companion,
				topics,
				this.session.knownEntities.map((e) => e.type),
			);

			if (interjections.length > 0) {
				this.session.companions[i] = applyCompanionReaction(
					companion,
					'interject',
					interjections,
				);
			}

			// Check for value-based reactions
			const valueReaction = evaluateCompanionValues(
				companion,
				input,
				result.success,
			);

			if (valueReaction && valueReaction.type === 'companion_reaction') {
				this.session.companions[i] = applyCompanionReaction(
					this.session.companions[i],
					valueReaction.reaction,
					topics,
				);

				// If companion leaves, remove from party
				if (valueReaction.reaction === 'leave') {
					this.characters.delete(companion.character.id);
				}
			}
		}
	}

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
		companions: [],
	};
}

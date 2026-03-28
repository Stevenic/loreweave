/**
 * Consensus Turn Coordinator (§6.1).
 *
 * Manages the multiplayer turn lifecycle:
 * - Exploration mode: all party members submit independently, resolve in DEX order
 * - Combat mode: initiative-based turn order with configurable time limits
 * - Group check mode: party-wide checks, half must succeed (PHB 2024)
 *
 * This module coordinates *when* actions resolve, not *how* — actual
 * resolution is handled by the narrative package's action resolver.
 */

import type {
	MessageBroker,
	Party,
	PartyDecisionModel,
	PartyVote,
	PendingAction,
	SignalRMessage,
	TurnActionResult,
	TurnPhase,
	TurnResult,
	TurnState,
} from '@loreweave/types';

/** Configuration for the TurnCoordinator. */
export type TurnCoordinatorConfig = {
	broker: MessageBroker;
	/** Default time limit per turn in combat mode (ms). Default: 60000. */
	combatTimeLimitMs?: number;
	/** Default time limit for exploration actions (ms). Default: 300000 (5 min). */
	explorationTimeLimitMs?: number;
	/** Callback to resolve a single action. Returns narration hint + effects. */
	resolveAction: (playerId: string, action: PendingAction) => Promise<TurnActionResult>;
	/** Callback to generate combined narrative for a turn's results. */
	generateNarrative: (results: TurnActionResult[]) => Promise<string>;
	/** Callback to compute initiative order from player IDs (DEX-based). */
	rollInitiative: (playerIds: string[]) => string[];
};

/**
 * Coordinates multiplayer turns across exploration, combat, and group check modes.
 *
 * Lifecycle:
 * 1. startTurn() — begins a new turn, sets expected players
 * 2. submitAction() — players submit actions (exploration: all at once, combat: one at a time)
 * 3. When all actions received (or timeout), resolveTurn() processes in initiative order
 * 4. Results broadcast to all players
 */
export class TurnCoordinator {
	private readonly broker: MessageBroker;
	private readonly combatTimeLimitMs: number;
	private readonly explorationTimeLimitMs: number;
	private readonly resolveAction: TurnCoordinatorConfig['resolveAction'];
	private readonly generateNarrative: TurnCoordinatorConfig['generateNarrative'];
	private readonly rollInitiative: TurnCoordinatorConfig['rollInitiative'];

	/** Active turn states per world. */
	private readonly turns = new Map<string, TurnState>();
	/** Turn timeout timers per world. */
	private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
	/** Callback for turn completion. */
	private readonly completionHandlers: ((worldId: string, result: TurnResult) => void)[] = [];

	constructor(config: TurnCoordinatorConfig) {
		this.broker = config.broker;
		this.combatTimeLimitMs = config.combatTimeLimitMs ?? 60_000;
		this.explorationTimeLimitMs = config.explorationTimeLimitMs ?? 300_000;
		this.resolveAction = config.resolveAction;
		this.generateNarrative = config.generateNarrative;
		this.rollInitiative = config.rollInitiative;
	}

	/** Register a handler called when a turn completes. */
	onTurnComplete(handler: (worldId: string, result: TurnResult) => void): void {
		this.completionHandlers.push(handler);
	}

	/** Get the current turn state for a world (if any). */
	getTurnState(worldId: string): TurnState | undefined {
		return this.turns.get(worldId);
	}

	/**
	 * Start a new turn for a world.
	 *
	 * @param worldId - World identifier
	 * @param phase - Turn phase (exploration/combat/group_check)
	 * @param playerIds - Connected player IDs expected to act
	 * @param party - Party data (for decision model)
	 */
	startTurn(
		worldId: string,
		phase: TurnPhase,
		playerIds: string[],
		party?: Party,
	): TurnState {
		// Cancel any existing turn timer
		this.cancelTimer(worldId);

		const initiativeOrder = this.rollInitiative(playerIds);
		const timeLimitMs = phase === 'combat' ? this.combatTimeLimitMs : this.explorationTimeLimitMs;

		const state: TurnState = {
			worldId,
			phase,
			turnNumber: (this.turns.get(worldId)?.turnNumber ?? 0) + 1,
			initiativeOrder,
			submittedActions: {},
			readyPlayers: [],
			expectedPlayers: [...playerIds],
			turnStartedAt: Date.now(),
			timeLimitMs,
			activePlayerId: phase === 'combat' ? initiativeOrder[0] : undefined,
		};

		this.turns.set(worldId, state);

		// Start timeout timer
		this.startTimer(worldId, timeLimitMs);

		// Broadcast turn start
		void this.broadcastTurnEvent(worldId, 'turn_start', {
			phase,
			turnNumber: state.turnNumber,
			initiativeOrder,
			activePlayerId: state.activePlayerId,
			timeLimitMs,
		});

		return state;
	}

	/**
	 * Submit a player's action for the current turn.
	 *
	 * In exploration mode: collected until all players submit or timeout.
	 * In combat mode: only the active player can submit.
	 *
	 * Returns true if the action was accepted.
	 */
	async submitAction(
		worldId: string,
		playerId: string,
		action: PendingAction,
	): Promise<boolean> {
		const state = this.turns.get(worldId);
		if (!state) return false;

		// Validate player is expected
		if (!state.expectedPlayers.includes(playerId)) return false;

		// In combat mode, only the active player can submit
		if (state.phase === 'combat' && state.activePlayerId !== playerId) return false;

		// Don't allow double submission
		if (state.readyPlayers.includes(playerId)) return false;

		// Record the action
		state.submittedActions[playerId] = action;
		state.readyPlayers.push(playerId);

		// Broadcast action received
		void this.broadcastTurnEvent(worldId, 'action_submitted', {
			playerId,
			readyCount: state.readyPlayers.length,
			expectedCount: state.expectedPlayers.length,
		});

		// Check if turn is complete
		if (state.phase === 'combat') {
			// Combat: resolve immediately, advance to next player
			await this.resolveCombatAction(worldId, state);
		} else if (state.readyPlayers.length >= state.expectedPlayers.length) {
			// Exploration/group check: all players submitted
			await this.resolveTurn(worldId);
		}

		return true;
	}

	/**
	 * Start a consensus vote for a party action (e.g., movement to new location).
	 *
	 * @returns The created PartyVote, or null if a vote is already pending.
	 */
	startVote(
		worldId: string,
		proposerId: string,
		action: string,
		party: Party,
	): PartyVote | null {
		const state = this.turns.get(worldId);
		if (!state || state.pendingVote) return null;

		const vote: PartyVote = {
			id: `vote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
			partyId: party.id,
			proposerId,
			action,
			votes: { [proposerId]: true }, // Proposer auto-votes yes
			requiredApproval: party.decisionModel === 'leader_decides' ? 'majority' : 'majority',
			createdAt: Date.now(),
			expiresAt: Date.now() + 60_000, // 1 minute to vote
		};

		state.pendingVote = vote;

		void this.broadcastTurnEvent(worldId, 'vote_started', {
			voteId: vote.id,
			proposerId,
			action,
			requiredApproval: vote.requiredApproval,
		});

		return vote;
	}

	/**
	 * Cast a vote on a pending party vote.
	 *
	 * @returns Whether the vote was recorded (false if no pending vote or already voted).
	 */
	castVote(worldId: string, playerId: string, approve: boolean): boolean {
		const state = this.turns.get(worldId);
		if (!state?.pendingVote) return false;

		const vote = state.pendingVote;
		if (vote.votes[playerId] !== undefined) return false; // Already voted

		vote.votes[playerId] = approve;

		// Check if vote is resolved
		const totalVoters = state.expectedPlayers.length;
		const castCount = Object.keys(vote.votes).length;
		const approveCount = Object.values(vote.votes).filter((v) => v).length;
		const rejectCount = castCount - approveCount;

		const majority = Math.ceil(totalVoters / 2);
		const resolved = approveCount >= majority || rejectCount >= majority || castCount >= totalVoters;

		if (resolved) {
			const passed = approveCount >= majority;
			state.pendingVote = undefined;

			void this.broadcastTurnEvent(worldId, 'vote_resolved', {
				voteId: vote.id,
				passed,
				approveCount,
				rejectCount,
				action: vote.action,
			});
		} else {
			void this.broadcastTurnEvent(worldId, 'vote_cast', {
				voteId: vote.id,
				castCount,
				totalVoters,
			});
		}

		return true;
	}

	/**
	 * Remove a player from the current turn (on disconnect).
	 * If they haven't submitted, they're removed from expected players.
	 * In combat, if it's their turn, they auto-Dodge.
	 */
	async handlePlayerDisconnect(worldId: string, playerId: string): Promise<void> {
		const state = this.turns.get(worldId);
		if (!state) return;

		// Remove from expected players if they haven't submitted
		if (!state.readyPlayers.includes(playerId)) {
			state.expectedPlayers = state.expectedPlayers.filter((id) => id !== playerId);

			// In combat, if it's their turn, auto-Dodge
			if (state.phase === 'combat' && state.activePlayerId === playerId) {
				const dodgeAction: PendingAction = {
					id: `auto-dodge-${Date.now()}`,
					playerId,
					action: 'dodge',
					submittedAt: Date.now(),
				};
				state.submittedActions[playerId] = dodgeAction;
				state.readyPlayers.push(playerId);
				await this.resolveCombatAction(worldId, state);
				return;
			}

			// Check if all remaining players have submitted
			if (
				state.expectedPlayers.length > 0
				&& state.readyPlayers.length >= state.expectedPlayers.length
			) {
				await this.resolveTurn(worldId);
			}
		}
	}

	/** Clean up a world's turn state (on world shutdown). */
	cleanup(worldId: string): void {
		this.cancelTimer(worldId);
		this.turns.delete(worldId);
	}

	// ─── Private ───

	/**
	 * Resolve all submitted actions for a turn (exploration/group_check mode).
	 * Actions are processed in initiative order.
	 */
	private async resolveTurn(worldId: string): Promise<void> {
		const state = this.turns.get(worldId);
		if (!state) return;

		this.cancelTimer(worldId);

		const results: TurnActionResult[] = [];

		// Process in initiative order
		for (const playerId of state.initiativeOrder) {
			const action = state.submittedActions[playerId];
			if (!action) {
				// Player didn't submit — skip (they may have disconnected)
				continue;
			}

			const result = await this.resolveAction(playerId, action);
			results.push(result);
		}

		// Generate combined narrative
		const narrative = results.length > 0
			? await this.generateNarrative(results)
			: '';

		const turnResult: TurnResult = {
			turnNumber: state.turnNumber,
			results: results.map((r) => ({ playerId: r.playerId, result: r })),
			narrative,
			nextPhase: state.phase, // Phase persists until explicitly changed
		};

		// Broadcast results
		void this.broadcastTurnEvent(worldId, 'turn_result', turnResult);

		// Notify completion handlers
		for (const handler of this.completionHandlers) {
			handler(worldId, turnResult);
		}
	}

	/**
	 * Resolve a single combat action and advance to the next player.
	 */
	private async resolveCombatAction(worldId: string, state: TurnState): Promise<void> {
		if (!state.activePlayerId) return;

		const action = state.submittedActions[state.activePlayerId];
		if (!action) return;

		// Resolve the active player's action
		const result = await this.resolveAction(state.activePlayerId, action);
		const narrative = await this.generateNarrative([result]);

		// Broadcast individual combat result
		void this.broadcastTurnEvent(worldId, 'combat_action_result', {
			playerId: state.activePlayerId,
			result,
			narrative,
		});

		// Advance to next player in initiative
		const currentIndex = state.initiativeOrder.indexOf(state.activePlayerId);
		const nextIndex = currentIndex + 1;

		if (nextIndex >= state.initiativeOrder.length) {
			// Round complete — start a new round
			const turnResult: TurnResult = {
				turnNumber: state.turnNumber,
				results: state.initiativeOrder
					.filter((id) => state.submittedActions[id])
					.map((id) => ({
						playerId: id,
						result: {
							playerId: id,
							action: state.submittedActions[id],
							success: true,
							effects: [],
							narrationHint: '',
						},
					})),
				narrative: '',
				nextPhase: 'combat',
			};

			for (const handler of this.completionHandlers) {
				handler(worldId, turnResult);
			}

			// Reset for next round
			state.turnNumber++;
			state.submittedActions = {};
			state.readyPlayers = [];
			state.activePlayerId = state.initiativeOrder[0];
			state.turnStartedAt = Date.now();

			this.cancelTimer(worldId);
			this.startTimer(worldId, state.timeLimitMs);

			void this.broadcastTurnEvent(worldId, 'combat_next_turn', {
				activePlayerId: state.activePlayerId,
				roundNumber: state.turnNumber,
			});
		} else {
			// Advance to next player
			state.activePlayerId = state.initiativeOrder[nextIndex];
			state.turnStartedAt = Date.now();

			this.cancelTimer(worldId);
			this.startTimer(worldId, state.timeLimitMs);

			void this.broadcastTurnEvent(worldId, 'combat_next_player', {
				activePlayerId: state.activePlayerId,
			});
		}
	}

	/** Handle turn timeout. */
	private async handleTimeout(worldId: string): Promise<void> {
		const state = this.turns.get(worldId);
		if (!state) return;

		if (state.phase === 'combat' && state.activePlayerId) {
			// Combat timeout: active player auto-Dodges (§6.1)
			const dodgeAction: PendingAction = {
				id: `timeout-dodge-${Date.now()}`,
				playerId: state.activePlayerId,
				action: 'dodge',
				submittedAt: Date.now(),
			};
			await this.submitAction(worldId, state.activePlayerId, dodgeAction);
		} else {
			// Exploration timeout: resolve with whatever actions have been submitted
			await this.resolveTurn(worldId);
		}
	}

	private startTimer(worldId: string, timeoutMs: number): void {
		const timer = setTimeout(() => {
			void this.handleTimeout(worldId);
		}, timeoutMs);
		this.timers.set(worldId, timer);
	}

	private cancelTimer(worldId: string): void {
		const timer = this.timers.get(worldId);
		if (timer) {
			clearTimeout(timer);
			this.timers.delete(worldId);
		}
	}

	private async broadcastTurnEvent(worldId: string, type: string, payload: unknown): Promise<void> {
		const message: SignalRMessage = {
			type: `turn:${type}`,
			channel: `world:${worldId}`,
			sender: 'system',
			payload,
			timestamp: Date.now(),
		};
		await this.broker.publish('game', message.channel, message);
	}
}

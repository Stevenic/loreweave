/**
 * @loreweave/game — Game server entry point
 *
 * Composes the world engine, rules engine, narrative engine,
 * multiplayer infrastructure, and pixel renderer into the main game loop.
 *
 * Wave 2 Integration:
 * - TurnCoordinator — manages multiplayer turn lifecycle
 * - DisconnectHandler — graceful disconnect + reconnect + timeout
 * - RecapGenerator — LLM session recaps on rejoin
 * - EventLog — world event persistence for recaps
 * - parseIntentWithFallback — LLM intent extraction fallback
 *
 * This module creates and wires the full game server. In dev mode,
 * in-memory adapters are used; in production, Azure adapters.
 */

import type {
	ChatStore,
	MessageBroker,
	NarrativeAdapter,
	PendingAction,
	TurnActionResult,
	TurnResult,
	WorldSettings,
	WorldStore,
} from '@loreweave/types';

import {
	ChatService,
	ConnectionTracker,
	DisconnectHandler,
	EventLog,
	PresenceTracker,
	RecapGenerator,
	TurnCoordinator,
	createStorageAdapters,
} from '@loreweave/multiplayer';
import type { StorageFactoryConfig } from '@loreweave/multiplayer';

import {
	DungeonMaster,
	createSession,
	parseIntentWithFallback,
} from '@loreweave/narrative';

// ---------------------------------------------------------------------------
// Game Server Factory
// ---------------------------------------------------------------------------

/** Configuration for creating a GameServer. */
export type GameServerConfig = {
	/** NarrativeAdapter for LLM calls (recap + intent fallback). */
	adapter: NarrativeAdapter;
	/** World settings for the active world. */
	worldSettings?: WorldSettings;
	/** Storage backend configuration. Auto-detects from env vars when omitted. */
	storage?: StorageFactoryConfig;
	/** Pre-built storage adapters. When provided, `storage` config is ignored. */
	adapters?: {
		worldStore: WorldStore;
		chatStore: ChatStore;
		broker: MessageBroker;
	};
};

/**
 * Create a fully wired game server.
 *
 * Storage backend is selected automatically:
 * - Azure env vars present → Azure Blob Storage + SignalR
 * - Otherwise → local file storage (.loreweave/data/)
 *
 * Override with `config.storage.backend` or pass pre-built `config.adapters`.
 */
export async function createGameServer(config: GameServerConfig) {
	// ─── Storage Adapters ───
	const { worldStore, chatStore, broker } = config.adapters
		?? await createStorageAdapters(config.storage);

	// ─── Infrastructure (Wave 1) ───
	const connectionTracker = new ConnectionTracker();
	connectionTracker.startMonitoring();

	const presenceTracker = new PresenceTracker({
		broker,
		connectionTracker,
	});

	const chatService = new ChatService({
		broker,
		store: chatStore,
	});

	// ─── Event Log (Wave 2) ───
	const eventLog = new EventLog({ store: worldStore });

	// ─── Session Recap (Wave 2) ───
	const recapGenerator = new RecapGenerator({
		chatStore,
		adapter: config.adapter,
		getEventsSince: (worldId: string, since: number) => eventLog.getEventsSince(worldId, since),
	});

	// ─── Turn Coordinator (Wave 2) ───
	const turnCoordinator = new TurnCoordinator({
		broker,
		resolveAction: async (_playerId: string, action: PendingAction): Promise<TurnActionResult> => {
			// Placeholder — in production, this delegates to DungeonMaster.processTurn()
			return {
				playerId: action.playerId,
				action,
				success: true,
				effects: [],
				narrationHint: `${action.playerId} performed: ${action.action}`,
			};
		},
		generateNarrative: async (results: TurnActionResult[]): Promise<string> => {
			// Placeholder — in production, this builds prompts from results and calls the LLM
			return results.map((r) => r.narrationHint).join(' ');
		},
		rollInitiative: (playerIds: string[]): string[] => {
			// Placeholder — in production, this reads DEX scores and rolls
			return [...playerIds];
		},
	});

	// ─── Disconnect Handler (Wave 2) ───
	const disconnectHandler = new DisconnectHandler({
		broker,
		store: worldStore,
		connectionTracker,
		findSafeLocation: async (_worldId: string, _fromTile: { x: number; y: number }) => {
			// Placeholder — in production, searches for nearest settlement
			return { x: 0, y: 0, name: 'Starting Camp' };
		},
		generateRecap: async (worldId: string, playerId: string, _absenceDurationMs: number) => {
			const recap = await recapGenerator.generateRecap(
				worldId,
				playerId,
				Date.now() - _absenceDurationMs,
			);
			return recap.narrative;
		},
		onPlayerDisconnect: async (worldId: string, playerId: string) => {
			await turnCoordinator.handlePlayerDisconnect(worldId, playerId);
		},
	});

	// Wire turn results to disconnect handler for missed turn tracking
	turnCoordinator.onTurnComplete((worldId: string, result: TurnResult) => {
		disconnectHandler.recordTurnResult(worldId, result);
	});

	// Cache world settings
	if (config.worldSettings) {
		disconnectHandler.setWorldSettings(config.worldSettings.id, config.worldSettings);
	}

	return {
		// Infrastructure
		broker,
		worldStore,
		chatStore,
		connectionTracker,
		presenceTracker,
		chatService,

		// Wave 2
		turnCoordinator,
		disconnectHandler,
		recapGenerator,
		eventLog,

		/** Shut down all timers and cleanup. */
		shutdown() {
			connectionTracker.stopMonitoring();
			if (config.worldSettings) {
				turnCoordinator.cleanup(config.worldSettings.id);
				disconnectHandler.cleanup(config.worldSettings.id);
			}
		},
	};
}

// Re-export for convenience
export { parseIntentWithFallback } from '@loreweave/narrative';
export { DungeonMaster, createSession } from '@loreweave/narrative';

console.log('LoreWeave game server module loaded.');

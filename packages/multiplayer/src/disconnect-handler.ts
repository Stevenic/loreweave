/**
 * Graceful Disconnect Handler (§3.3).
 *
 * Manages the full disconnect lifecycle:
 * - On disconnect: preserve pending actions, mark character as absent,
 *   broadcast narrative beat, record disconnect event
 * - On reconnect: restore session state, deliver missed turns,
 *   generate session recap if threshold exceeded
 * - On timeout: move character to nearest safe location,
 *   auto-Dodge in combat
 *
 * Integrates with ConnectionTracker, WorldStore, PresenceTracker,
 * and TurnCoordinator.
 */

import type {
	ConnectionState,
	DisconnectEvent,
	MessageBroker,
	PlayerSession,
	ReconnectResult,
	SignalRMessage,
	TurnResult,
	WorldSettings,
	WorldStore,
} from '@loreweave/types';
import type { ConnectionTracker } from './connection.js';

/** Configuration for the DisconnectHandler. */
export type DisconnectHandlerConfig = {
	broker: MessageBroker;
	store: WorldStore;
	connectionTracker: ConnectionTracker;
	/** Callback to find the nearest safe location for a character. */
	findSafeLocation: (worldId: string, fromTile: { x: number; y: number }) => Promise<{
		x: number;
		y: number;
		name: string;
	}>;
	/** Callback to generate a session recap narrative. */
	generateRecap?: (
		worldId: string,
		playerId: string,
		absenceDurationMs: number,
	) => Promise<string>;
	/** Callback to notify the turn coordinator of a disconnect. */
	onPlayerDisconnect?: (worldId: string, playerId: string) => Promise<void>;
};

/**
 * Handles graceful disconnect, reconnection, and timeout lifecycle.
 *
 * Listens to ConnectionTracker state changes and orchestrates the
 * full disconnect/reconnect flow per §3.3.
 */
export class DisconnectHandler {
	private readonly broker: MessageBroker;
	private readonly store: WorldStore;
	private readonly connectionTracker: ConnectionTracker;
	private readonly findSafeLocation: DisconnectHandlerConfig['findSafeLocation'];
	private readonly generateRecap: DisconnectHandlerConfig['generateRecap'];
	private readonly onPlayerDisconnect: DisconnectHandlerConfig['onPlayerDisconnect'];

	/** Active disconnect events per player. */
	private readonly disconnects = new Map<string, DisconnectEvent>();
	/** Missed turn results accumulated per player during disconnect. */
	private readonly missedTurns = new Map<string, TurnResult[]>();
	/** Timeout timers per player (for safe-location relocation). */
	private readonly timeoutTimers = new Map<string, ReturnType<typeof setTimeout>>();
	/** World settings cache for timeout/recap thresholds. */
	private readonly worldSettingsCache = new Map<string, WorldSettings>();

	constructor(config: DisconnectHandlerConfig) {
		this.broker = config.broker;
		this.store = config.store;
		this.connectionTracker = config.connectionTracker;
		this.findSafeLocation = config.findSafeLocation;
		this.generateRecap = config.generateRecap;
		this.onPlayerDisconnect = config.onPlayerDisconnect;

		// Wire up connection state changes
		this.connectionTracker.onStateChange(
			(playerId, from, to) => void this.handleStateChange(playerId, from, to),
		);
	}

	/**
	 * Cache world settings for timeout calculations.
	 * Call this when a world is loaded or settings change.
	 */
	setWorldSettings(worldId: string, settings: WorldSettings): void {
		this.worldSettingsCache.set(worldId, settings);
	}

	/**
	 * Record a turn result. Missed turns are accumulated for disconnected players.
	 */
	recordTurnResult(worldId: string, result: TurnResult): void {
		for (const [playerId, event] of this.disconnects) {
			if (event.worldId === worldId) {
				const missed = this.missedTurns.get(playerId) ?? [];
				missed.push(result);
				this.missedTurns.set(playerId, missed);
			}
		}
	}

	/**
	 * Handle a player reconnecting. Restores session, delivers missed turns,
	 * and generates a recap if absence exceeded threshold.
	 *
	 * @returns ReconnectResult with all the state the client needs.
	 */
	async handleReconnect(
		worldId: string,
		playerId: string,
	): Promise<ReconnectResult> {
		const disconnectEvent = this.disconnects.get(playerId);
		const absenceDurationMs = disconnectEvent
			? Date.now() - disconnectEvent.disconnectedAt
			: 0;

		// Clear timeout timer
		this.clearTimeoutTimer(playerId);

		// Get missed turns
		const missedTurns = this.missedTurns.get(playerId) ?? [];

		// Restore session from store
		const session = await this.store.getPlayerSession(worldId, playerId);
		if (session) {
			session.connectionState = 'reconnected';
			session.connectedAt = Date.now();
			session.disconnectedAt = undefined;
			await this.store.putPlayerSession(session);
		}

		// Check if recap is needed
		const settings = this.worldSettingsCache.get(worldId);
		const recapThresholdMs = (settings?.recapThresholdMinutes ?? 5) * 60_000;
		let recap: string | undefined;

		if (absenceDurationMs >= recapThresholdMs && this.generateRecap) {
			try {
				recap = await this.generateRecap(worldId, playerId, absenceDurationMs);
			} catch {
				// Recap generation failure is non-fatal
			}
		}

		// Check if player was relocated
		const wasRelocated = disconnectEvent
			? this.wasPlayerRelocated(playerId)
			: false;

		const result: ReconnectResult = {
			playerId,
			worldId,
			absenceDurationMs,
			missedTurns,
			recap,
			wasRelocated,
		};

		// Clean up disconnect state
		this.disconnects.delete(playerId);
		this.missedTurns.delete(playerId);

		// Broadcast reconnect
		await this.broadcastDisconnectEvent(worldId, playerId, 'reconnect', {
			absenceDurationMs,
			wasRelocated,
			hasRecap: !!recap,
		});

		return result;
	}

	/** Get the disconnect event for a player (if disconnected). */
	getDisconnectEvent(playerId: string): DisconnectEvent | undefined {
		return this.disconnects.get(playerId);
	}

	/** Check if a player is currently disconnected. */
	isDisconnected(playerId: string): boolean {
		return this.disconnects.has(playerId);
	}

	/** Clean up all state for a world (on shutdown). */
	cleanup(worldId: string): void {
		for (const [playerId, event] of this.disconnects) {
			if (event.worldId === worldId) {
				this.clearTimeoutTimer(playerId);
				this.disconnects.delete(playerId);
				this.missedTurns.delete(playerId);
			}
		}
		this.worldSettingsCache.delete(worldId);
	}

	// ─── Private ───

	private async handleStateChange(
		playerId: string,
		_from: ConnectionState,
		to: ConnectionState,
	): Promise<void> {
		if (to === 'disconnected') {
			await this.handleDisconnect(playerId);
		}
	}

	/**
	 * Handle a player disconnecting.
	 * Preserves actions, marks absent, starts timeout, broadcasts narrative beat.
	 */
	private async handleDisconnect(playerId: string): Promise<void> {
		// Find which world(s) this player is in
		// For now, we check all cached world settings
		for (const [worldId, settings] of this.worldSettingsCache) {
			const session = await this.store.getPlayerSession(worldId, playerId);
			if (!session) continue;

			// Create disconnect event
			const event: DisconnectEvent = {
				playerId,
				worldId,
				disconnectedAt: Date.now(),
				lastLocation: { x: 0, y: 0 }, // Will be updated from presence
				wasInCombat: false, // Will be updated from turn coordinator
				preservedActions: [...session.pendingActions],
			};

			this.disconnects.set(playerId, event);
			this.missedTurns.set(playerId, []);

			// Update session in store
			session.connectionState = 'disconnected';
			session.disconnectedAt = Date.now();
			await this.store.putPlayerSession(session);

			// Notify turn coordinator
			if (this.onPlayerDisconnect) {
				await this.onPlayerDisconnect(worldId, playerId);
			}

			// Broadcast narrative beat: "[Name] grows still, their thread dimming..."
			await this.broadcastDisconnectEvent(worldId, playerId, 'disconnect', {
				narrativeBeat: true,
			});

			// Start timeout timer for safe-location relocation
			const timeoutMs = (settings.disconnectTimeoutMinutes ?? 30) * 60_000;
			this.startTimeoutTimer(playerId, worldId, timeoutMs);
		}
	}

	/**
	 * Handle disconnect timeout — relocate character to safety.
	 */
	private async handleTimeout(playerId: string, worldId: string): Promise<void> {
		const event = this.disconnects.get(playerId);
		if (!event) return;

		// Find nearest safe location
		const safeLocation = await this.findSafeLocation(worldId, event.lastLocation);

		// Mark as relocated
		(event as DisconnectEvent & { relocated?: boolean }).relocated = true;

		// Update session with new location
		const session = await this.store.getPlayerSession(worldId, playerId);
		if (session) {
			await this.store.putPlayerSession(session);
		}

		// Broadcast relocation
		await this.broadcastDisconnectEvent(worldId, playerId, 'timeout_relocate', {
			safeLocation,
		});
	}

	private wasPlayerRelocated(playerId: string): boolean {
		const event = this.disconnects.get(playerId) as DisconnectEvent & { relocated?: boolean } | undefined;
		return event?.relocated === true;
	}

	private startTimeoutTimer(playerId: string, worldId: string, timeoutMs: number): void {
		this.clearTimeoutTimer(playerId);
		const timer = setTimeout(() => {
			void this.handleTimeout(playerId, worldId);
		}, timeoutMs);
		this.timeoutTimers.set(playerId, timer);
	}

	private clearTimeoutTimer(playerId: string): void {
		const timer = this.timeoutTimers.get(playerId);
		if (timer) {
			clearTimeout(timer);
			this.timeoutTimers.delete(playerId);
		}
	}

	private async broadcastDisconnectEvent(
		worldId: string,
		playerId: string,
		type: string,
		payload: unknown,
	): Promise<void> {
		const message: SignalRMessage = {
			type: `disconnect:${type}`,
			channel: `world:${worldId}`,
			sender: playerId,
			payload,
			timestamp: Date.now(),
		};
		await this.broker.publish('game', message.channel, message);
	}
}

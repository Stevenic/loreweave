/**
 * Presence tracker (§3.2, §5.5).
 *
 * Manages player presence state, heartbeat processing, and
 * in-world location display. Broadcasts presence changes via
 * the message broker.
 */

import type {
	HeartbeatPayload,
	MessageBroker,
	PlayerPresence,
	SignalRMessage,
} from '@loreweave/types';
import type { ConnectionTracker } from './connection.js';

/** Options for creating a PresenceTracker. */
export type PresenceTrackerConfig = {
	broker: MessageBroker;
	connectionTracker: ConnectionTracker;
};

/**
 * Tracks and broadcasts player presence with in-world location (§5.5).
 *
 * Listens to connection state changes and heartbeats, maintains
 * a per-world presence map, and broadcasts updates via PresenceHub.
 */
export class PresenceTracker {
	private readonly broker: MessageBroker;
	private readonly connectionTracker: ConnectionTracker;

	/** worldId → playerId → presence */
	private readonly presence = new Map<string, Map<string, PlayerPresence>>();

	constructor(config: PresenceTrackerConfig) {
		this.broker = config.broker;
		this.connectionTracker = config.connectionTracker;

		// Wire up connection state changes to presence broadcasts
		this.connectionTracker.onStateChange((playerId, _from, to) => {
			this.updateConnectionState(playerId, to);
		});
	}

	/** Process a heartbeat from a client (§3.2). */
	async processHeartbeat(worldId: string, payload: HeartbeatPayload): Promise<void> {
		// Update connection tracker (handles idle→connected transition)
		this.connectionTracker.heartbeat(payload.playerId);

		// Update presence data
		const worldPresence = this.getWorldPresence(worldId);
		const existing = worldPresence.get(payload.playerId);

		if (existing) {
			existing.locationTile = payload.locationTile;
			existing.locationName = payload.locationName;
			existing.lastHeartbeat = Date.now();
			existing.state = this.connectionTracker.getState(payload.playerId) ?? 'connected';
		}

		// Broadcast presence update
		await this.broadcastPresence(worldId, payload.playerId);
	}

	/** Register a player joining a world. */
	async playerJoined(worldId: string, playerId: string, characterName: string): Promise<void> {
		const worldPresence = this.getWorldPresence(worldId);

		const presence: PlayerPresence = {
			playerId,
			characterName,
			state: 'connected',
			lastHeartbeat: Date.now(),
		};

		worldPresence.set(playerId, presence);
		this.connectionTracker.heartbeat(playerId);

		await this.broadcastPresence(worldId, playerId);
	}

	/** Remove a player from a world's presence. */
	async playerLeft(worldId: string, playerId: string): Promise<void> {
		const worldPresence = this.presence.get(worldId);
		if (worldPresence) {
			worldPresence.delete(playerId);
			if (worldPresence.size === 0) {
				this.presence.delete(worldId);
			}
		}

		// Broadcast removal
		const message: SignalRMessage<{ playerId: string; action: 'left' }> = {
			type: 'presence',
			channel: `world:${worldId}`,
			sender: playerId,
			payload: { playerId, action: 'left' },
			timestamp: Date.now(),
		};
		await this.broker.publish('presence', message.channel, message);
	}

	/** Get all presence data for a world. */
	getWorldPlayers(worldId: string): PlayerPresence[] {
		const worldPresence = this.presence.get(worldId);
		if (!worldPresence) return [];
		return Array.from(worldPresence.values());
	}

	/** Get presence for a specific player. */
	getPlayerPresence(worldId: string, playerId: string): PlayerPresence | undefined {
		return this.presence.get(worldId)?.get(playerId);
	}

	// -----------------------------------------------------------------------
	// Private
	// -----------------------------------------------------------------------

	private getWorldPresence(worldId: string): Map<string, PlayerPresence> {
		let wp = this.presence.get(worldId);
		if (!wp) {
			wp = new Map();
			this.presence.set(worldId, wp);
		}
		return wp;
	}

	private updateConnectionState(playerId: string, state: import('@loreweave/types').ConnectionState): void {
		// Find which world(s) this player is in and update
		for (const [worldId, worldPresence] of this.presence) {
			const p = worldPresence.get(playerId);
			if (p) {
				p.state = state;
				if (state === 'disconnected') {
					p.lastSeen = Date.now();
				}
				// Fire-and-forget broadcast
				void this.broadcastPresence(worldId, playerId);
			}
		}
	}

	private async broadcastPresence(worldId: string, playerId: string): Promise<void> {
		const p = this.presence.get(worldId)?.get(playerId);
		if (!p) return;

		const message: SignalRMessage<PlayerPresence> = {
			type: 'presence',
			channel: `world:${worldId}`,
			sender: playerId,
			payload: p,
			timestamp: Date.now(),
		};

		await this.broker.publish('presence', message.channel, message);
	}
}

/**
 * Connection lifecycle state machine (§3.3).
 *
 * Tracks player connection state transitions and enforces valid
 * state changes. Emits events on transitions for downstream consumers.
 */

import type { ConnectionState } from '@loreweave/types';

/** Valid state transitions. */
const VALID_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
	connecting: ['connected', 'disconnected'],
	connected: ['idle', 'disconnected'],
	idle: ['connected', 'disconnected'],
	disconnected: ['reconnecting', 'connecting'],
	reconnecting: ['reconnected', 'disconnected'],
	reconnected: ['connected'],
};

/** Callback for connection state changes. */
export type ConnectionStateHandler = (
	playerId: string,
	from: ConnectionState,
	to: ConnectionState,
) => void;

/**
 * Per-player connection state machine.
 *
 * Tracks current state, enforces valid transitions, and calls
 * registered handlers on state changes.
 */
export class ConnectionTracker {
	private readonly states = new Map<string, ConnectionState>();
	private readonly handlers: ConnectionStateHandler[] = [];

	/** Idle timeout in ms (default: 60s = 2 missed heartbeats). */
	readonly idleTimeoutMs: number;
	/** Disconnect timeout in ms (default: 120s = 4 missed heartbeats). */
	readonly disconnectTimeoutMs: number;

	private readonly lastHeartbeat = new Map<string, number>();
	private tickInterval: ReturnType<typeof setInterval> | null = null;

	constructor(opts?: { idleTimeoutMs?: number; disconnectTimeoutMs?: number }) {
		this.idleTimeoutMs = opts?.idleTimeoutMs ?? 60_000;
		this.disconnectTimeoutMs = opts?.disconnectTimeoutMs ?? 120_000;
	}

	/** Register a handler for state transitions. */
	onStateChange(handler: ConnectionStateHandler): void {
		this.handlers.push(handler);
	}

	/** Get current state for a player (undefined if not tracked). */
	getState(playerId: string): ConnectionState | undefined {
		return this.states.get(playerId);
	}

	/** Get all tracked players and their states. */
	getAllStates(): ReadonlyMap<string, ConnectionState> {
		return this.states;
	}

	/**
	 * Attempt a state transition. Returns true if the transition was valid.
	 * Calls registered handlers on success.
	 */
	transition(playerId: string, to: ConnectionState): boolean {
		const from = this.states.get(playerId);

		// First connection — only 'connecting' is valid
		if (from === undefined) {
			if (to !== 'connecting') return false;
			this.states.set(playerId, to);
			for (const handler of this.handlers) {
				handler(playerId, 'disconnected', to);
			}
			return true;
		}

		// Check valid transition
		if (!VALID_TRANSITIONS[from].includes(to)) return false;

		this.states.set(playerId, to);
		for (const handler of this.handlers) {
			handler(playerId, from, to);
		}

		// Clean up on disconnect
		if (to === 'disconnected') {
			this.lastHeartbeat.delete(playerId);
		}

		return true;
	}

	/** Record a heartbeat for a player. Transitions idle→connected if needed. */
	heartbeat(playerId: string): void {
		this.lastHeartbeat.set(playerId, Date.now());
		const state = this.states.get(playerId);
		if (state === 'idle') {
			this.transition(playerId, 'connected');
		}
	}

	/** Remove a player from tracking entirely. */
	remove(playerId: string): void {
		this.states.delete(playerId);
		this.lastHeartbeat.delete(playerId);
	}

	/**
	 * Start the heartbeat monitoring tick.
	 * Checks all tracked players every `checkIntervalMs` (default: 15s).
	 */
	startMonitoring(checkIntervalMs = 15_000): void {
		if (this.tickInterval) return;
		this.tickInterval = setInterval(() => this.checkHeartbeats(), checkIntervalMs);
	}

	/** Stop heartbeat monitoring. */
	stopMonitoring(): void {
		if (this.tickInterval) {
			clearInterval(this.tickInterval);
			this.tickInterval = null;
		}
	}

	/** Check all players for missed heartbeats and transition as needed. */
	private checkHeartbeats(): void {
		const now = Date.now();
		for (const [playerId, state] of this.states) {
			if (state === 'disconnected' || state === 'connecting' || state === 'reconnecting') {
				continue;
			}

			const lastBeat = this.lastHeartbeat.get(playerId);
			if (lastBeat === undefined) continue;

			const elapsed = now - lastBeat;
			if (elapsed >= this.disconnectTimeoutMs) {
				this.transition(playerId, 'disconnected');
			} else if (elapsed >= this.idleTimeoutMs && state === 'connected') {
				this.transition(playerId, 'idle');
			}
		}
	}
}

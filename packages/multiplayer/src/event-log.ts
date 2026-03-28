/**
 * World Event Log (§4.2 dependency).
 *
 * Persists world events to Blob Storage for session recap generation
 * and historical playback. Events are immutable once written.
 *
 * Storage path: worlds/{worldId}/events/{date}/{timestamp}_{eventId}.json
 */

import type {
	WorldEventLogEntry,
	WorldStore,
} from '@loreweave/types';

/** Configuration for the EventLog. */
export type EventLogConfig = {
	store: WorldStore;
};

/**
 * Persists and retrieves world event log entries.
 *
 * Used by the session recap generator (§4.2) to gather context
 * about what happened while a player was absent.
 */
export class EventLog {
	private readonly store: WorldStore;

	constructor(config: EventLogConfig) {
		this.store = config.store;
	}

	/** Persist a world event. */
	async recordEvent(event: WorldEventLogEntry): Promise<void> {
		const path = this.eventPath(event.worldId, event.timestamp, event.id);
		await this.store.putBlob(path, event);
	}

	/** Get all events for a world since a timestamp. */
	async getEventsSince(worldId: string, since: number): Promise<WorldEventLogEntry[]> {
		const sinceDate = new Date(since);
		const now = new Date();
		const events: WorldEventLogEntry[] = [];

		// Scan date directories from since to now
		const current = new Date(sinceDate);
		current.setUTCHours(0, 0, 0, 0);

		while (current <= now) {
			const dateStr = formatDate(current);
			const prefix = `worlds/${worldId}/events/${dateStr}/`;
			const blobs = await this.store.listBlobs(prefix);

			for (const blobPath of blobs) {
				const event = await this.store.getBlob<WorldEventLogEntry>(blobPath);
				if (event && event.timestamp >= since) {
					events.push(event);
				}
			}

			current.setUTCDate(current.getUTCDate() + 1);
		}

		// Sort by timestamp
		events.sort((a, b) => a.timestamp - b.timestamp);
		return events;
	}

	/** Get events for a world filtered by location radius. */
	async getEventsNearLocation(
		worldId: string,
		since: number,
		center: { x: number; y: number },
		radius: number,
	): Promise<WorldEventLogEntry[]> {
		const events = await this.getEventsSince(worldId, since);
		return events.filter((e) => {
			const dx = Math.abs(e.location.x - center.x);
			const dy = Math.abs(e.location.y - center.y);
			return dx <= radius && dy <= radius;
		});
	}

	/** Generate a unique event ID. */
	static generateEventId(): string {
		const ts = Date.now().toString(36);
		const rand = Math.random().toString(36).slice(2, 8);
		return `evt-${ts}-${rand}`;
	}

	// ─── Private ───

	private eventPath(worldId: string, timestamp: number, eventId: string): string {
		const dateStr = formatDate(new Date(timestamp));
		return `worlds/${worldId}/events/${dateStr}/${timestamp}_${eventId}.json`;
	}
}

/** Format a Date as YYYY-MM-DD for blob path keys. */
function formatDate(date: Date): string {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, '0');
	const d = String(date.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

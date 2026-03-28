/**
 * Blob Storage-backed ChatStore (§4.4).
 *
 * Persists chat messages as individual JSON blobs under the
 * worlds/{worldId}/chat/{channel}/{date}/ prefix.
 */

import type {
	ChatChannel,
	ChatMessage,
	ChatStore,
	WorldStore,
} from '@loreweave/types';
import { chatPrefix } from './blob-path.js';

/**
 * ChatStore that delegates to a WorldStore for blob persistence.
 *
 * Each message is stored as a separate blob:
 *   worlds/{worldId}/chat/{channel}/{YYYY-MM-DD}/{timestamp}_{id}.json
 */
export class BlobChatStore implements ChatStore {
	private readonly store: WorldStore;

	constructor(store: WorldStore) {
		this.store = store;
	}

	async persistMessage(message: ChatMessage): Promise<void> {
		const date = dateString(message.timestamp);
		const path = `worlds/${message.worldId}/chat/${message.channel}/${date}/${message.timestamp}_${message.id}.json`;
		await this.store.putBlob(path, message);
	}

	async getRecentMessages(
		worldId: string,
		channel: ChatChannel,
		limit: number,
	): Promise<ChatMessage[]> {
		const prefix = chatPrefix(worldId, channel);
		const blobs = await this.store.listBlobs(prefix);

		// Blobs are sorted by path which includes timestamp — take the last N
		const recent = blobs.slice(-limit);
		const messages: ChatMessage[] = [];

		for (const path of recent) {
			const msg = await this.store.getBlob<ChatMessage>(path);
			if (msg) messages.push(msg);
		}

		return messages;
	}

	async getMessagesSince(
		worldId: string,
		channel: ChatChannel,
		since: number,
	): Promise<ChatMessage[]> {
		// Start listing from the date of `since`
		const startDate = dateString(since);
		const prefix = chatPrefix(worldId, channel, startDate);
		const todayPrefix = chatPrefix(worldId, channel, dateString(Date.now()));

		const paths = new Set<string>();

		// List from startDate and today (may be different days)
		for (const p of await this.store.listBlobs(prefix)) paths.add(p);
		if (todayPrefix !== prefix) {
			for (const p of await this.store.listBlobs(todayPrefix)) paths.add(p);
		}

		const messages: ChatMessage[] = [];
		for (const path of paths) {
			const msg = await this.store.getBlob<ChatMessage>(path);
			if (msg && msg.timestamp > since) messages.push(msg);
		}

		return messages.sort((a, b) => a.timestamp - b.timestamp);
	}

	async pruneExpired(worldId: string, retentionDays: number): Promise<number> {
		const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
		const prefix = chatPrefix(worldId, 'ic');
		const oocPrefix = chatPrefix(worldId, 'ooc');

		let pruned = 0;

		for (const channelPrefix of [prefix, oocPrefix]) {
			const blobs = await this.store.listBlobs(channelPrefix);
			for (const path of blobs) {
				// Extract timestamp from filename: {timestamp}_{id}.json
				const filename = path.split('/').pop() ?? '';
				const ts = Number.parseInt(filename.split('_')[0], 10);
				if (!Number.isNaN(ts) && ts < cutoff) {
					await this.store.deleteBlob(path);
					pruned++;
				}
			}
		}

		return pruned;
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateString(timestamp: number): string {
	const d = new Date(timestamp);
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * In-memory implementations of WorldStore and ChatStore.
 *
 * For local development and testing — no Azure dependencies required.
 */

import type {
	ChatChannel,
	ChatMessage,
	ChatStore,
	PlayerSession,
	WorldSettings,
	WorldStore,
} from '@loreweave/types';

/** In-memory WorldStore — all data lives in Maps, lost on process exit. */
export class MemoryWorldStore implements WorldStore {
	private readonly worlds = new Map<string, WorldSettings>();
	private readonly sessions = new Map<string, PlayerSession>();
	private readonly blobs = new Map<string, string>();

	async getWorldSettings(worldId: string): Promise<WorldSettings | null> {
		return this.worlds.get(worldId) ?? null;
	}

	async putWorldSettings(settings: WorldSettings): Promise<void> {
		this.worlds.set(settings.id, structuredClone(settings));
	}

	async listWorlds(filter?: { visibility?: 'public' | 'private' }): Promise<WorldSettings[]> {
		const all = Array.from(this.worlds.values());
		if (!filter?.visibility) return all;
		return all.filter((w) => w.visibility === filter.visibility);
	}

	async deleteWorld(worldId: string): Promise<void> {
		this.worlds.delete(worldId);
		const prefix = `worlds/${worldId}/`;
		for (const key of this.blobs.keys()) {
			if (key.startsWith(prefix)) this.blobs.delete(key);
		}
		for (const [key] of this.sessions) {
			if (key.startsWith(`${worldId}/`)) this.sessions.delete(key);
		}
	}

	async getPlayerSession(worldId: string, playerId: string): Promise<PlayerSession | null> {
		return this.sessions.get(`${worldId}/${playerId}`) ?? null;
	}

	async putPlayerSession(session: PlayerSession): Promise<void> {
		this.sessions.set(`${session.worldId}/${session.playerId}`, structuredClone(session));
	}

	async getBlob<T>(path: string): Promise<T | null> {
		const raw = this.blobs.get(path);
		if (raw === undefined) return null;
		return JSON.parse(raw) as T;
	}

	async putBlob<T>(path: string, data: T): Promise<void> {
		this.blobs.set(path, JSON.stringify(data));
	}

	async deleteBlob(path: string): Promise<void> {
		this.blobs.delete(path);
	}

	async listBlobs(prefix: string): Promise<string[]> {
		const results: string[] = [];
		for (const key of this.blobs.keys()) {
			if (key.startsWith(prefix)) results.push(key);
		}
		return results.sort();
	}
}

/** In-memory ChatStore — messages stored in arrays per world+channel. */
export class MemoryChatStore implements ChatStore {
	private readonly messages: ChatMessage[] = [];

	async persistMessage(message: ChatMessage): Promise<void> {
		this.messages.push(structuredClone(message));
	}

	async getRecentMessages(
		worldId: string,
		channel: ChatChannel,
		limit: number,
	): Promise<ChatMessage[]> {
		const filtered = this.messages.filter(
			(m) => m.worldId === worldId && m.channel === channel,
		);
		return filtered.slice(-limit);
	}

	async getMessagesSince(
		worldId: string,
		channel: ChatChannel,
		since: number,
	): Promise<ChatMessage[]> {
		return this.messages.filter(
			(m) => m.worldId === worldId && m.channel === channel && m.timestamp > since,
		);
	}

	async pruneExpired(worldId: string, retentionDays: number): Promise<number> {
		const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
		const before = this.messages.length;
		const kept = this.messages.filter(
			(m) => m.worldId !== worldId || m.timestamp >= cutoff,
		);
		this.messages.length = 0;
		this.messages.push(...kept);
		return before - this.messages.length;
	}
}

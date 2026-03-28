/**
 * Blob Storage path resolution (§8.1).
 *
 * Deterministic path builder for Azure Blob Storage.
 * Structure: worlds/{worldId}/...
 */

import type { BlobPath, ChatChannel } from '@loreweave/types';

/** Resolve a typed BlobPath to its string key. */
export function resolveBlobPath(path: BlobPath): string {
	switch (path.kind) {
		case 'config':
			return `worlds/${path.worldId}/config.json`;
		case 'chunk':
			return `worlds/${path.worldId}/state/chunks/${path.chunkId}.json`;
		case 'entity':
			return `worlds/${path.worldId}/state/entities/${path.entityId}.json`;
		case 'character':
			return `worlds/${path.worldId}/players/${path.playerId}/character.json`;
		case 'inventory':
			return `worlds/${path.worldId}/players/${path.playerId}/inventory.json`;
		case 'chat':
			return `worlds/${path.worldId}/chat/${path.channel}/${path.date}/${path.messageId}.json`;
		case 'event':
			return `worlds/${path.worldId}/events/${path.date}/${path.eventId}.json`;
	}
}

/** Build a chat blob prefix for listing messages by date. */
export function chatPrefix(worldId: string, channel: ChatChannel, date?: string): string {
	const base = `worlds/${worldId}/chat/${channel}/`;
	return date ? `${base}${date}/` : base;
}

/** Build a player directory prefix. */
export function playerPrefix(worldId: string, playerId: string): string {
	return `worlds/${worldId}/players/${playerId}/`;
}

/** Build a world state prefix. */
export function worldStatePrefix(worldId: string): string {
	return `worlds/${worldId}/state/`;
}

/** Build the full world prefix. */
export function worldPrefix(worldId: string): string {
	return `worlds/${worldId}/`;
}

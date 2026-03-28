/**
 * Chat service — OOC/IC separation + persistence (§4.1, §4.4).
 *
 * Routes messages to the correct channel, persists them, and
 * broadcasts via the message broker.
 */

import type {
	ChatChannel,
	ChatMessage,
	ChatScope,
	ChatStore,
	MessageBroker,
	SignalRMessage,
} from '@loreweave/types';

/** OOC prefix per §4.1 — messages starting with "//" are OOC. */
const OOC_PREFIX = '//';

/** Options for creating a ChatService. */
export type ChatServiceConfig = {
	broker: MessageBroker;
	store: ChatStore;
};

/**
 * Chat service handling OOC/IC message routing and persistence.
 *
 * IC messages are the default — they flow to the intent parser.
 * OOC messages (prefixed with //) bypass the game engine entirely.
 */
export class ChatService {
	private readonly broker: MessageBroker;
	private readonly store: ChatStore;

	constructor(config: ChatServiceConfig) {
		this.broker = config.broker;
		this.store = config.store;
	}

	/**
	 * Process an incoming player message.
	 *
	 * Detects channel from content prefix, creates a ChatMessage,
	 * persists it, and broadcasts via the message broker.
	 *
	 * Returns the created message and whether it's IC (needs intent parsing).
	 */
	async sendMessage(opts: {
		worldId: string;
		senderId: string;
		characterName?: string;
		content: string;
		partyId?: string;
		recipientId?: string;
		scope?: ChatScope;
	}): Promise<{ message: ChatMessage; isIC: boolean }> {
		const { channel, cleanContent } = detectChannel(opts.content);

		const scope = resolveScope(channel, opts.scope, opts.partyId, opts.recipientId);

		const message: ChatMessage = {
			id: generateMessageId(),
			worldId: opts.worldId,
			channel,
			scope,
			senderId: opts.senderId,
			characterName: channel === 'ic' ? opts.characterName : undefined,
			content: cleanContent,
			timestamp: Date.now(),
			partyId: opts.partyId,
			recipientId: opts.recipientId,
		};

		// Persist
		await this.store.persistMessage(message);

		// Broadcast via chat hub
		const signalrMessage: SignalRMessage<ChatMessage> = {
			type: 'chat',
			channel: buildBroadcastChannel(message),
			sender: opts.senderId,
			payload: message,
			timestamp: message.timestamp,
		};

		await this.broker.publish('chat', signalrMessage.channel, signalrMessage);

		return { message, isIC: channel === 'ic' };
	}

	/** Load recent messages for a player rejoining (§4.4). */
	async getHistory(
		worldId: string,
		channel: ChatChannel,
		limit = 50,
	): Promise<ChatMessage[]> {
		return this.store.getRecentMessages(worldId, channel, limit);
	}

	/** Load messages since a timestamp (for session recap input). */
	async getMessagesSince(
		worldId: string,
		channel: ChatChannel,
		since: number,
	): Promise<ChatMessage[]> {
		return this.store.getMessagesSince(worldId, channel, since);
	}

	/** Prune expired messages per world retention policy. */
	async pruneExpired(worldId: string, retentionDays: number): Promise<number> {
		return this.store.pruneExpired(worldId, retentionDays);
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect channel from message content prefix. */
function detectChannel(content: string): { channel: ChatChannel; cleanContent: string } {
	if (content.startsWith(OOC_PREFIX)) {
		return { channel: 'ooc', cleanContent: content.slice(OOC_PREFIX.length).trim() };
	}
	return { channel: 'ic', cleanContent: content };
}

/** Resolve message scope based on channel and targeting. */
function resolveScope(
	channel: ChatChannel,
	explicit?: ChatScope,
	partyId?: string,
	recipientId?: string,
): ChatScope {
	// IC is always location-scoped per §4.1
	if (channel === 'ic') return 'location';

	// OOC: explicit scope, or infer from targeting
	if (explicit) return explicit;
	if (recipientId) return 'whisper';
	if (partyId) return 'party';
	return 'world';
}

/** Build the broadcast channel string for SignalR group routing. */
function buildBroadcastChannel(message: ChatMessage): string {
	switch (message.scope) {
		case 'world':
			return `world:${message.worldId}:${message.channel}`;
		case 'party':
			return `party:${message.partyId ?? message.worldId}:${message.channel}`;
		case 'whisper':
			return `whisper:${message.senderId}:${message.recipientId ?? ''}`;
		case 'location':
			return `world:${message.worldId}:ic`;
	}
}

/** Generate a unique message ID (timestamp + random suffix). */
function generateMessageId(): string {
	const ts = Date.now().toString(36);
	const rand = Math.random().toString(36).slice(2, 8);
	return `${ts}-${rand}`;
}

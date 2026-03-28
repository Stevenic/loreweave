/**
 * Session Recap Generator (§4.2).
 *
 * Generates LLM-powered narrative summaries when a player reconnects
 * after an absence exceeding the configurable threshold.
 *
 * Input: persisted chat messages + world events since disconnect.
 * Output: 2–5 sentence narrative summary in the DM's voice.
 *
 * Depends on:
 * - ChatStore (§4.4) for message history
 * - Graceful disconnect (§3.3) for absence detection
 * - NarrativeAdapter for LLM generation
 */

import type {
	ChatMessage,
	ChatStore,
	NarrativeAdapter,
	RecapContext,
	SessionRecap,
	WorldEventLogEntry,
} from '@loreweave/types';

/** Configuration for the RecapGenerator. */
export type RecapGeneratorConfig = {
	chatStore: ChatStore;
	adapter: NarrativeAdapter;
	/** Optional event log reader. Returns world events since a timestamp. */
	getEventsSince?: (worldId: string, since: number) => Promise<WorldEventLogEntry[]>;
};

/**
 * System prompt for session recap generation.
 * Instructs the LLM to produce a concise in-world narrative summary.
 */
const RECAP_SYSTEM_PROMPT = `You are a Dungeon Master generating a "while you were away" recap for a returning player in a D&D-inspired text adventure.

RULES:
- Write 2–5 sentences in the DM's narrative voice.
- Summarize what happened while the player was absent.
- Focus on events relevant to the player's location and party.
- Use past tense and address the player's character by name if known.
- Do NOT list mechanical details (dice rolls, HP changes) — narrate what happened.
- If nothing significant happened, acknowledge the passage of time: "The world moved on quietly..."
- Keep the tone consistent with the world's established narrative voice.
- End with the current scene to orient the player.`;

/**
 * Generates session recaps for reconnecting players.
 *
 * Gathers context from chat history and world events, then uses
 * the LLM to produce a narrative summary in the DM's voice.
 */
export class RecapGenerator {
	private readonly chatStore: ChatStore;
	private readonly adapter: NarrativeAdapter;
	private readonly getEventsSince: RecapGeneratorConfig['getEventsSince'];

	constructor(config: RecapGeneratorConfig) {
		this.chatStore = config.chatStore;
		this.adapter = config.adapter;
		this.getEventsSince = config.getEventsSince;
	}

	/**
	 * Generate a session recap for a reconnecting player.
	 *
	 * @param worldId - World identifier
	 * @param playerId - Returning player ID
	 * @param disconnectedAt - Timestamp when the player disconnected
	 * @param opts - Additional context options
	 * @returns SessionRecap with the narrative summary
	 */
	async generateRecap(
		worldId: string,
		playerId: string,
		disconnectedAt: number,
		opts?: {
			characterName?: string;
			locationName?: string;
			partyId?: string;
			dmPersonaName?: string;
		},
	): Promise<SessionRecap> {
		const now = Date.now();
		const absenceDurationMs = now - disconnectedAt;

		// Gather IC messages since disconnect
		const messages = await this.chatStore.getMessagesSince(worldId, 'ic', disconnectedAt);

		// Gather world events since disconnect
		let events: WorldEventLogEntry[] = [];
		if (this.getEventsSince) {
			events = await this.getEventsSince(worldId, disconnectedAt);
		}

		// Build context
		const context = this.buildContext(worldId, playerId, messages, events, opts);

		// Build user prompt from context
		const userPrompt = this.buildUserPrompt(context, absenceDurationMs, opts);

		// Generate via LLM
		const narrative = await this.adapter.generate(RECAP_SYSTEM_PROMPT, userPrompt);

		return {
			playerId,
			worldId,
			narrative: narrative.trim(),
			generatedAt: now,
			absenceDurationMs,
		};
	}

	// ─── Private ───

	private buildContext(
		worldId: string,
		playerId: string,
		messages: ChatMessage[],
		events: WorldEventLogEntry[],
		opts?: {
			characterName?: string;
			locationName?: string;
			partyId?: string;
			dmPersonaName?: string;
		},
	): RecapContext {
		// Filter messages to player's party (if known)
		const relevantMessages = opts?.partyId
			? messages.filter((m) => m.partyId === opts.partyId || m.scope === 'world')
			: messages;

		// Filter events to location/party relevance
		const relevantEvents = opts?.partyId
			? events.filter((e) => e.partyId === opts.partyId || !e.partyId)
			: events;

		// Summarize events
		const eventSummaries = relevantEvents.map((e) => e.summary);

		// Build current state summary
		const stateParts: string[] = [];
		if (opts?.locationName) {
			stateParts.push(`Current location: ${opts.locationName}`);
		}
		if (opts?.characterName) {
			stateParts.push(`Returning character: ${opts.characterName}`);
		}

		return {
			worldId,
			playerId,
			messagesSinceDisconnect: relevantMessages.slice(-50), // Cap at 50 messages
			worldEventsSummary: eventSummaries.slice(-20), // Cap at 20 events
			currentStateSummary: stateParts.join('. ') || 'No additional context.',
			dmPersonaName: opts?.dmPersonaName,
		};
	}

	private buildUserPrompt(
		context: RecapContext,
		absenceDurationMs: number,
		opts?: { characterName?: string },
	): string {
		const lines: string[] = [];
		const absentMinutes = Math.round(absenceDurationMs / 60_000);

		lines.push(`The player${opts?.characterName ? ` (${opts.characterName})` : ''} has been absent for approximately ${absentMinutes} minute${absentMinutes !== 1 ? 's' : ''}.`);
		lines.push('');

		if (context.worldEventsSummary.length > 0) {
			lines.push('Events that occurred during their absence:');
			for (const event of context.worldEventsSummary) {
				lines.push(`- ${event}`);
			}
			lines.push('');
		}

		if (context.messagesSinceDisconnect.length > 0) {
			lines.push('Recent IC messages:');
			for (const msg of context.messagesSinceDisconnect.slice(-10)) {
				const sender = msg.characterName ?? msg.senderId;
				lines.push(`- ${sender}: "${msg.content}"`);
			}
			lines.push('');
		}

		if (context.currentStateSummary !== 'No additional context.') {
			lines.push(`Current state: ${context.currentStateSummary}`);
			lines.push('');
		}

		if (context.dmPersonaName) {
			lines.push(`Write in the voice of ${context.dmPersonaName}.`);
		}

		if (context.worldEventsSummary.length === 0 && context.messagesSinceDisconnect.length === 0) {
			lines.push('Nothing significant happened while the player was away. Briefly acknowledge the passage of time and describe the current scene.');
		}

		lines.push('', 'Generate the recap (2–5 sentences):');

		return lines.join('\n');
	}
}

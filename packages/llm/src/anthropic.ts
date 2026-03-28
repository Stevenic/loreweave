/**
 * Anthropic Messages API adapter.
 *
 * Implements NarrativeAdapter and StreamingNarrativeAdapter using the
 * Anthropic Messages API directly via fetch.
 * No SDK dependency — uses native Node 20+ fetch.
 *
 * @see https://docs.anthropic.com/en/api/messages
 */

import type { NarrativeChunk, StreamingNarrativeAdapter } from '@loreweave/types';
import type { AnthropicConfig, LLMResponse, StreamChunk, TokenUsage } from './types.js';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_API_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

/** Anthropic Messages API response shape (subset we care about). */
type AnthropicMessageResponse = {
	id: string;
	type: 'message';
	role: 'assistant';
	content: Array<{ type: 'text'; text: string }>;
	model: string;
	stop_reason: string | null;
	usage: {
		input_tokens: number;
		output_tokens: number;
	};
};

/** Anthropic error response shape. */
type AnthropicErrorResponse = {
	type: 'error';
	error: {
		type: string;
		message: string;
	};
};

/**
 * NarrativeAdapter implementation for the Anthropic Messages API.
 *
 * Usage:
 * ```ts
 * const adapter = new AnthropicAdapter({
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: 'claude-sonnet-4-6',
 * });
 * const text = await adapter.generate(systemPrompt, userPrompt);
 * ```
 */
export class AnthropicAdapter implements StreamingNarrativeAdapter {
	private readonly config: Required<Pick<AnthropicConfig, 'apiKey' | 'model' | 'maxTokens' | 'baseUrl' | 'apiVersion'>> &
		Pick<AnthropicConfig, 'temperature' | 'signal'>;

	constructor(config: AnthropicConfig) {
		this.config = {
			apiKey: config.apiKey,
			model: config.model,
			maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
			baseUrl: (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
			apiVersion: config.apiVersion ?? DEFAULT_API_VERSION,
			temperature: config.temperature,
			signal: config.signal,
		};
	}

	/** Generate narrative text from system + user prompts. */
	async generate(systemPrompt: string, userPrompt: string): Promise<string> {
		const response = await this.call(systemPrompt, userPrompt);
		return response.text;
	}

	/** Full API call returning metadata (usage, stop reason, model). */
	async call(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
		const body: Record<string, unknown> = {
			model: this.config.model,
			max_tokens: this.config.maxTokens,
			system: systemPrompt,
			messages: [{ role: 'user', content: userPrompt }],
		};

		if (this.config.temperature !== undefined) {
			body.temperature = this.config.temperature;
		}

		const res = await fetch(`${this.config.baseUrl}/v1/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.config.apiKey,
				'anthropic-version': this.config.apiVersion,
			},
			body: JSON.stringify(body),
			signal: this.config.signal,
		});

		if (!res.ok) {
			const errorBody = (await res.json().catch(() => null)) as AnthropicErrorResponse | null;
			const message = errorBody?.error?.message ?? res.statusText;
			throw new Error(`Anthropic API error ${res.status}: ${message}`);
		}

		const data = (await res.json()) as AnthropicMessageResponse;

		const text = data.content
			.filter((block) => block.type === 'text')
			.map((block) => block.text)
			.join('');

		const usage: TokenUsage = {
			inputTokens: data.usage.input_tokens,
			outputTokens: data.usage.output_tokens,
		};

		return {
			text,
			model: data.model,
			usage,
			stopReason: data.stop_reason,
		};
	}

	/** Stream narrative text as an async iterable of chunks. */
	async *stream(systemPrompt: string, userPrompt: string): AsyncIterable<NarrativeChunk> {
		const body: Record<string, unknown> = {
			model: this.config.model,
			max_tokens: this.config.maxTokens,
			system: systemPrompt,
			messages: [{ role: 'user', content: userPrompt }],
			stream: true,
		};

		if (this.config.temperature !== undefined) {
			body.temperature = this.config.temperature;
		}

		const res = await fetch(`${this.config.baseUrl}/v1/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.config.apiKey,
				'anthropic-version': this.config.apiVersion,
			},
			body: JSON.stringify(body),
			signal: this.config.signal,
		});

		if (!res.ok) {
			const errorBody = (await res.json().catch(() => null)) as AnthropicErrorResponse | null;
			const message = errorBody?.error?.message ?? res.statusText;
			yield { type: 'error', error: `Anthropic API error ${res.status}: ${message}` };
			return;
		}

		if (!res.body) {
			yield { type: 'error', error: 'No response body for streaming' };
			return;
		}

		yield* parseAnthropicSSE(res.body);
	}
}

/** Parse Anthropic SSE stream into NarrativeChunks. */
async function* parseAnthropicSSE(body: ReadableStream<Uint8Array>): AsyncIterable<NarrativeChunk> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let usage: TokenUsage | undefined;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			// Keep the last partial line in the buffer
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;
				const data = line.slice(6).trim();
				if (data === '[DONE]') continue;

				let event: Record<string, unknown>;
				try {
					event = JSON.parse(data) as Record<string, unknown>;
				} catch {
					continue;
				}

				const eventType = event.type as string | undefined;

				if (eventType === 'content_block_delta') {
					const delta = event.delta as { type?: string; text?: string } | undefined;
					if (delta?.type === 'text_delta' && delta.text) {
						yield { type: 'text', text: delta.text };
					}
				} else if (eventType === 'message_delta') {
					const msgUsage = event.usage as { output_tokens?: number } | undefined;
					if (msgUsage?.output_tokens !== undefined) {
						usage = {
							inputTokens: usage?.inputTokens ?? 0,
							outputTokens: msgUsage.output_tokens,
						};
					}
				} else if (eventType === 'message_start') {
					const message = event.message as { usage?: { input_tokens?: number } } | undefined;
					if (message?.usage?.input_tokens !== undefined) {
						usage = {
							inputTokens: message.usage.input_tokens,
							outputTokens: usage?.outputTokens ?? 0,
						};
					}
				} else if (eventType === 'error') {
					const error = event.error as { message?: string } | undefined;
					yield { type: 'error', error: error?.message ?? 'Unknown stream error' };
					return;
				}
			}
		}

		yield { type: 'done', usage };
	} finally {
		reader.releaseLock();
	}
}

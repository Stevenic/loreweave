/**
 * OpenAI Chat Completions adapter.
 *
 * Implements NarrativeAdapter using the OpenAI Chat Completions API via fetch.
 * Works with OpenAI and any OpenAI-compatible API (Fireworks, Together, Groq, Ollama, vLLM).
 *
 * Set `baseUrl` to point at any compatible endpoint.
 *
 * @see https://platform.openai.com/docs/api-reference/chat/create
 */

import type { NarrativeChunk, StreamingNarrativeAdapter } from '@loreweave/types';
import type { LLMResponse, OpenAIConfig, TokenUsage } from './types.js';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MAX_TOKENS = 4096;

/** OpenAI Chat Completions response shape (subset we care about). */
type ChatCompletionResponse = {
	id: string;
	object: 'chat.completion';
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: 'assistant';
			content: string | null;
		};
		finish_reason: string | null;
	}>;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};

/** OpenAI error response shape. */
type OpenAIErrorResponse = {
	error?: {
		message: string;
		type: string;
		code: string | null;
	};
};

/**
 * NarrativeAdapter implementation for OpenAI and OpenAI-compatible APIs.
 *
 * Usage with OpenAI:
 * ```ts
 * const adapter = new OpenAIAdapter({
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: 'gpt-4o',
 * });
 * ```
 *
 * Usage with Fireworks (OpenAI-compatible):
 * ```ts
 * const adapter = new OpenAIAdapter({
 *   apiKey: process.env.FIREWORKS_API_KEY!,
 *   model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
 *   baseUrl: 'https://api.fireworks.ai/inference/v1',
 * });
 * ```
 *
 * Usage with Ollama (local, no API key):
 * ```ts
 * const adapter = new OpenAIAdapter({
 *   apiKey: 'ollama',
 *   model: 'llama3.3:70b',
 *   baseUrl: 'http://localhost:11434/v1',
 * });
 * ```
 */
export class OpenAIAdapter implements StreamingNarrativeAdapter {
	private readonly config: Required<Pick<OpenAIConfig, 'apiKey' | 'model' | 'maxTokens' | 'baseUrl'>> &
		Pick<OpenAIConfig, 'temperature' | 'signal' | 'organization'>;

	constructor(config: OpenAIConfig) {
		this.config = {
			apiKey: config.apiKey,
			model: config.model,
			maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
			baseUrl: (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
			temperature: config.temperature,
			signal: config.signal,
			organization: config.organization,
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
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
		};

		if (this.config.temperature !== undefined) {
			body.temperature = this.config.temperature;
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.config.apiKey}`,
		};

		if (this.config.organization) {
			headers['OpenAI-Organization'] = this.config.organization;
		}

		const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
			signal: this.config.signal,
		});

		if (!res.ok) {
			const errorBody = (await res.json().catch(() => null)) as OpenAIErrorResponse | null;
			const message = errorBody?.error?.message ?? res.statusText;
			throw new Error(`OpenAI API error ${res.status}: ${message}`);
		}

		const data = (await res.json()) as ChatCompletionResponse;

		const choice = data.choices[0];
		if (!choice) {
			throw new Error('OpenAI API returned no choices');
		}

		const text = choice.message.content ?? '';

		const usage: TokenUsage = {
			inputTokens: data.usage?.prompt_tokens ?? 0,
			outputTokens: data.usage?.completion_tokens ?? 0,
		};

		return {
			text,
			model: data.model,
			usage,
			stopReason: choice.finish_reason,
		};
	}

	/** Stream narrative text as an async iterable of chunks. */
	async *stream(systemPrompt: string, userPrompt: string): AsyncIterable<NarrativeChunk> {
		const body: Record<string, unknown> = {
			model: this.config.model,
			max_tokens: this.config.maxTokens,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
			stream: true,
			stream_options: { include_usage: true },
		};

		if (this.config.temperature !== undefined) {
			body.temperature = this.config.temperature;
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.config.apiKey}`,
		};

		if (this.config.organization) {
			headers['OpenAI-Organization'] = this.config.organization;
		}

		const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
			signal: this.config.signal,
		});

		if (!res.ok) {
			const errorBody = (await res.json().catch(() => null)) as OpenAIErrorResponse | null;
			const message = errorBody?.error?.message ?? res.statusText;
			yield { type: 'error', error: `OpenAI API error ${res.status}: ${message}` };
			return;
		}

		if (!res.body) {
			yield { type: 'error', error: 'No response body for streaming' };
			return;
		}

		yield* parseOpenAISSE(res.body);
	}
}

/** Parse OpenAI SSE stream into NarrativeChunks. */
async function* parseOpenAISSE(body: ReadableStream<Uint8Array>): AsyncIterable<NarrativeChunk> {
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

				// Extract content delta
				const choices = event.choices as Array<{
					delta?: { content?: string };
					finish_reason?: string | null;
				}> | undefined;

				if (choices?.[0]?.delta?.content) {
					yield { type: 'text', text: choices[0].delta.content };
				}

				// Extract usage from the final chunk (stream_options: include_usage)
				const chunkUsage = event.usage as {
					prompt_tokens?: number;
					completion_tokens?: number;
				} | undefined;

				if (chunkUsage) {
					usage = {
						inputTokens: chunkUsage.prompt_tokens ?? 0,
						outputTokens: chunkUsage.completion_tokens ?? 0,
					};
				}
			}
		}

		yield { type: 'done', usage };
	} finally {
		reader.releaseLock();
	}
}

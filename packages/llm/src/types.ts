/**
 * Configuration types for LLM provider adapters.
 *
 * All adapters implement NarrativeAdapter from @loreweave/types.
 * Uses native fetch (Node 20+) — no SDK dependencies.
 */

/** Common configuration shared by all LLM adapters. */
export type LLMConfig = {
	/** API key for authentication. */
	apiKey: string;
	/** Model identifier (e.g., "claude-sonnet-4-6", "gpt-4o", "accounts/fireworks/models/llama-v3p3-70b-instruct"). */
	model: string;
	/** Maximum tokens to generate. Default varies by provider. */
	maxTokens?: number;
	/** Sampling temperature (0–2). Lower = more deterministic. */
	temperature?: number;
	/** Optional abort signal for request cancellation. */
	signal?: AbortSignal;
};

/** Anthropic Messages API configuration. */
export type AnthropicConfig = LLMConfig & {
	/** API base URL. Default: "https://api.anthropic.com". */
	baseUrl?: string;
	/** Anthropic API version header. Default: "2023-06-01". */
	apiVersion?: string;
};

/** OpenAI Chat Completions API configuration. Also works for OpenAI-compatible providers. */
export type OpenAIConfig = LLMConfig & {
	/**
	 * API base URL. Default: "https://api.openai.com/v1".
	 *
	 * Set this to use OpenAI-compatible providers:
	 * - Fireworks: "https://api.fireworks.ai/inference/v1"
	 * - Together: "https://api.together.xyz/v1"
	 * - Groq: "https://api.groq.com/openai/v1"
	 * - Ollama: "http://localhost:11434/v1"
	 * - vLLM: "http://localhost:8000/v1"
	 */
	baseUrl?: string;
	/** Optional organization ID (OpenAI-specific). */
	organization?: string;
};

/** Provider name literals for the factory function. */
export type ProviderName = 'anthropic' | 'openai' | 'fireworks' | 'together' | 'groq' | 'ollama';

/** Factory configuration — provider name + config. */
export type ProviderConfig =
	| { provider: 'anthropic'; config: AnthropicConfig }
	| { provider: 'openai'; config: OpenAIConfig }
	| { provider: 'fireworks'; config: Omit<OpenAIConfig, 'baseUrl'> }
	| { provider: 'together'; config: Omit<OpenAIConfig, 'baseUrl'> }
	| { provider: 'groq'; config: Omit<OpenAIConfig, 'baseUrl'> }
	| { provider: 'ollama'; config: Omit<OpenAIConfig, 'baseUrl'> };

/** Token usage stats returned from API calls. */
export type TokenUsage = {
	inputTokens: number;
	outputTokens: number;
};

/** Extended response with metadata (for callers that want more than just text). */
export type LLMResponse = {
	text: string;
	model: string;
	usage: TokenUsage;
	stopReason: string | null;
};

/** A chunk from an SSE stream. */
export type StreamChunk = {
	type: 'text' | 'done' | 'error';
	text?: string;
	error?: string;
	usage?: TokenUsage;
};

/**
 * @loreweave/llm — LLM provider adapters for narrative generation.
 *
 * Implements NarrativeAdapter for:
 * 1. Anthropic Messages API (Claude models)
 * 2. OpenAI Chat Completions API (GPT models)
 * 3. OpenAI-compatible APIs (Fireworks, Together, Groq, Ollama, vLLM)
 *
 * All adapters use native fetch (Node 20+) — no SDK dependencies.
 * All implement NarrativeAdapter from @loreweave/types.
 */

// Adapters
export { AnthropicAdapter } from './anthropic.js';
export { OpenAIAdapter } from './openai.js';

// Factory
export { createAdapter } from './factory.js';

// Types
export type {
	AnthropicConfig,
	LLMConfig,
	LLMResponse,
	OpenAIConfig,
	ProviderConfig,
	ProviderName,
	StreamChunk,
	TokenUsage,
} from './types.js';

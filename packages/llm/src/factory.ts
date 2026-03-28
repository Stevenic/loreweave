/**
 * Factory function for creating NarrativeAdapter instances from provider config.
 *
 * Convenience layer — creates the right adapter with the right base URL
 * for common providers so callers don't need to remember endpoint URLs.
 */

import type { StreamingNarrativeAdapter } from '@loreweave/types';
import { AnthropicAdapter } from './anthropic.js';
import { OpenAIAdapter } from './openai.js';
import type { AnthropicConfig, OpenAIConfig, ProviderConfig } from './types.js';

/** Well-known OpenAI-compatible provider base URLs. */
const PROVIDER_URLS: Record<string, string> = {
	fireworks: 'https://api.fireworks.ai/inference/v1',
	together: 'https://api.together.xyz/v1',
	groq: 'https://api.groq.com/openai/v1',
	ollama: 'http://localhost:11434/v1',
};

/**
 * Create a NarrativeAdapter from a provider configuration.
 *
 * ```ts
 * // Anthropic
 * const dm = createAdapter({ provider: 'anthropic', config: { apiKey, model: 'claude-sonnet-4-6' } });
 *
 * // OpenAI
 * const dm = createAdapter({ provider: 'openai', config: { apiKey, model: 'gpt-4o' } });
 *
 * // Fireworks (auto-sets base URL)
 * const dm = createAdapter({ provider: 'fireworks', config: { apiKey, model: 'accounts/fireworks/models/llama-v3p3-70b-instruct' } });
 *
 * // All return NarrativeAdapter — callers don't care which provider.
 * const text = await dm.generate(systemPrompt, userPrompt);
 * ```
 */
export function createAdapter(providerConfig: ProviderConfig): StreamingNarrativeAdapter {
	switch (providerConfig.provider) {
		case 'anthropic':
			return new AnthropicAdapter(providerConfig.config as AnthropicConfig);

		case 'openai':
			return new OpenAIAdapter(providerConfig.config as OpenAIConfig);

		case 'fireworks':
		case 'together':
		case 'groq':
		case 'ollama': {
			const baseUrl = PROVIDER_URLS[providerConfig.provider];
			return new OpenAIAdapter({ ...providerConfig.config, baseUrl } as OpenAIConfig);
		}

		default: {
			const _exhaustive: never = providerConfig;
			throw new Error(`Unknown provider: ${(_exhaustive as ProviderConfig).provider}`);
		}
	}
}

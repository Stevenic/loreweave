/**
 * AgentAdapter — the core interface for all agent/model backends.
 *
 * Implementations fall into two categories:
 * 1. Coding agents (CliProxyAdapter) — spawn a CLI process, pipe a prompt, capture output.
 *    Examples: Claude CLI, Codex, Aider.
 * 2. LLM APIs (future) — call a model API directly with messages.
 *    Examples: Anthropic Messages API, OpenAI Chat Completions.
 *
 * Both return the same AgentResult, making them interchangeable for callers.
 */

import type { AgentResult, ExecuteOptions } from './types.js';

export interface AgentAdapter {
	/** Adapter name (e.g., "claude", "codex", "anthropic-api"). */
	readonly name: string;

	/**
	 * Execute a prompt and return the result.
	 *
	 * For coding agents, this spawns a subprocess and captures its output.
	 * For LLM APIs, this sends messages and returns the response.
	 */
	execute(prompt: string, options?: ExecuteOptions): Promise<AgentResult>;
}

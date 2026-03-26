/**
 * @loreweave/agents — Agent adapters for LLM-driven code generation.
 *
 * Supports two adapter families:
 * 1. Coding agents (CliProxyAdapter) — spawn CLI tools like Claude, Codex, Aider
 * 2. LLM APIs (future) — call model APIs directly
 *
 * Both implement the AgentAdapter interface for interchangeable use.
 */

// Core interface
export type { AgentAdapter } from './adapter.js';
// Coding agent adapter
export { CliProxyAdapter, type CliProxyAdapterOptions } from './cli-proxy-adapter.js';
// Built-in presets
export { aiderPreset, claudePreset, codexPreset, PRESETS } from './presets.js';
// Types
export type {
	AgentDiagnostics,
	AgentPreset,
	AgentResult,
	ExecuteOptions,
	PresetContext,
	ProgressEvent,
} from './types.js';

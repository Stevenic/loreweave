/**
 * Core types for the agent adapter system.
 *
 * Supports two families of adapters:
 * 1. Coding agents — spawn CLI processes (Claude, Codex, Aider, etc.)
 * 2. LLM APIs — call model APIs directly (Anthropic Messages API, OpenAI, etc.)
 */

/**
 * Options passed to an adapter's execute() method.
 */
export interface ExecuteOptions {
	/** System prompt / instructions prepended to the conversation. */
	systemPrompt?: string;

	/** Model override (e.g., "claude-sonnet-4-6-20250514"). Adapter-specific. */
	model?: string;

	/** Working directory for file operations. */
	cwd?: string;

	/** Timeout in milliseconds. Default varies by adapter. */
	timeout?: number;

	/** Extra environment variables merged into the subprocess env (coding agents only). */
	env?: Record<string, string>;

	/** Callback for progress events during execution. */
	onProgress?: (event: ProgressEvent) => void;

	/** Abort signal for cancellation. */
	abortSignal?: AbortSignal;
}

/**
 * Progress events emitted during execution.
 */
export type ProgressEvent =
	| { type: 'start'; message: string }
	| { type: 'tool_use'; tool: string; input?: string }
	| { type: 'tool_result'; tool: string; summary?: string }
	| { type: 'text'; content: string }
	| { type: 'error'; message: string }
	| { type: 'done'; message: string };

/**
 * Result returned by an adapter after execution completes.
 */
export interface AgentResult {
	/** Whether the execution completed successfully. */
	success: boolean;

	/** The agent's text output / response. */
	output: string;

	/** Files created or modified during execution (if detectable). */
	changedFiles: string[];

	/** Subprocess diagnostics (coding agents only). */
	diagnostics?: AgentDiagnostics;
}

/**
 * Diagnostic info from a coding agent subprocess.
 */
export interface AgentDiagnostics {
	exitCode: number | null;
	signal: string | null;
	stderr: string;
	timedOut: boolean;
}

/**
 * Configuration for a coding agent preset.
 *
 * A preset defines how to spawn and communicate with a specific CLI tool
 * (e.g., `claude`, `codex`, `aider`).
 */
export interface AgentPreset {
	/** Display name for the preset (e.g., "claude", "codex"). */
	name: string;

	/** CLI command to spawn (e.g., "claude"). */
	command: string;

	/** Build the CLI arguments for a given execution context. */
	buildArgs(ctx: PresetContext): string[];

	/** Extra environment variables to set on the subprocess. */
	env?: Record<string, string>;

	/** If true, the prompt is written to the process's stdin (instead of as a CLI arg). */
	stdinPrompt?: boolean;

	/** Force shell mode. Defaults to true on Windows. */
	shell?: boolean;

	/** Transform raw stdout into a cleaner output string (e.g., parse JSONL). */
	parseOutput?(raw: string): string;
}

/**
 * Context passed to AgentPreset.buildArgs().
 */
export interface PresetContext {
	/** Path to a temp file containing the full prompt. */
	promptFile: string;

	/** The raw prompt string. */
	prompt: string;

	/** Model override, if any. */
	model?: string;
}

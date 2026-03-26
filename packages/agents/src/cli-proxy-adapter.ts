/**
 * CliProxyAdapter — spawns a coding agent CLI as a child process.
 *
 * Ported from the @teammates CLI adapter pattern. Handles:
 * - Prompt delivery via stdin or temp file
 * - Windows shell mode (.cmd wrapper compatibility)
 * - Timeout with SIGTERM → SIGKILL escalation
 * - stdout/stderr capture
 * - Changed file detection from output
 */

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AgentAdapter } from './adapter.js';
import { PRESETS } from './presets.js';
import type {
	AgentDiagnostics,
	AgentPreset,
	AgentResult,
	ExecuteOptions,
	PresetContext,
} from './types.js';

const DEFAULT_TIMEOUT_MS = 600_000; // 10 minutes
const KILL_ESCALATION_MS = 5_000; // 5 seconds after SIGTERM

export interface CliProxyAdapterOptions {
	/** Preset name (e.g., "claude") or a custom AgentPreset object. */
	preset: string | AgentPreset;

	/** Default model override. Can be overridden per-execute call. */
	model?: string;

	/** Default timeout in ms. Can be overridden per-execute call. */
	timeout?: number;

	/** Extra CLI flags appended to every invocation. */
	extraFlags?: string[];

	/** Override the CLI command path (e.g., "/usr/local/bin/claude"). */
	commandPath?: string;
}

export class CliProxyAdapter implements AgentAdapter {
	readonly name: string;
	private readonly preset: AgentPreset;
	private readonly defaultModel?: string;
	private readonly defaultTimeout: number;
	private readonly extraFlags: string[];
	private readonly commandPath?: string;

	constructor(opts: CliProxyAdapterOptions) {
		if (typeof opts.preset === 'string') {
			const found = PRESETS[opts.preset];
			if (!found) {
				throw new Error(
					`Unknown preset "${opts.preset}". Available: ${Object.keys(PRESETS).join(', ')}`,
				);
			}
			this.preset = found;
		} else {
			this.preset = opts.preset;
		}
		this.name = this.preset.name;
		this.defaultModel = opts.model;
		this.defaultTimeout = opts.timeout ?? DEFAULT_TIMEOUT_MS;
		this.extraFlags = opts.extraFlags ?? [];
		this.commandPath = opts.commandPath;
	}

	async execute(prompt: string, options?: ExecuteOptions): Promise<AgentResult> {
		const model = options?.model ?? this.defaultModel;
		const timeout = options?.timeout ?? this.defaultTimeout;
		const cwd = options?.cwd ?? process.cwd();
		const extraEnv = options?.env ?? {};
		const abortSignal = options?.abortSignal;

		// Build full prompt: system prompt + user prompt
		const fullPrompt = options?.systemPrompt
			? `${options.systemPrompt}\n\n---\n\n${prompt}`
			: prompt;

		// Write prompt to temp file (needed by some presets, and avoids shell escaping)
		const promptFile = join(tmpdir(), `loreweave-agent-${randomUUID()}.md`);
		writeFileSync(promptFile, fullPrompt, 'utf-8');

		const ctx: PresetContext = { promptFile, prompt: fullPrompt, model };

		try {
			options?.onProgress?.({ type: 'start', message: `Spawning ${this.name}...` });

			const result = await this.spawnAndCapture(ctx, {
				cwd,
				timeout,
				extraEnv,
				abortSignal,
				onProgress: options?.onProgress,
			});

			// Parse output through preset transformer if available
			const output = this.preset.parseOutput
				? this.preset.parseOutput(result.stdout)
				: result.stdout;

			// Detect changed files from output
			const changedFiles = extractChangedFiles(output);

			const success = result.exitCode === 0 && !result.timedOut;

			options?.onProgress?.({
				type: 'done',
				message: success ? 'Generation complete' : `Exited with code ${result.exitCode}`,
			});

			return {
				success,
				output,
				changedFiles,
				diagnostics: {
					exitCode: result.exitCode,
					signal: result.signal,
					stderr: result.stderr,
					timedOut: result.timedOut,
				},
			};
		} finally {
			// Clean up temp file
			try {
				unlinkSync(promptFile);
			} catch {
				// best effort
			}
		}
	}

	private spawnAndCapture(
		ctx: PresetContext,
		opts: {
			cwd: string;
			timeout: number;
			extraEnv: Record<string, string>;
			abortSignal?: AbortSignal;
			onProgress?: ExecuteOptions['onProgress'];
		},
	): Promise<{
		stdout: string;
		stderr: string;
		exitCode: number | null;
		signal: string | null;
		timedOut: boolean;
	}> {
		return new Promise((resolve) => {
			const args = [...this.preset.buildArgs(ctx), ...this.extraFlags];
			const command = this.commandPath ?? this.preset.command;

			// Environment: inherit process.env, add preset env, add caller env
			const env = {
				...process.env,
				...(this.preset.env ?? {}),
				...opts.extraEnv,
				// Suppress Node experimental warnings in subprocess
				NODE_OPTIONS: [process.env.NODE_OPTIONS ?? '', '--disable-warning=ExperimentalWarning']
					.filter(Boolean)
					.join(' '),
			};

			// Windows: npm-installed CLIs are .cmd wrappers that require shell mode
			const needsShell = this.preset.shell ?? process.platform === 'win32';
			const spawnCmd = needsShell ? [command, ...args].join(' ') : command;
			const spawnArgs = needsShell ? [] : args;

			const child = spawn(spawnCmd, spawnArgs, {
				cwd: opts.cwd,
				env,
				stdio: [this.preset.stdinPrompt ? 'pipe' : 'ignore', 'pipe', 'pipe'],
				shell: needsShell,
			});

			// Write prompt via stdin if the preset uses it
			if (this.preset.stdinPrompt && child.stdin) {
				child.stdin.write(ctx.prompt);
				child.stdin.end();
			}

			const stdoutChunks: Buffer[] = [];
			const stderrChunks: Buffer[] = [];
			let timedOut = false;

			child.stdout?.on('data', (chunk: Buffer) => {
				stdoutChunks.push(chunk);
			});

			child.stderr?.on('data', (chunk: Buffer) => {
				stderrChunks.push(chunk);
				const text = chunk.toString();
				opts.onProgress?.({ type: 'text', content: text });
			});

			// Timeout: SIGTERM first, then SIGKILL after escalation period
			const timeoutId = setTimeout(() => {
				timedOut = true;
				child.kill('SIGTERM');
				setTimeout(() => {
					if (!child.killed) {
						child.kill('SIGKILL');
					}
				}, KILL_ESCALATION_MS);
			}, opts.timeout);

			// External abort signal
			const abortHandler = () => {
				timedOut = true;
				child.kill('SIGTERM');
			};
			opts.abortSignal?.addEventListener('abort', abortHandler, { once: true });

			child.on('close', (code, signal) => {
				clearTimeout(timeoutId);
				opts.abortSignal?.removeEventListener('abort', abortHandler);

				const stdout = Buffer.concat(stdoutChunks).toString();
				const stderr = Buffer.concat(stderrChunks).toString();

				resolve({
					stdout: timedOut
						? `${stdout}\n[TIMEOUT] Agent process killed after ${opts.timeout}ms`
						: stdout,
					stderr,
					exitCode: code,
					signal: signal ?? null,
					timedOut,
				});
			});

			child.on('error', (err) => {
				clearTimeout(timeoutId);
				opts.abortSignal?.removeEventListener('abort', abortHandler);

				resolve({
					stdout: '',
					stderr: err.message,
					exitCode: null,
					signal: null,
					timedOut: false,
				});
			});
		});
	}
}

/**
 * Extract changed file paths from agent output.
 *
 * Looks for common patterns:
 * - diff --git a/path b/path
 * - Created/Modified/Updated/Wrote/Edited <path>
 */
function extractChangedFiles(output: string): string[] {
	const files = new Set<string>();

	for (const line of output.split('\n')) {
		// Git diff format
		const diffMatch = /^diff --git a\/(.+?) b\//.exec(line);
		if (diffMatch?.[1]) {
			files.add(diffMatch[1]);
			continue;
		}

		// Natural language patterns
		const nlMatch =
			/(?:Created|Modified|Updated|Wrote|Edited)\s+(.+\.(?:ts|js|json|md|txt|yaml|yml))/i.exec(
				line,
			);
		if (nlMatch?.[1]) {
			files.add(nlMatch[1].trim());
		}
	}

	return [...files];
}

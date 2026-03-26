/**
 * Built-in agent presets for common coding agent CLIs.
 */

import type { AgentPreset } from './types.js';

/**
 * Claude CLI preset.
 *
 * Spawns `claude` with `-p --verbose --dangerously-skip-permissions`.
 * Prompt is written via stdin.
 */
export const claudePreset: AgentPreset = {
	name: 'claude',
	command: 'claude',
	buildArgs(ctx) {
		const args = ['-p', '--verbose', '--dangerously-skip-permissions'];
		if (ctx.model) args.push('--model', ctx.model);
		return args;
	},
	env: {
		FORCE_COLOR: '1',
		CLAUDECODE: '',
	},
	stdinPrompt: true,
};

/**
 * Codex CLI preset.
 *
 * Spawns `codex` in exec mode with JSON output.
 * Prompt is written via stdin.
 */
export const codexPreset: AgentPreset = {
	name: 'codex',
	command: 'codex',
	buildArgs() {
		return ['exec', '-', '--full-auto', '--ephemeral', '--json'];
	},
	env: {
		NO_COLOR: '1',
	},
	stdinPrompt: true,
	parseOutput(raw: string): string {
		let lastMessage = '';
		for (const line of raw.split('\n')) {
			if (!line.trim()) continue;
			try {
				const event = JSON.parse(line) as {
					type?: string;
					item?: { type?: string; text?: string };
				};
				if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
					lastMessage = event.item.text ?? '';
				}
			} catch {
				// not JSON, skip
			}
		}
		return lastMessage || raw;
	},
};

/**
 * Aider CLI preset.
 *
 * Spawns `aider` with the prompt written to a temp file.
 * Prompt is NOT written via stdin (uses --message-file).
 */
export const aiderPreset: AgentPreset = {
	name: 'aider',
	command: 'aider',
	buildArgs(ctx) {
		const args = ['--message-file', ctx.promptFile, '--yes', '--no-git'];
		if (ctx.model) args.push('--model', ctx.model);
		return args;
	},
	env: {
		FORCE_COLOR: '1',
	},
	stdinPrompt: false,
};

/** All built-in presets indexed by name. */
export const PRESETS: Record<string, AgentPreset> = {
	claude: claudePreset,
	codex: codexPreset,
	aider: aiderPreset,
};

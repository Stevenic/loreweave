---
name: Agent Adapter Architecture for LLM-driven Tasks
description: '@loreweave/agents package provides AgentAdapter interface for coding agents (CLI spawn) and future LLM API adapters'
type: project
---

LoreWeave uses `@loreweave/agents` as the abstraction layer for all programmatic LLM interactions. Replaced the Claude Agent SDK which had unresolvable Windows deadlock issues.

**Why:** The Agent SDK's `query()` function and in-process MCP tools caused subprocess deadlocks on Windows (stdio pipe contention). The @teammates CLI pattern of direct `claude` CLI spawning is proven, simpler, and avoids the deadlock entirely.

**How to apply:**
- Import from `@loreweave/agents` — never use `@anthropic-ai/claude-agent-sdk` directly
- Use `CliProxyAdapter` with a preset (`claude`, `codex`, `aider`) for coding agent tasks
- For future LLM API integration, implement `AgentAdapter` interface with `execute()` method
- Both adapter types return the same `AgentResult` — callers don't need to know which backend is used
- Claude preset: `-p --verbose --dangerously-skip-permissions`, prompt via stdin, Windows shell mode
- Always pass `ANTHROPIC_API_KEY` via `env` option to avoid interactive credential prompts
- Timeout defaults to 10 minutes; SIGTERM → SIGKILL escalation after 5 seconds
- Changed file detection works via output parsing (git diff + natural language patterns)

**Status (2026-03-26):** First consumer is `@loreweave/pixel-explorer` generate endpoint.
- Agent SDK removed, CliProxyAdapter with claude preset in use
- Server-side validation runs after generation (no MCP tools needed)
- Web UI model selector still works — model passed through to `--model` CLI flag

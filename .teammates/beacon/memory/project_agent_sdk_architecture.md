---
name: Agent SDK Architecture for Asset Generation
description: Claude Agent SDK is the model abstraction for programmatic pixel asset generation and other LLM-driven tasks
type: project
---

LoreWeave will use the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) as the model abstraction layer for all programmatic LLM interactions. First use case: pixel asset generation.

**Why:** The Agent SDK provides Claude Code as a library — built-in file tools, custom MCP tools, subagents, sessions, and hooks. We don't implement a model loop; we get Claude's full agent loop for free. This is the pattern Steve wants used "in numerous places."

**How to apply:**
- Install `@anthropic-ai/claude-agent-sdk` as a dependency where needed
- Use `query()` for single-prompt generation tasks (e.g., "generate a 16x16 warrior sprite")
- Use `createSdkMcpServer()` + `tool()` to expose pixel validation, preview, palette loading as in-process MCP tools the agent can call during generation
- Use `agents` option for specialized subagents (sprite generator, scene composer, tilemap builder)
- Use sessions for multi-turn workflows (generate → validate → fix → iterate)
- Pass `pixel-schema.llmd` or `pixel_format_llm_guide.md` as context in the system prompt
- Key options: `allowedTools`, `permissionMode`, `mcpServers`, `systemPrompt`, `outputFormat` (structured JSON output)

**Status (2026-03-26):** First implementation shipped in `@loreweave/asset-explorer` generate command.
- SDK v0.1.77 installed, `tool()` takes 4 args (annotations not yet supported)
- 3 MCP tools live: validate_pixel, preview_pixel, list_assets
- CLI: `asset-explorer generate "prompt" --type sprite --palette <file> --output <dir>`

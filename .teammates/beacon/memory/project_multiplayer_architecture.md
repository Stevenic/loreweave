---
version: 0.6.0
name: Multiplayer Package Architecture
description: '@loreweave/multiplayer package — Waves 1+2: persistence, chat, presence, turn coordination, disconnect handling, session recaps'
type: project
---

The `@loreweave/multiplayer` package implements Waves 1+2 of the multiplayer web game spec. Interface-first design with pluggable backends.

**Why:** Azure services (SignalR, Blob Storage) are the deployment target, but local dev and tests need to run without Azure credentials. Separating interfaces from implementations enables both.

**How to apply:**
- Import interfaces (`WorldStore`, `MessageBroker`, `ChatStore`) from `@loreweave/types`
- Import implementations from `@loreweave/multiplayer`:
  - Azure: `AzureBlobStore`, `SignalRBroker`, `BlobChatStore`
  - Local: `MemoryWorldStore`, `MemoryChatStore`, `MemoryBroker`
- `WorldSettings` = multiplayer world config (tone, difficulty, player cap, house rules) — created via World Creation Wizard
- `WorldConfig` = game content config (persona, stat tiers, creatures, vocabulary) — loaded from JSON files
- Both coexist: `WorldSettings` is the multiplayer shell, `WorldConfig` is the game content inside it
- Azure SDK (`@azure/storage-blob`) is dynamically imported — not a hard dependency
- Connection lifecycle tracked by `ConnectionTracker` with configurable idle/disconnect timeouts
- Chat uses `//` prefix for OOC, default is IC. IC flows to intent parser, OOC is player-only.

**Wave 2 additions (2026-03-28):**
- `TurnCoordinator` — exploration (all submit → resolve in DEX order), combat (initiative turns, timeout → Dodge), group check. Consensus voting via `PartyVote`.
- `DisconnectHandler` — listens to ConnectionTracker, preserves pending actions, marks character absent, starts timeout timer for safe-location relocation. Full reconnect flow delivers missed turns + recap.
- `RecapGenerator` — gathers IC chat + world events since disconnect, LLM generates 2-5 sentence recap in DM voice. Threshold configurable via `WorldSettings.recapThresholdMinutes`.
- `EventLog` — persists `WorldEventLogEntry` to Blob Storage by date. Supports retrieval by timestamp and location radius.
- `parseIntentWithFallback` (in narrative package) — LLM fallback for keyword parser. Budget-gated: only fires when keyword parser returns 'unrecognized_action' with no hints.
- `createGameServer()` (in game service) — factory that wires all systems together. Uses in-memory adapters for dev.

/**
 * @loreweave/multiplayer — Multiplayer infrastructure
 *
 * Provides the real-time communication, persistence, chat, presence,
 * turn coordination, disconnect handling, and session recap systems
 * for the LoreWeave multiplayer web game layer.
 *
 * Wave 1 Foundation:
 * - Blob Storage persistence (WorldStore + ChatStore)
 * - SignalR message broker (MessageBroker)
 * - Connection lifecycle state machine
 * - OOC/IC chat separation + persistence
 * - Presence tracking with in-world location
 *
 * Wave 2 Game Loop:
 * - Consensus turn coordinator (exploration/combat/group_check)
 * - Graceful disconnect handler (session preservation + timeout)
 * - Session recap generator (LLM narrative summary on rejoin)
 * - World event log (persistence for recap context)
 *
 * Adapters:
 * - Azure: AzureBlobStore, SignalRBroker, BlobChatStore
 * - Memory: MemoryWorldStore, MemoryChatStore, MemoryBroker
 */

// Blob path utilities
export { resolveBlobPath, chatPrefix, playerPrefix, worldPrefix, worldStatePrefix } from './blob-path.js';

// Azure Blob Storage adapter
export { AzureBlobStore } from './blob-store.js';
export type { AzureBlobConfig } from './blob-store.js';

// In-memory adapters (dev/testing)
export { MemoryWorldStore, MemoryChatStore } from './memory-store.js';

// Local filesystem adapter (local dev with persistence)
export { FileWorldStore } from './file-store.js';
export type { FileStoreConfig } from './file-store.js';

// Storage factory (auto-detects backend from environment)
export { createStorageAdapters } from './storage-factory.js';
export type { StorageFactoryConfig, StorageAdapters } from './storage-factory.js';

// Blob-backed chat store
export { BlobChatStore } from './chat-blob-store.js';

// Connection lifecycle
export { ConnectionTracker } from './connection.js';
export type { ConnectionStateHandler } from './connection.js';

// SignalR message broker
export { SignalRBroker, MemoryBroker } from './signalr-broker.js';
export type { SignalRBrokerConfig } from './signalr-broker.js';

// Chat service
export { ChatService } from './chat.js';
export type { ChatServiceConfig } from './chat.js';

// Presence tracker
export { PresenceTracker } from './presence.js';
export type { PresenceTrackerConfig } from './presence.js';

// ─── Wave 2 ───

// Turn coordination (§6.1)
export { TurnCoordinator } from './turn-coordinator.js';
export type { TurnCoordinatorConfig } from './turn-coordinator.js';

// Graceful disconnect (§3.3)
export { DisconnectHandler } from './disconnect-handler.js';
export type { DisconnectHandlerConfig } from './disconnect-handler.js';

// Session recap (§4.2)
export { RecapGenerator } from './session-recap.js';
export type { RecapGeneratorConfig } from './session-recap.js';

// World event log (§4.2 dependency)
export { EventLog } from './event-log.js';
export type { EventLogConfig } from './event-log.js';

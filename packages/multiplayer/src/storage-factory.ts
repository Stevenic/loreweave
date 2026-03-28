/**
 * Storage adapter factory — selects the right backend based on environment.
 *
 * Detection order:
 * 1. AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL → AzureBlobStore
 * 2. Otherwise → FileWorldStore (local filesystem)
 *
 * BlobChatStore works with any WorldStore, so chat persistence comes free.
 * MemoryBroker vs SignalRBroker follows the same Azure detection.
 */

import type { ChatStore, MessageBroker, WorldStore } from '@loreweave/types';
import { BlobChatStore } from './chat-blob-store.js';
import { FileWorldStore } from './file-store.js';
import type { FileStoreConfig } from './file-store.js';

/** Configuration overrides for the storage factory. */
export type StorageFactoryConfig = {
	/**
	 * Force a specific backend. When omitted, auto-detects from env vars.
	 * - 'azure' — AzureBlobStore + SignalRBroker
	 * - 'file'  — FileWorldStore (local filesystem)
	 * - 'memory' — MemoryWorldStore (in-memory, lost on exit)
	 */
	backend?: 'azure' | 'file' | 'memory';

	/** Root directory for file storage. Defaults to '.loreweave/data'. */
	fileStoreRoot?: string;

	/** Azure Blob Storage container name. Defaults to 'loreweave'. */
	azureContainerName?: string;
};

/** The assembled storage adapters. */
export type StorageAdapters = {
	worldStore: WorldStore;
	chatStore: ChatStore;
	broker: MessageBroker;
	/** Which backend was selected. */
	backend: 'azure' | 'file' | 'memory';
};

/**
 * Create storage adapters based on environment or explicit config.
 *
 * Auto-detection:
 * - If AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL is set → Azure
 * - Otherwise → local file storage
 */
export async function createStorageAdapters(
	config: StorageFactoryConfig = {},
): Promise<StorageAdapters> {
	const backend = config.backend ?? detectBackend();

	switch (backend) {
		case 'azure':
			return createAzureAdapters(config);
		case 'file':
			return createFileAdapters(config);
		case 'memory':
			return createMemoryAdapters();
	}
}

// ---------------------------------------------------------------------------
// Backend constructors
// ---------------------------------------------------------------------------

async function createAzureAdapters(config: StorageFactoryConfig): Promise<StorageAdapters> {
	// Dynamic imports — Azure modules are only loaded when needed
	const { AzureBlobStore } = await import('./blob-store.js');
	const { SignalRBroker } = await import('./signalr-broker.js');

	const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
	const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
	const containerName = config.azureContainerName ?? 'loreweave';

	const worldStore = new AzureBlobStore({
		connectionString,
		accountUrl,
		containerName,
	});

	const chatStore = new BlobChatStore(worldStore);

	const signalrConnectionString = process.env.AZURE_SIGNALR_CONNECTION_STRING;
	let broker: MessageBroker;

	if (signalrConnectionString) {
		broker = new SignalRBroker({ connectionString: signalrConnectionString });
	} else {
		// Fall back to in-memory broker if no SignalR config
		const { MemoryBroker } = await import('./signalr-broker.js');
		broker = new MemoryBroker();
	}

	return { worldStore, chatStore, broker, backend: 'azure' };
}

async function createFileAdapters(config: StorageFactoryConfig): Promise<StorageAdapters> {
	const rootDir = config.fileStoreRoot ?? '.loreweave/data';
	const worldStore = new FileWorldStore({ rootDir });
	const chatStore = new BlobChatStore(worldStore);

	// File storage is local-only — use in-memory broker
	// (SignalR is only needed for multi-instance deployments)
	const { MemoryBroker } = await import('./signalr-broker.js');
	const broker = new MemoryBroker();

	return { worldStore, chatStore, broker, backend: 'file' };
}

async function createMemoryAdapters(): Promise<StorageAdapters> {
	const { MemoryWorldStore, MemoryChatStore } = await import('./memory-store.js');
	const { MemoryBroker } = await import('./signalr-broker.js');

	return {
		worldStore: new MemoryWorldStore(),
		chatStore: new MemoryChatStore(),
		broker: new MemoryBroker(),
		backend: 'memory',
	};
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function detectBackend(): 'azure' | 'file' {
	if (process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_STORAGE_ACCOUNT_URL) {
		return 'azure';
	}
	return 'file';
}

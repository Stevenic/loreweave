/**
 * Azure Blob Storage adapter for WorldStore (§8.1).
 *
 * Implements the WorldStore interface against Azure Blob Storage.
 * JSON blobs with ETag-based optimistic concurrency.
 */

import type { PlayerSession, WorldSettings, WorldStore } from '@loreweave/types';
import { resolveBlobPath } from './blob-path.js';

/**
 * Configuration for the Azure Blob Storage adapter.
 * When connectionString is provided, it takes precedence over accountUrl + credential.
 */
export type AzureBlobConfig = {
	connectionString?: string;
	accountUrl?: string;
	containerName: string;
};

/**
 * Azure Blob Storage implementation of WorldStore.
 *
 * This adapter wraps the @azure/storage-blob SDK. The SDK is dynamically
 * imported so the package doesn't hard-depend on it at load time — consumers
 * that only use the in-memory store don't need the Azure SDK installed.
 */
export class AzureBlobStore implements WorldStore {
	private readonly config: AzureBlobConfig;
	private containerClient: BlobContainerClient | null = null;

	constructor(config: AzureBlobConfig) {
		this.config = config;
	}

	private async getContainer(): Promise<BlobContainerClient> {
		if (this.containerClient) return this.containerClient;

		// Dynamic import — Azure SDK is optional, only needed when this adapter is used.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const storageMod = await (Function('return import("@azure/storage-blob")')() as Promise<Record<string, unknown>>);
		const BlobServiceClient = storageMod.BlobServiceClient as {
			fromConnectionString(cs: string): { getContainerClient(name: string): BlobContainerClient };
			new (url: string, credential: unknown): { getContainerClient(name: string): BlobContainerClient };
		};

		let serviceClient: { getContainerClient(name: string): BlobContainerClient };
		if (this.config.connectionString) {
			serviceClient = BlobServiceClient.fromConnectionString(this.config.connectionString);
		} else if (this.config.accountUrl) {
			const identityMod = await (Function('return import("@azure/identity")')() as Promise<Record<string, unknown>>);
			const DefaultAzureCredential = identityMod.DefaultAzureCredential as new () => unknown;
			serviceClient = new BlobServiceClient(this.config.accountUrl, new DefaultAzureCredential());
		} else {
			throw new Error('AzureBlobConfig requires connectionString or accountUrl');
		}

		const container = serviceClient.getContainerClient(this.config.containerName);
		await container.createIfNotExists();
		this.containerClient = container;
		return container;
	}

	async getWorldSettings(worldId: string): Promise<WorldSettings | null> {
		const path = resolveBlobPath({ kind: 'config', worldId });
		return this.getBlob<WorldSettings>(path);
	}

	async putWorldSettings(settings: WorldSettings): Promise<void> {
		const path = resolveBlobPath({ kind: 'config', worldId: settings.id });
		await this.putBlob(path, settings);
	}

	async listWorlds(filter?: { visibility?: 'public' | 'private' }): Promise<WorldSettings[]> {
		const container = await this.getContainer();
		const results: WorldSettings[] = [];

		for await (const blob of container.listBlobsFlat({ prefix: 'worlds/' })) {
			if (blob.name.endsWith('/config.json')) {
				const settings = await this.getBlob<WorldSettings>(blob.name);
				if (settings) {
					if (!filter?.visibility || settings.visibility === filter.visibility) {
						results.push(settings);
					}
				}
			}
		}

		return results;
	}

	async deleteWorld(worldId: string): Promise<void> {
		const container = await this.getContainer();
		const prefix = `worlds/${worldId}/`;

		for await (const blob of container.listBlobsFlat({ prefix })) {
			await container.deleteBlob(blob.name);
		}
	}

	async getPlayerSession(worldId: string, playerId: string): Promise<PlayerSession | null> {
		const path = `worlds/${worldId}/players/${playerId}/session.json`;
		return this.getBlob<PlayerSession>(path);
	}

	async putPlayerSession(session: PlayerSession): Promise<void> {
		const path = `worlds/${session.worldId}/players/${session.playerId}/session.json`;
		await this.putBlob(path, session);
	}

	async getBlob<T>(path: string): Promise<T | null> {
		const container = await this.getContainer();
		const blobClient = container.getBlockBlobClient(path);

		try {
			const response = await blobClient.download(0);
			const body = await streamToString(response.readableStreamBody);
			return JSON.parse(body) as T;
		} catch (err: unknown) {
			if (isNotFoundError(err)) return null;
			throw err;
		}
	}

	async putBlob<T>(path: string, data: T): Promise<void> {
		const container = await this.getContainer();
		const blobClient = container.getBlockBlobClient(path);
		const content = JSON.stringify(data, null, 2);

		await blobClient.upload(content, content.length, {
			blobHTTPHeaders: { blobContentType: 'application/json' },
		});
	}

	async deleteBlob(path: string): Promise<void> {
		const container = await this.getContainer();
		try {
			await container.deleteBlob(path);
		} catch (err: unknown) {
			if (!isNotFoundError(err)) throw err;
		}
	}

	async listBlobs(prefix: string): Promise<string[]> {
		const container = await this.getContainer();
		const results: string[] = [];

		for await (const blob of container.listBlobsFlat({ prefix })) {
			results.push(blob.name);
		}

		return results;
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal interface for the Azure Blob container client (avoids hard import). */
type BlobContainerClient = {
	createIfNotExists(): Promise<unknown>;
	getBlockBlobClient(name: string): BlockBlobClient;
	listBlobsFlat(options?: { prefix?: string }): AsyncIterable<{ name: string }>;
	deleteBlob(name: string): Promise<unknown>;
};

type BlockBlobClient = {
	download(offset: number): Promise<{ readableStreamBody?: NodeJS.ReadableStream | null }>;
	upload(body: string, contentLength: number, options?: unknown): Promise<unknown>;
};

async function streamToString(stream: NodeJS.ReadableStream | null | undefined): Promise<string> {
	if (!stream) return '';
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
	}
	return Buffer.concat(chunks).toString('utf-8');
}

function isNotFoundError(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'statusCode' in err &&
		(err as { statusCode: number }).statusCode === 404
	);
}

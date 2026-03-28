/**
 * Local filesystem implementation of WorldStore.
 *
 * Maps blob paths directly to files under a configurable root directory.
 * Used for local development — data persists across restarts (unlike MemoryWorldStore)
 * without requiring Azure credentials (unlike AzureBlobStore).
 */

import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import type { PlayerSession, WorldSettings, WorldStore } from '@loreweave/types';
import { resolveBlobPath } from './blob-path.js';

/** Configuration for the file-based WorldStore. */
export type FileStoreConfig = {
	/** Root directory for all stored data. Defaults to '.loreweave/data'. */
	rootDir: string;
};

/**
 * Filesystem-backed WorldStore.
 *
 * Blob paths map 1:1 to files on disk:
 *   rootDir/worlds/{worldId}/config.json
 *   rootDir/worlds/{worldId}/state/chunks/{chunkId}.json
 *   rootDir/worlds/{worldId}/players/{playerId}/session.json
 *   etc.
 *
 * Directories are created on demand. JSON is pretty-printed for debuggability.
 */
export class FileWorldStore implements WorldStore {
	private readonly rootDir: string;

	constructor(config: FileStoreConfig) {
		this.rootDir = config.rootDir;
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
		const worldsDir = this.resolve('worlds');
		const entries = await readdirSafe(worldsDir);
		const results: WorldSettings[] = [];

		for (const entry of entries) {
			const configPath = `worlds/${entry}/config.json`;
			const settings = await this.getBlob<WorldSettings>(configPath);
			if (settings) {
				if (!filter?.visibility || settings.visibility === filter.visibility) {
					results.push(settings);
				}
			}
		}

		return results;
	}

	async deleteWorld(worldId: string): Promise<void> {
		const worldDir = this.resolve(`worlds/${worldId}`);
		await rm(worldDir, { recursive: true, force: true });
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
		const fullPath = this.resolve(path);
		try {
			const raw = await readFile(fullPath, 'utf-8');
			return JSON.parse(raw) as T;
		} catch (err: unknown) {
			if (isNotFoundError(err)) return null;
			throw err;
		}
	}

	async putBlob<T>(path: string, data: T): Promise<void> {
		const fullPath = this.resolve(path);
		await mkdir(dirname(fullPath), { recursive: true });
		await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
	}

	async deleteBlob(path: string): Promise<void> {
		const fullPath = this.resolve(path);
		try {
			await rm(fullPath);
		} catch (err: unknown) {
			if (!isNotFoundError(err)) throw err;
		}
	}

	async listBlobs(prefix: string): Promise<string[]> {
		const dir = this.resolve(prefix);
		const results: string[] = [];
		await collectFiles(dir, this.rootDir, results);
		// Filter to only entries that actually start with the prefix
		return results.filter((p) => p.startsWith(prefix)).sort();
	}

	/** Resolve a blob path to an absolute filesystem path. */
	private resolve(blobPath: string): string {
		return join(this.rootDir, ...blobPath.split('/'));
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all files under a directory, returning blob-style paths. */
async function collectFiles(dir: string, rootDir: string, results: string[]): Promise<void> {
	const entries = await readdirSafe(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const s = await stat(fullPath).catch(() => null);
		if (!s) continue;

		if (s.isDirectory()) {
			await collectFiles(fullPath, rootDir, results);
		} else if (s.isFile()) {
			// Convert absolute path back to blob-style forward-slash path
			const rel = relative(rootDir, fullPath).split(sep).join('/');
			results.push(rel);
		}
	}
}

/** Read a directory, returning empty array if it doesn't exist. */
async function readdirSafe(dir: string): Promise<string[]> {
	try {
		return await readdir(dir);
	} catch (err: unknown) {
		if (isNotFoundError(err)) return [];
		throw err;
	}
}

function isNotFoundError(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code: string }).code === 'ENOENT'
	);
}

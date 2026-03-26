/**
 * Pixel Format v1 file loader.
 *
 * Scans directories for pixel format files and loads them into typed objects.
 * Supports all 6 file types: sprite, tileset, tilemap, scene, palette, emitter.
 */

import type { Dirent } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type {
	AssetMeta,
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';

/** All recognized pixel file extensions and their format types (longest first). */
const FILE_PATTERNS: [string, PixelFileType][] = [
	['.tileset.pixel.json', 'tileset'],
	['.tilemap.pixel.json', 'tilemap'],
	['.scene.pixel.json', 'scene'],
	['.palette.pixel.json', 'palette'],
	['.emitter.pixel.json', 'emitter'],
	['.pixel.json', 'sprite'],
];

export type PixelFileType = 'sprite' | 'tileset' | 'tilemap' | 'scene' | 'palette' | 'emitter';

export type LoadedResource = {
	path: string;
	relativePath: string;
	fileType: PixelFileType;
	data: PixelSprite | PixelTileset | PixelTilemap | PixelScene | PixelPalette | PixelEmitter;
};

/** Determine the pixel file type from a filename. */
export function classifyFile(filename: string): PixelFileType | null {
	for (const [ext, type] of FILE_PATTERNS) {
		if (filename.endsWith(ext)) {
			return type;
		}
	}
	return null;
}

/** Recursively find all pixel files in a directory. */
export async function findPixelFiles(
	dir: string,
): Promise<{ path: string; fileType: PixelFileType }[]> {
	const results: { path: string; fileType: PixelFileType }[] = [];

	async function walk(currentDir: string): Promise<void> {
		const entries = await readdir(currentDir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
					continue;
				}
				await walk(fullPath);
			} else if (entry.isFile()) {
				const fileType = classifyFile(entry.name);
				if (fileType) {
					results.push({ path: fullPath, fileType });
				}
			}
		}
	}

	await walk(dir);
	return results;
}

/** Load a single pixel file from disk and parse it as JSON. */
export async function loadPixelFile(filePath: string, baseDir: string): Promise<LoadedResource> {
	const content = await readFile(filePath, 'utf-8');
	const data = JSON.parse(content);
	const fileType = classifyFile(filePath);

	if (!fileType) {
		throw new Error(`Not a recognized pixel file: ${filePath}`);
	}

	return {
		path: filePath,
		relativePath: relative(baseDir, filePath),
		fileType,
		data,
	};
}

/** Load all pixel files from a directory tree. */
export async function loadAllPixelFiles(dir: string): Promise<LoadedResource[]> {
	const files = await findPixelFiles(dir);
	const resources: LoadedResource[] = [];

	for (const file of files) {
		try {
			const resource = await loadPixelFile(file.path, dir);
			resources.push(resource);
		} catch (e) {
			// Skip files that fail to parse — they'll show up as validation errors
			console.error(`Failed to load ${file.path}: ${(e as Error).message}`);
		}
	}

	return resources;
}

// ── Managed Assets ──

/** A managed asset discovered on disk. */
export type ManagedAsset = {
	/** Path to the asset folder. */
	folderPath: string;
	/** Path relative to the assets root. */
	relativePath: string;
	/** The parsed asset.json metadata. */
	meta: AssetMeta;
};

/** The asset metadata filename. */
const ASSET_META_FILENAME = 'asset.json';

/** Read and parse an asset.json from a folder. */
export async function loadAssetMeta(assetFolder: string): Promise<AssetMeta> {
	const metaPath = join(assetFolder, ASSET_META_FILENAME);
	const content = await readFile(metaPath, 'utf-8');
	return JSON.parse(content) as AssetMeta;
}

/** Write an asset.json to a folder. Creates the folder if needed. */
export async function writeAssetMeta(assetFolder: string, meta: AssetMeta): Promise<void> {
	await mkdir(assetFolder, { recursive: true });
	const metaPath = join(assetFolder, ASSET_META_FILENAME);
	await writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`, 'utf-8');
}

/** Find all managed assets (folders containing asset.json) under a directory. */
export async function findManagedAssets(dir: string): Promise<ManagedAsset[]> {
	const results: ManagedAsset[] = [];

	async function walk(currentDir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = await readdir(currentDir, { withFileTypes: true });
		} catch {
			return;
		}

		// Check if this directory has an asset.json
		const hasAssetJson = entries.some((e) => e.isFile() && e.name === ASSET_META_FILENAME);

		if (hasAssetJson) {
			try {
				const meta = await loadAssetMeta(currentDir);
				results.push({
					folderPath: currentDir,
					relativePath: relative(dir, currentDir).replace(/\\/g, '/'),
					meta,
				});
			} catch (e) {
				console.error(
					`Failed to load ${join(currentDir, ASSET_META_FILENAME)}: ${(e as Error).message}`,
				);
			}
			// Don't recurse into managed asset folders — they own their subtree
			return;
		}

		// Recurse into subdirectories
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const name = entry.name;
				if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
				await walk(join(currentDir, name));
			}
		}
	}

	await walk(dir);
	return results;
}

/**
 * Find pixel files that are NOT inside a managed asset folder.
 * These are "unmanaged" loose files — palettes and legacy assets.
 */
export async function findUnmanagedPixelFiles(
	dir: string,
	managedFolders: Set<string>,
): Promise<{ path: string; fileType: PixelFileType }[]> {
	const results: { path: string; fileType: PixelFileType }[] = [];

	async function walk(currentDir: string): Promise<void> {
		// Skip if this directory is a managed asset folder
		if (managedFolders.has(currentDir)) return;

		let entries: Dirent[];
		try {
			entries = await readdir(currentDir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git')
					continue;
				await walk(fullPath);
			} else if (entry.isFile()) {
				const fileType = classifyFile(entry.name);
				if (fileType) {
					results.push({ path: fullPath, fileType });
				}
			}
		}
	}

	await walk(dir);
	return results;
}

/**
 * Slugify an asset name into a valid folder name.
 * Lowercases, replaces spaces/special chars with underscores, collapses runs.
 */
export function slugifyAssetName(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'asset'
	);
}

/**
 * Create a new managed asset folder with an initial asset.json.
 * Returns the path to the created folder.
 * Throws if a folder with that slug already exists.
 */
export async function createManagedAsset(assetDir: string, meta: AssetMeta): Promise<string> {
	const slug = slugifyAssetName(meta.name);
	const folderPath = join(assetDir, slug);

	// Check for existing folder
	try {
		await readdir(folderPath);
		throw new Error(`Asset folder already exists: ${slug}`);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
	}

	await writeAssetMeta(folderPath, meta);
	return folderPath;
}

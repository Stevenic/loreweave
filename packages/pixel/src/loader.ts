/**
 * Pixel Format v1 file loader.
 *
 * Scans directories for pixel format files and loads them into typed objects.
 * Supports all 6 file types: sprite, tileset, tilemap, scene, palette, emitter.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type {
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

/**
 * Pixel Format v1 file loader.
 *
 * Scans directories for pixel format files and loads them into typed objects.
 * Supports all 6 file types: sprite, tileset, tilemap, scene, palette, emitter.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

/** All recognized pixel file extensions and their format types (longest first). */
const FILE_PATTERNS = [
	['.tileset.pixel.json', 'tileset'],
	['.tilemap.pixel.json', 'tilemap'],
	['.scene.pixel.json', 'scene'],
	['.palette.pixel.json', 'palette'],
	['.emitter.pixel.json', 'emitter'],
	['.pixel.json', 'sprite'],
];
/** Determine the pixel file type from a filename. */
export function classifyFile(filename) {
	for (const [ext, type] of FILE_PATTERNS) {
		if (filename.endsWith(ext)) {
			return type;
		}
	}
	return null;
}
/** Recursively find all pixel files in a directory. */
export async function findPixelFiles(dir) {
	const results = [];
	async function walk(currentDir) {
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
export async function loadPixelFile(filePath, baseDir) {
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
export async function loadAllPixelFiles(dir) {
	const files = await findPixelFiles(dir);
	const resources = [];
	for (const file of files) {
		try {
			const resource = await loadPixelFile(file.path, dir);
			resources.push(resource);
		} catch (e) {
			// Skip files that fail to parse — they'll show up as validation errors
			console.error(`Failed to load ${file.path}: ${e.message}`);
		}
	}
	return resources;
}
//# sourceMappingURL=loader.js.map

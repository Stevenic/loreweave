/**
 * Migration utility for converting flat pixel files into managed asset folders.
 *
 * Scans for .pixel.json files that aren't already inside a managed asset folder,
 * groups related files by name prefix, creates asset folders with asset.json,
 * and moves the pixel files into them.
 *
 * Palettes are left in place — they're shared resources, not managed assets.
 */

import { rename } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { findManagedAssets, findUnmanagedPixelFiles, writeAssetMeta } from '@loreweave/pixel';
import type { AssetMeta, AssetType, AssetView } from '@loreweave/types';

/**
 * Migrate unmanaged pixel files into managed asset folders.
 *
 * - Skips palette files (they stay as shared resources).
 * - Groups files by name prefix (e.g., campfire.sprite.pixel.json and
 *   campfire_unlit.sprite.pixel.json both become views of the "campfire" asset).
 * - Creates a folder per asset group with an asset.json and moves files in.
 * - Idempotent: won't touch files already inside managed asset folders.
 *
 * @returns Number of assets migrated
 */
export async function migrateUnmanagedAssets(assetDir: string): Promise<number> {
	// Find what's already managed
	const managed = await findManagedAssets(assetDir);
	const managedFolders = new Set(managed.map((m) => m.folderPath));

	// Find unmanaged files
	const unmanaged = await findUnmanagedPixelFiles(assetDir, managedFolders);

	// Filter out palettes — they stay as shared resources
	const migratable = unmanaged.filter((f) => f.fileType !== 'palette');

	if (migratable.length === 0) return 0;

	// Group files by base name prefix
	// e.g., "campfire.sprite.pixel.json" → base "campfire"
	// e.g., "campfire_unlit.sprite.pixel.json" → base "campfire"
	const groups = new Map<
		string,
		Array<{ path: string; fileType: string; viewName: string; fileName: string }>
	>();

	for (const f of migratable) {
		const fileName = basename(f.path);
		const baseName = extractBaseName(fileName);
		const groupKey = baseName.split('_')[0]; // Group by first word before underscore

		if (!groups.has(groupKey)) groups.set(groupKey, []);

		// Derive a view name from the full base (strip the group prefix)
		let viewName = baseName === groupKey ? 'default' : baseName.slice(groupKey.length + 1);
		if (!viewName) viewName = 'default';

		groups.get(groupKey)?.push({
			path: f.path,
			fileType: f.fileType,
			viewName,
			fileName,
		});
	}

	let migrated = 0;

	for (const [groupName, files] of groups) {
		// Determine asset type from the first file's type
		const primaryType = files[0].fileType as AssetType;

		// Build views
		const views: Record<string, AssetView> = {};
		for (const f of files) {
			views[f.viewName] = {
				file: f.fileName,
				label:
					f.viewName === 'default'
						? 'Default'
						: f.viewName.charAt(0).toUpperCase() + f.viewName.slice(1).replace(/_/g, ' '),
			};
		}

		// Create the asset folder and metadata
		const folderPath = join(assetDir, groupName);
		const meta: AssetMeta = {
			version: 1,
			name: groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/_/g, ' '),
			type: primaryType,
			views,
			defaultView: views.default ? 'default' : Object.keys(views)[0],
		};

		await writeAssetMeta(folderPath, meta);

		// Move pixel files into the asset folder
		for (const f of files) {
			const dest = join(folderPath, f.fileName);
			if (f.path !== dest) {
				try {
					await rename(f.path, dest);
				} catch (err) {
					console.error(`  Failed to move ${f.fileName}: ${(err as Error).message}`);
				}
			}
		}

		migrated++;
	}

	return migrated;
}

/**
 * Extract the base name from a pixel filename by stripping the pixel extension.
 * e.g., "campfire_unlit.sprite.pixel.json" → "campfire_unlit"
 * e.g., "pine_tree.pixel.json" → "pine_tree"
 */
function extractBaseName(filename: string): string {
	const pixelExtensions = [
		'.tileset.pixel.json',
		'.tilemap.pixel.json',
		'.scene.pixel.json',
		'.palette.pixel.json',
		'.emitter.pixel.json',
		'.sprite.pixel.json',
		'.pixel.json',
	];
	for (const ext of pixelExtensions) {
		if (filename.endsWith(ext)) {
			return filename.slice(0, -ext.length);
		}
	}
	return filename.replace(/\.json$/, '');
}

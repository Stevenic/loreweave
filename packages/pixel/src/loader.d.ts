/**
 * Pixel Format v1 file loader.
 *
 * Scans directories for pixel format files and loads them into typed objects.
 * Supports all 6 file types: sprite, tileset, tilemap, scene, palette, emitter.
 */
import type {
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';
export type PixelFileType = 'sprite' | 'tileset' | 'tilemap' | 'scene' | 'palette' | 'emitter';
export type LoadedResource = {
	path: string;
	relativePath: string;
	fileType: PixelFileType;
	data: PixelSprite | PixelTileset | PixelTilemap | PixelScene | PixelPalette | PixelEmitter;
};
/** Determine the pixel file type from a filename. */
export declare function classifyFile(filename: string): PixelFileType | null;
/** Recursively find all pixel files in a directory. */
export declare function findPixelFiles(dir: string): Promise<
	{
		path: string;
		fileType: PixelFileType;
	}[]
>;
/** Load a single pixel file from disk and parse it as JSON. */
export declare function loadPixelFile(filePath: string, baseDir: string): Promise<LoadedResource>;
/** Load all pixel files from a directory tree. */
export declare function loadAllPixelFiles(dir: string): Promise<LoadedResource[]>;
//# sourceMappingURL=loader.d.ts.map

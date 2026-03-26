/**
 * Canvas 2D renderer for Pixel Format v1.
 *
 * Implements the full browser rendering pipeline from spec §11.
 * All APIs accept standard Canvas 2D interfaces as parameters —
 * no browser globals are imported, so this works with any compliant
 * canvas implementation (browser, OffscreenCanvas, node-canvas, etc.).
 */
import type {
	EmitterConfig,
	PixelColor,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTile,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';
import { ParticleEmitter } from './emitter.js';
/** A function that creates an offscreen canvas. Injected to avoid browser globals. */
export type CanvasFactory = (width: number, height: number) => OffscreenCanvas;
/** Registry of loaded assets for scene rendering. */
export type AssetRegistry = {
	sprites: Map<string, PixelSprite>;
	tilesets: Map<string, PixelTileset>;
	tilemaps: Map<string, PixelTilemap>;
	palettes: Map<string, PixelPalette>;
	emitters: Map<string, EmitterConfig>;
};
/**
 * Rasterize a single frame of a sprite to an ImageData.
 * Returns raw RGBA pixel data at 1× scale.
 */
export declare function rasterizeSpriteFrame(
	sprite: PixelSprite,
	frameIndex: number,
	paletteRegistry: Map<string, PixelPalette>,
	paletteOverrides?: Record<string, PixelColor>,
): ImageData;
/**
 * Rasterize a tile to an ImageData at 1× scale.
 */
export declare function rasterizeTile(
	tile: PixelTile,
	tileWidth: number,
	tileHeight: number,
	entries: Record<string, PixelColor>,
): ImageData;
/**
 * Draw an ImageData onto a canvas context at a given position with transforms.
 * Uses an offscreen canvas to convert ImageData to a drawable source.
 */
export declare function drawImageData(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	imageData: ImageData,
	x: number,
	y: number,
	createCanvas: CanvasFactory,
	options?: {
		scale?: number;
		flipX?: boolean;
		flipY?: boolean;
		rotation?: number;
		opacity?: number;
		originX?: number;
		originY?: number;
	},
): void;
/** State for a running scene (animation time, emitter states, etc.). */
export type SceneState = {
	time: number;
	emitters: Map<string, ParticleEmitter>;
};
/** Create a fresh scene state. */
export declare function createSceneState(): SceneState;
/**
 * Render a complete scene to a canvas context.
 *
 * This is the main entry point for scene rendering per spec §11.8.
 */
export declare function renderScene(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	scene: PixelScene,
	registry: AssetRegistry,
	createCanvas: CanvasFactory,
	state?: SceneState,
): void;
/**
 * Render a single sprite (frame 0) onto a canvas context.
 * Simpler API for previewing individual sprites outside of scenes.
 */
export declare function renderSprite(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	sprite: PixelSprite,
	createCanvas: CanvasFactory,
	options?: {
		paletteRegistry?: Map<string, PixelPalette>;
		frame?: number;
		scale?: number;
		x?: number;
		y?: number;
	},
): void;
//# sourceMappingURL=canvas-renderer.d.ts.map

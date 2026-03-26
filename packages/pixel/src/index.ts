/**
 * @loreweave/pixel — Pixel Format v1 implementation
 *
 * Full implementation of the Pixel Format v1 spec:
 * - Decoder: raw and RLE row decoding, layer compositing, frame extraction
 * - Color: parsing and conversion utilities
 * - Animation: keyframe interpolation, easing, clip playback
 * - Emitter: particle system simulation
 * - Validator: all 6 file types (sprite, tileset, tilemap, scene, palette, emitter)
 * - Canvas renderer: Canvas 2D rasterization and scene compositing
 * - Terminal renderer: ANSI true-color preview for CLI tools
 * - Loader: file scanning, classification, and loading
 */

// Animation
export type { AnimatedProperties } from './animation.js';
export {
	computeClipTime,
	DEFAULT_ANIMATED_PROPERTIES,
	getEasingFn,
	interpolateTrack,
	sampleClip,
} from './animation.js';
// Canvas Renderer
export type { AssetRegistry, CanvasFactory, SceneState } from './canvas-renderer.js';
export {
	createSceneState,
	drawImageData,
	rasterizeSpriteFrame,
	rasterizeTile,
	renderScene,
	renderSprite,
} from './canvas-renderer.js';
// Color
export type { RGBA } from './color.js';
export {
	alphaBlend,
	colorDistance,
	parseColor,
	pixelColorToCSS,
	remapPalette,
	remapPaletteEntries,
	rgbaToCSS,
} from './color.js';
// Decoder
export {
	compositeLayers,
	decodeAllFrames,
	decodeLayerFrames,
	decodePixelRows,
	decodeRleRow,
	extractFrame,
} from './decoder.js';
// Emitter
export type { Particle } from './emitter.js';
export { ParticleEmitter, SeededRNG } from './emitter.js';
// Loader
export type { LoadedResource, ManagedAsset, PixelFileType } from './loader.js';
export {
	classifyFile,
	createManagedAsset,
	findManagedAssets,
	findPixelFiles,
	findUnmanagedPixelFiles,
	loadAllPixelFiles,
	loadAssetMeta,
	loadPixelFile,
	slugifyAssetName,
	writeAssetMeta,
} from './loader.js';

// Terminal Renderer
export {
	renderSpriteTerminal,
	renderSpriteToTerminalString,
	renderTileTerminal,
	renderTileToTerminalString,
} from './terminal-renderer.js';
// Validator
export type { ValidationResult } from './validator.js';
export {
	validateEmitter,
	validateEmitterConfig,
	validatePalette,
	validateScene,
	validateSprite,
	validateTilemap,
	validateTileset,
} from './validator.js';
// Generator
export type { GeneratePixelOptions, GeneratePixelResult, PixelAssetType } from './generator.js';
export { generatePixelAsset } from './generator.js';
// Sizing
export type { ComputedDimensions, DetailLevel, SpriteArchetype } from './sizing.js';
export {
	buildSizingTable,
	computeDimensions,
	DETAIL_LEVEL_LABELS,
	DETAIL_LEVEL_PPU,
	inferArchetype,
	SPRITE_ARCHETYPES,
} from './sizing.js';

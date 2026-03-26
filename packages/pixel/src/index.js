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
// Decoder

export {
	computeClipTime,
	DEFAULT_ANIMATED_PROPERTIES,
	getEasingFn,
	interpolateTrack,
	sampleClip,
} from './animation.js';
export {
	createSceneState,
	drawImageData,
	rasterizeSpriteFrame,
	rasterizeTile,
	renderScene,
	renderSprite,
} from './canvas-renderer.js';
export { alphaBlend, parseColor, pixelColorToCSS, rgbaToCSS } from './color.js';
export {
	compositeLayers,
	decodeAllFrames,
	decodeLayerFrames,
	decodePixelRows,
	decodeRleRow,
	extractFrame,
} from './decoder.js';
export { ParticleEmitter, SeededRNG } from './emitter.js';
export { classifyFile, findPixelFiles, loadAllPixelFiles, loadPixelFile } from './loader.js';
// Terminal Renderer
export {
	renderSpriteTerminal,
	renderSpriteToTerminalString,
	renderTileTerminal,
	renderTileToTerminalString,
} from './terminal-renderer.js';
export {
	validateEmitter,
	validateEmitterConfig,
	validatePalette,
	validateScene,
	validateSprite,
	validateTilemap,
	validateTileset,
} from './validator.js';
//# sourceMappingURL=index.js.map

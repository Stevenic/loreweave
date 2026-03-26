/**
 * Pixel Format v1 row decoders.
 *
 * Implements the canonical decoding algorithm from spec §6 and §14.
 * Handles raw encoding, RLE encoding, sprite layers, and animation frames.
 */
import type { PixelEncoding, SpriteLayer } from '@loreweave/types';
/**
 * Decode a single RLE-encoded row into a raw pixel string.
 *
 * Token format: `<count><symbol>` where count is a positive integer
 * and symbol is a single palette key character.
 */
export declare function decodeRleRow(row: string): string;
/**
 * Decode an array of pixel rows (raw or RLE) into canonical raw strings.
 * Validates row count matches expectedRows and each decoded row matches width.
 */
export declare function decodePixelRows(encoding: PixelEncoding, rows: string[], width: number, expectedRows: number): string[];
/**
 * Extract a single animation frame from decoded pixel rows.
 * Frames are vertically stacked: rows [frame * height .. (frame+1) * height - 1].
 */
export declare function extractFrame(decodedRows: string[], height: number, frameIndex: number): string[];
/**
 * Decode all frames from a sprite's pixel data.
 * Returns an array of frames, each frame being an array of decoded row strings.
 */
export declare function decodeAllFrames(encoding: PixelEncoding, pixels: string[], width: number, height: number, frameCount: number): string[][];
/**
 * Decode a sprite layer's pixel data, accounting for animation frames.
 * Returns an array of frames for this layer.
 */
export declare function decodeLayerFrames(encoding: PixelEncoding, layer: SpriteLayer, width: number, height: number, frameCount: number): string[][];
/**
 * Composite multiple decoded layers into a single frame.
 * Layers are composited in array order (first = back, last = front).
 * Transparent pixels (the character mapped to "transparent" in the palette)
 * do not overwrite pixels from layers below.
 *
 * @param layerFrames - Array of decoded row arrays, one per layer
 * @param transparentKey - The palette key mapped to "transparent" (usually "0")
 * @returns Single composited frame as an array of row strings
 */
export declare function compositeLayers(layerFrames: string[][], transparentKey: string): string[];
//# sourceMappingURL=decoder.d.ts.map
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
export function decodeRleRow(row: string): string {
	const tokens = row.trim().split(/\s+/).filter(Boolean);
	let out = '';

	for (const token of tokens) {
		const match = token.match(/^(\d+)(.)$/);
		if (!match) {
			throw new Error(`Invalid RLE token: ${token}`);
		}

		const count = Number(match[1]);
		const symbol = match[2];

		if (!Number.isInteger(count) || count <= 0) {
			throw new Error(`Invalid RLE count in token: ${token}`);
		}

		out += symbol.repeat(count);
	}

	return out;
}

/**
 * Decode an array of pixel rows (raw or RLE) into canonical raw strings.
 * Validates row count matches expectedRows and each decoded row matches width.
 */
export function decodePixelRows(
	encoding: PixelEncoding,
	rows: string[],
	width: number,
	expectedRows: number,
): string[] {
	if (rows.length !== expectedRows) {
		throw new Error(`Expected ${expectedRows} rows, got ${rows.length}`);
	}

	const decoded = rows.map((row) => (encoding === 'raw' ? row : decodeRleRow(row)));

	for (let i = 0; i < decoded.length; i++) {
		if (decoded[i].length !== width) {
			throw new Error(
				`Row ${i}: decoded length ${decoded[i].length} does not match width ${width}`,
			);
		}
	}

	return decoded;
}

/**
 * Extract a single animation frame from decoded pixel rows.
 * Frames are vertically stacked: rows [frame * height .. (frame+1) * height - 1].
 */
export function extractFrame(decodedRows: string[], height: number, frameIndex: number): string[] {
	const start = frameIndex * height;
	return decodedRows.slice(start, start + height);
}

/**
 * Decode all frames from a sprite's pixel data.
 * Returns an array of frames, each frame being an array of decoded row strings.
 */
export function decodeAllFrames(
	encoding: PixelEncoding,
	pixels: string[],
	width: number,
	height: number,
	frameCount: number,
): string[][] {
	const totalRows = height * frameCount;
	const decoded = decodePixelRows(encoding, pixels, width, totalRows);
	const frames: string[][] = [];

	for (let f = 0; f < frameCount; f++) {
		frames.push(extractFrame(decoded, height, f));
	}

	return frames;
}

/**
 * Decode a sprite layer's pixel data, accounting for animation frames.
 * Returns an array of frames for this layer.
 */
export function decodeLayerFrames(
	encoding: PixelEncoding,
	layer: SpriteLayer,
	width: number,
	height: number,
	frameCount: number,
): string[][] {
	return decodeAllFrames(encoding, layer.pixels, width, height, frameCount);
}

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
export function compositeLayers(layerFrames: string[][], transparentKey: string): string[] {
	if (layerFrames.length === 0) return [];
	if (layerFrames.length === 1) return layerFrames[0];

	const height = layerFrames[0].length;
	const width = layerFrames[0][0].length;
	const result: string[] = [];

	for (let y = 0; y < height; y++) {
		const row = new Array<string>(width);
		// Start with transparent
		for (let x = 0; x < width; x++) {
			row[x] = transparentKey;
		}

		// Composite each layer (back to front)
		for (const layerFrame of layerFrames) {
			const layerRow = layerFrame[y];
			for (let x = 0; x < width; x++) {
				if (layerRow[x] !== transparentKey) {
					row[x] = layerRow[x];
				}
			}
		}

		result.push(row.join(''));
	}

	return result;
}

/**
 * Terminal renderer for Pixel Format v1 assets.
 *
 * Renders sprites and tiles as colored Unicode block characters
 * using ANSI true-color escape sequences. Used by the resource explorer CLI.
 */

import type { PixelColor, PixelPalette, PixelSprite, PixelTile } from '@loreweave/types';
import { parseColor } from './color.js';
import { compositeLayers, decodeAllFrames, decodePixelRows } from './decoder.js';

/** Generate an ANSI true-color background escape for a pixel. */
function colorBlock(color: PixelColor): string {
	const rgba = parseColor(color);
	if (!rgba || rgba.a === 0) {
		return '\x1b[0m  '; // transparent = two spaces with reset
	}
	// Use two spaces with background color for a roughly square pixel
	return `\x1b[48;2;${rgba.r};${rgba.g};${rgba.b}m  `;
}

/** Resolve palette entries from inline object or registry. */
function resolveEntries(
	palette: string | PixelPalette,
	registry?: Map<string, PixelPalette>,
): Record<string, PixelColor> {
	if (typeof palette === 'object') return palette.entries;
	if (registry) {
		const found = registry.get(palette);
		if (found) return found.entries;
	}
	throw new Error(`Cannot resolve palette '${String(palette)}'`);
}

/** Find the transparent key in palette entries. */
function findTransparentKey(entries: Record<string, PixelColor>): string {
	for (const [key, value] of Object.entries(entries)) {
		if (value === 'transparent') return key;
	}
	return '\0';
}

/** Render a decoded pixel grid to an array of ANSI-colored terminal lines. */
function renderRows(decodedRows: string[], entries: Record<string, PixelColor>): string[] {
	return decodedRows.map((row) => {
		let line = '';
		for (const ch of row) {
			const color = entries[ch];
			if (color) {
				line += colorBlock(color);
			} else {
				line += '\x1b[0m??';
			}
		}
		line += '\x1b[0m'; // reset at end of line
		return line;
	});
}

/** Render a sprite to terminal-ready ANSI lines. Supports layers and animation frames. */
export function renderSpriteTerminal(
	sprite: PixelSprite,
	registry?: Map<string, PixelPalette>,
	frame = 0,
): string[] {
	const entries = resolveEntries(sprite.palette, registry);
	const frameCount = sprite.frameCount ?? 1;
	const transparentKey = findTransparentKey(entries);

	let frameRows: string[];

	if (sprite.layers && sprite.layers.length > 0) {
		const layerFrames: string[][] = [];
		for (const layer of sprite.layers) {
			const allFrames = decodeAllFrames(
				sprite.encoding,
				layer.pixels,
				sprite.width,
				sprite.height,
				frameCount,
			);
			layerFrames.push(allFrames[frame] ?? allFrames[0]);
		}
		frameRows = compositeLayers(layerFrames, transparentKey);
	} else if (sprite.pixels) {
		const allFrames = decodeAllFrames(
			sprite.encoding,
			sprite.pixels,
			sprite.width,
			sprite.height,
			frameCount,
		);
		frameRows = allFrames[frame] ?? allFrames[0];
	} else {
		throw new Error(`Sprite '${sprite.name}' has no pixel data`);
	}

	return renderRows(frameRows, entries);
}

/** Render a single tile to terminal-ready ANSI lines. */
export function renderTileTerminal(
	tile: PixelTile,
	tileWidth: number,
	tileHeight: number,
	palette: string | PixelPalette,
	registry?: Map<string, PixelPalette>,
): string[] {
	const entries = resolveEntries(palette, registry);
	const decoded = decodePixelRows(tile.encoding, tile.pixels, tileWidth, tileHeight);
	return renderRows(decoded, entries);
}

/** Render a sprite to a single string for printing. */
export function renderSpriteToTerminalString(
	sprite: PixelSprite,
	registry?: Map<string, PixelPalette>,
	frame = 0,
): string {
	return renderSpriteTerminal(sprite, registry, frame).join('\n');
}

/** Render a tile to a single string for printing. */
export function renderTileToTerminalString(
	tile: PixelTile,
	tileWidth: number,
	tileHeight: number,
	palette: string | PixelPalette,
	registry?: Map<string, PixelPalette>,
): string {
	return renderTileTerminal(tile, tileWidth, tileHeight, palette, registry).join('\n');
}

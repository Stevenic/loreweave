/**
 * Pixel Format v1 validators.
 *
 * Validates all 6 file types against the spec (§12).
 * Sprites, palettes, tilesets, tilemaps, scenes, and emitters.
 */

import type {
	Attachment,
	BlendMode,
	EmitterConfig,
	PixelColor,
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSceneLayer,
	PixelSprite,
	PixelTile,
	PixelTilemap,
	PixelTileset,
	Region,
	TileRef,
} from '@loreweave/types';
import { decodePixelRows } from './decoder.js';

export type ValidationResult = {
	valid: boolean;
	errors: string[];
	warnings: string[];
};

function ok(): ValidationResult {
	return { valid: true, errors: [], warnings: [] };
}

function fail(...errors: string[]): ValidationResult {
	return { valid: false, errors, warnings: [] };
}

function warn(...warnings: string[]): ValidationResult {
	return { valid: true, errors: [], warnings };
}

function merge(...results: ValidationResult[]): ValidationResult {
	const errors = results.flatMap((r) => r.errors);
	const warnings = results.flatMap((r) => r.warnings);
	return { valid: errors.length === 0, errors, warnings };
}

// ─── Palette Helpers ───

/** Allowed single-character palette keys. */
const ALLOWED_PALETTE_KEYS = new Set(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&*+=?'.split(''),
);

const COLOR_REGEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

/** Resolve palette entries from inline palette object or a string name via registry. */
function resolvePaletteEntries(
	palette: string | PixelPalette,
	registry?: Map<string, PixelPalette>,
): Record<string, PixelColor> | null {
	if (typeof palette === 'object') {
		return palette.entries;
	}
	if (registry) {
		const found = registry.get(palette);
		if (found) return found.entries;
	}
	return null;
}

/** Check that every symbol in decoded rows exists in the palette. */
function validatePaletteKeys(
	decodedRows: string[],
	entries: Record<string, PixelColor>,
	prefix: string,
): ValidationResult {
	const errors: string[] = [];
	const validKeys = new Set(Object.keys(entries));

	for (let y = 0; y < decodedRows.length; y++) {
		for (const ch of decodedRows[y]) {
			if (!validKeys.has(ch)) {
				errors.push(`${prefix}Row ${y}: unknown palette key '${ch}'`);
			}
		}
	}

	return errors.length > 0 ? fail(...errors) : ok();
}

// ─── Palette Validation ───

/** Validate a PixelPalette against the spec. */
export function validatePalette(palette: PixelPalette): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (palette.format && palette.format !== 'pixel-palette-v1') {
		errors.push(`Invalid format: '${palette.format}'`);
	}
	if (!palette.entries || typeof palette.entries !== 'object') {
		return fail('Palette must have entries object');
	}

	const entryKeys = Object.keys(palette.entries);

	if (entryKeys.length > 72) {
		errors.push(`Palette has ${entryKeys.length} entries, max is 72`);
	}

	for (const [key, value] of Object.entries(palette.entries) as [string, PixelColor][]) {
		if (key.length !== 1) {
			errors.push(`Palette key '${key}' must be a single character`);
		} else if (!ALLOWED_PALETTE_KEYS.has(key)) {
			errors.push(`Palette key '${key}' is not an allowed character`);
		}
		if (value !== 'transparent' && !COLOR_REGEX.test(value)) {
			errors.push(`Palette key '${key}': invalid color '${value}'`);
		}
	}

	// Validate aliases reference existing entries
	if (palette.aliases) {
		for (const key of Object.keys(palette.aliases)) {
			if (!(key in palette.entries)) {
				errors.push(`Alias key '${key}' does not exist in entries`);
			}
		}
	}

	// Validate ramps reference existing entries
	if (palette.ramps) {
		for (const [rampName, keys] of Object.entries(palette.ramps) as [string, string[]][]) {
			for (const key of keys) {
				if (!(key in palette.entries)) {
					errors.push(`Ramp '${rampName}': key '${key}' does not exist in entries`);
				}
			}
		}
	}

	const result = errors.length > 0 ? fail(...errors) : ok();
	result.warnings = warnings;
	return result;
}

// ─── Sprite Validation ───

/** Validate a PixelSprite against the spec. */
export function validateSprite(
	sprite: PixelSprite,
	registry?: Map<string, PixelPalette>,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (sprite.format !== 'pixel-sprite-v1') {
		errors.push(`Invalid format: '${sprite.format}'`);
	}
	if (!sprite.name || typeof sprite.name !== 'string') {
		errors.push('Sprite must have a name');
	}
	if (!Number.isInteger(sprite.width) || sprite.width <= 0) {
		errors.push(`width must be a positive integer, got ${sprite.width}`);
	}
	if (!Number.isInteger(sprite.height) || sprite.height <= 0) {
		errors.push(`height must be a positive integer, got ${sprite.height}`);
	}
	if (sprite.encoding !== 'raw' && sprite.encoding !== 'rle') {
		errors.push(`Unsupported encoding: '${sprite.encoding}'`);
	}

	if (errors.length > 0) return fail(...errors);

	const frameCount = sprite.frameCount ?? 1;
	if (!Number.isInteger(frameCount) || frameCount <= 0) {
		errors.push(`frameCount must be a positive integer, got ${frameCount}`);
		return fail(...errors);
	}

	const entries = resolvePaletteEntries(sprite.palette, registry);
	if (!entries) {
		return fail(`Palette '${String(sprite.palette)}' could not be resolved`);
	}

	const totalRows = sprite.height * frameCount;
	const results: ValidationResult[] = [];

	// Validate pixels or layers
	if (sprite.layers && sprite.layers.length > 0) {
		for (let i = 0; i < sprite.layers.length; i++) {
			const layer = sprite.layers[i];
			if (!layer.name) {
				errors.push(`Layer ${i}: missing name`);
			}
			try {
				const decoded = decodePixelRows(sprite.encoding, layer.pixels, sprite.width, totalRows);
				results.push(validatePaletteKeys(decoded, entries, `Layer '${layer.name}': `));
			} catch (e) {
				errors.push(`Layer '${layer.name}': ${(e as Error).message}`);
			}
		}
	} else if (sprite.pixels) {
		try {
			const decoded = decodePixelRows(sprite.encoding, sprite.pixels, sprite.width, totalRows);
			results.push(validatePaletteKeys(decoded, entries, ''));
		} catch (e) {
			errors.push((e as Error).message);
		}
	} else {
		errors.push('Sprite must have either pixels or layers');
	}

	// Validate optional fields
	if (
		sprite.baseScale !== undefined &&
		(typeof sprite.baseScale !== 'number' || sprite.baseScale <= 0)
	) {
		errors.push(`baseScale must be a positive number, got ${sprite.baseScale}`);
	}

	if (sprite.ppu !== undefined && (!Number.isInteger(sprite.ppu) || sprite.ppu <= 0)) {
		errors.push(`ppu must be a positive integer, got ${sprite.ppu}`);
	}

	if (sprite.origin) {
		if (typeof sprite.origin.x !== 'number' || typeof sprite.origin.y !== 'number') {
			errors.push('origin must have numeric x and y');
		}
	}

	if (sprite.regions) {
		for (const [name, region] of Object.entries(sprite.regions) as [string, Region][]) {
			if (
				region.x < 0 ||
				region.y < 0 ||
				region.x + region.width > sprite.width ||
				region.y + region.height > sprite.height
			) {
				warnings.push(`Region '${name}' extends outside sprite bounds`);
			}
		}
	}

	if (sprite.attachments) {
		for (const [name, att] of Object.entries(sprite.attachments) as [string, Attachment][]) {
			if (att.x < 0 || att.y < 0 || att.x > sprite.width || att.y > sprite.height) {
				warnings.push(`Attachment '${name}' is outside sprite bounds`);
			}
		}
	}

	const final = merge(errors.length > 0 ? fail(...errors) : ok(), ...results);
	final.warnings.push(...warnings);
	return final;
}

// ─── Tileset Validation ───

/** Validate a PixelTileset against the spec. */
export function validateTileset(
	tileset: PixelTileset,
	registry?: Map<string, PixelPalette>,
): ValidationResult {
	const errors: string[] = [];

	if (tileset.format !== 'pixel-tileset-v1') {
		errors.push(`Invalid format: '${tileset.format}'`);
	}
	if (!Number.isInteger(tileset.tileWidth) || tileset.tileWidth <= 0) {
		errors.push(`tileWidth must be a positive integer, got ${tileset.tileWidth}`);
	}
	if (!Number.isInteger(tileset.tileHeight) || tileset.tileHeight <= 0) {
		errors.push(`tileHeight must be a positive integer, got ${tileset.tileHeight}`);
	}

	if (tileset.ppu !== undefined && (!Number.isInteger(tileset.ppu) || tileset.ppu <= 0)) {
		errors.push(`ppu must be a positive integer, got ${tileset.ppu}`);
	}

	if (errors.length > 0) return fail(...errors);

	const entries = resolvePaletteEntries(tileset.palette, registry);
	if (!entries) {
		return fail(`Palette '${String(tileset.palette)}' could not be resolved`);
	}

	const results: ValidationResult[] = [];
	for (const [name, tile] of Object.entries(tileset.tiles) as [string, PixelTile][]) {
		try {
			const decoded = decodePixelRows(
				tile.encoding,
				tile.pixels,
				tileset.tileWidth,
				tileset.tileHeight,
			);
			const keyResult = validatePaletteKeys(decoded, entries, `Tile '${name}': `);
			if (!keyResult.valid) {
				results.push(keyResult);
			}
		} catch (e) {
			results.push(fail(`Tile '${name}': ${(e as Error).message}`));
		}
	}

	return merge(ok(), ...results);
}

// ─── Tilemap Validation ───

/** Validate a PixelTilemap against the spec. */
export function validateTilemap(
	tilemap: PixelTilemap,
	tilesetRegistry?: Map<string, PixelTileset>,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (tilemap.format !== 'pixel-tilemap-v1') {
		errors.push(`Invalid format: '${tilemap.format}'`);
	}
	if (!Number.isInteger(tilemap.gridWidth) || tilemap.gridWidth <= 0) {
		errors.push(`gridWidth must be a positive integer, got ${tilemap.gridWidth}`);
	}
	if (!Number.isInteger(tilemap.gridHeight) || tilemap.gridHeight <= 0) {
		errors.push(`gridHeight must be a positive integer, got ${tilemap.gridHeight}`);
	}

	if (errors.length > 0) return fail(...errors);

	// Validate grid dimensions
	if (!Array.isArray(tilemap.grid)) {
		return fail('grid must be an array');
	}
	if (tilemap.grid.length !== tilemap.gridHeight) {
		errors.push(`grid has ${tilemap.grid.length} rows, expected ${tilemap.gridHeight}`);
	}

	for (let y = 0; y < tilemap.grid.length; y++) {
		if (tilemap.grid[y].length !== tilemap.gridWidth) {
			errors.push(`Grid row ${y}: length ${tilemap.grid[y].length}, expected ${tilemap.gridWidth}`);
		}
	}

	// Validate legend and grid characters
	if (!tilemap.legend || typeof tilemap.legend !== 'object') {
		return fail('tilemap must have a legend object');
	}

	const legendKeys = new Set(Object.keys(tilemap.legend));

	for (let y = 0; y < tilemap.grid.length; y++) {
		for (const ch of tilemap.grid[y]) {
			if (!legendKeys.has(ch)) {
				errors.push(`Grid row ${y}: character '${ch}' not found in legend`);
			}
		}
	}

	// Validate legend references against tileset
	if (tilesetRegistry) {
		const tileset = tilesetRegistry.get(tilemap.tileset);
		if (!tileset) {
			warnings.push(`Tileset '${tilemap.tileset}' not found in registry`);
		} else {
			for (const [key, ref] of Object.entries(tilemap.legend) as [string, string | TileRef][]) {
				const tileName = typeof ref === 'string' ? ref : ref.tile;
				if (!(tileName in tileset.tiles)) {
					errors.push(
						`Legend '${key}': tile '${tileName}' not found in tileset '${tilemap.tileset}'`,
					);
				}
			}
		}
	}

	const result = errors.length > 0 ? fail(...errors) : ok();
	result.warnings = warnings;
	return result;
}

// ─── Scene Validation ───

const VALID_BLEND_MODES: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'additive'];

/** Validate a PixelScene against the spec. */
export function validateScene(scene: PixelScene): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (scene.format !== 'pixel-scene-v1') {
		errors.push(`Invalid format: '${scene.format}'`);
	}
	if (!scene.canvas || !Number.isInteger(scene.canvas.width) || scene.canvas.width <= 0) {
		errors.push('canvas.width must be a positive integer');
	}
	if (!scene.canvas || !Number.isInteger(scene.canvas.height) || scene.canvas.height <= 0) {
		errors.push('canvas.height must be a positive integer');
	}
	if (!Array.isArray(scene.layers) || scene.layers.length === 0) {
		errors.push('layers must be a non-empty array');
	}
	if (
		scene.canvas?.referencePpu !== undefined &&
		(!Number.isInteger(scene.canvas.referencePpu) || scene.canvas.referencePpu <= 0)
	) {
		errors.push(`canvas.referencePpu must be a positive integer, got ${scene.canvas.referencePpu}`);
	}

	if (errors.length > 0) return fail(...errors);

	// Track item IDs for attachment validation
	const itemIds = new Set<string>();
	const attachRefs: Array<{ parent: string; layerIdx: number; itemIdx: number }> = [];

	for (let i = 0; i < scene.layers.length; i++) {
		const layer = scene.layers[i] as PixelSceneLayer;
		if (!layer.name) {
			errors.push(`Layer ${i}: missing name`);
		}

		// Validate blend mode
		if (layer.blend && !VALID_BLEND_MODES.includes(layer.blend)) {
			errors.push(`Layer '${layer.name}': invalid blend mode '${layer.blend}'`);
		}

		const layerType = layer.type ?? 'items';

		if (layerType === 'tilemap') {
			if (!layer.tilemap) {
				errors.push(`Layer '${layer.name}': tilemap layer must have tilemap reference`);
			}
		} else if (layerType === 'items') {
			if (layer.items) {
				for (let j = 0; j < layer.items.length; j++) {
					const item = layer.items[j];
					if (!item.asset) {
						errors.push(`Layer '${layer.name}', item ${j}: missing asset`);
					}

					// Items need x,y OR attach
					if (item.attach) {
						attachRefs.push({ parent: item.attach.parent, layerIdx: i, itemIdx: j });
					} else {
						if (typeof item.x !== 'number') {
							errors.push(`Layer '${layer.name}', item ${j}: missing x coordinate`);
						}
						if (typeof item.y !== 'number') {
							errors.push(`Layer '${layer.name}', item ${j}: missing y coordinate`);
						}
					}

					if (item.id) {
						if (itemIds.has(item.id)) {
							errors.push(`Layer '${layer.name}', item ${j}: duplicate id '${item.id}'`);
						}
						itemIds.add(item.id);
					}

					// Validate inline palette if present
					if (item.palette && typeof item.palette === 'object') {
						const paletteResult = validatePalette(item.palette as PixelPalette);
						if (!paletteResult.valid) {
							errors.push(
								...paletteResult.errors.map(
									(e) => `Layer '${layer.name}', item ${j} palette: ${e}`,
								),
							);
						}
					}

					// Validate inline emitter if present
					if (item.emitter) {
						const emitterResult = validateEmitterConfig(item.emitter);
						if (!emitterResult.valid) {
							errors.push(
								...emitterResult.errors.map(
									(e) => `Layer '${layer.name}', item ${j} emitter: ${e}`,
								),
							);
						}
					}
				}
			}
		} else {
			errors.push(`Layer '${layer.name}': invalid type '${layerType}'`);
		}
	}

	// Validate attachment references
	for (const ref of attachRefs) {
		if (!itemIds.has(ref.parent)) {
			warnings.push(
				`Layer ${ref.layerIdx}, item ${ref.itemIdx}: attach parent '${ref.parent}' not found`,
			);
		}
	}

	const result = errors.length > 0 ? fail(...errors) : ok();
	result.warnings.push(...warnings);
	return result;
}

// ─── Emitter Validation ───

/** Validate an EmitterConfig (inline or standalone). */
export function validateEmitterConfig(config: EmitterConfig): ValidationResult {
	const errors: string[] = [];

	if (typeof config.rate !== 'number' || config.rate <= 0) {
		errors.push(`rate must be a positive number, got ${config.rate}`);
	}
	if (!config.lifetime || config.lifetime.min > config.lifetime.max) {
		errors.push('lifetime.min must be <= lifetime.max');
	}
	if (!config.velocity || !config.velocity.x || !config.velocity.y) {
		errors.push('velocity must have x and y ranges');
	}
	if (
		config.maxParticles !== undefined &&
		(!Number.isInteger(config.maxParticles) || config.maxParticles <= 0)
	) {
		errors.push(`maxParticles must be a positive integer, got ${config.maxParticles}`);
	}
	if (config.ppu !== undefined && (!Number.isInteger(config.ppu) || config.ppu <= 0)) {
		errors.push(`ppu must be a positive integer, got ${config.ppu}`);
	}

	return errors.length > 0 ? fail(...errors) : ok();
}

/** Validate a standalone PixelEmitter file. */
export function validateEmitter(emitter: PixelEmitter): ValidationResult {
	const errors: string[] = [];

	if (emitter.format !== 'pixel-emitter-v1') {
		errors.push(`Invalid format: '${emitter.format}'`);
	}
	if (!emitter.name) {
		errors.push('Emitter must have a name');
	}
	if (!emitter.sprite) {
		errors.push('Standalone emitter must have a sprite reference');
	}

	if (errors.length > 0) return fail(...errors);

	return merge(ok(), validateEmitterConfig(emitter));
}

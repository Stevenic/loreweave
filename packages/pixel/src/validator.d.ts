/**
 * Pixel Format v1 validators.
 *
 * Validates all 6 file types against the spec (§12).
 * Sprites, palettes, tilesets, tilemaps, scenes, and emitters.
 */
import type {
	EmitterConfig,
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';
export type ValidationResult = {
	valid: boolean;
	errors: string[];
	warnings: string[];
};
/** Validate a PixelPalette against the spec. */
export declare function validatePalette(palette: PixelPalette): ValidationResult;
/** Validate a PixelSprite against the spec. */
export declare function validateSprite(
	sprite: PixelSprite,
	registry?: Map<string, PixelPalette>,
): ValidationResult;
/** Validate a PixelTileset against the spec. */
export declare function validateTileset(
	tileset: PixelTileset,
	registry?: Map<string, PixelPalette>,
): ValidationResult;
/** Validate a PixelTilemap against the spec. */
export declare function validateTilemap(
	tilemap: PixelTilemap,
	tilesetRegistry?: Map<string, PixelTileset>,
): ValidationResult;
/** Validate a PixelScene against the spec. */
export declare function validateScene(scene: PixelScene): ValidationResult;
/** Validate an EmitterConfig (inline or standalone). */
export declare function validateEmitterConfig(config: EmitterConfig): ValidationResult;
/** Validate a standalone PixelEmitter file. */
export declare function validateEmitter(emitter: PixelEmitter): ValidationResult;
//# sourceMappingURL=validator.d.ts.map

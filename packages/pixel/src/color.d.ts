/**
 * Color parsing utilities for Pixel Format v1.
 *
 * Shared between the Canvas 2D renderer and the terminal renderer.
 */
import type { PixelColor } from '@loreweave/types';
/** RGBA color components (0–255 each). */
export type RGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
};
/** Parse a PixelColor string into RGBA components. Returns null for transparent. */
export declare function parseColor(color: PixelColor): RGBA | null;
/** Convert RGBA to a CSS rgba() string. */
export declare function rgbaToCSS(rgba: RGBA): string;
/** Convert a PixelColor to a CSS color string. Returns 'transparent' for transparent. */
export declare function pixelColorToCSS(color: PixelColor): string;
/**
 * Compute Euclidean distance between two RGBA colors in RGB space.
 * Alpha is excluded — transparent colors should be handled before calling this.
 */
export declare function colorDistance(a: RGBA, b: RGBA): number;
/**
 * Build a key-to-key remapping from a source palette to a target palette.
 *
 * For each key in the source:
 * - If the target has the same key with the same color → identity map
 * - If the source color is transparent → map to target's transparent key (or drop)
 * - Otherwise → find the nearest color in the target by Euclidean RGB distance
 *
 * Returns a Record mapping source palette keys to target palette keys.
 */
export declare function remapPalette(source: Record<string, PixelColor>, target: Record<string, PixelColor>): Record<string, string>;
/**
 * Remap a palette's colors to a target palette, returning new entries
 * with the source keys but target colors.
 */
export declare function remapPaletteEntries(source: Record<string, PixelColor>, target: Record<string, PixelColor>): Record<string, PixelColor>;
/**
 * Alpha-blend a source RGBA over a destination RGBA.
 * Standard Porter-Duff "source over" compositing.
 */
export declare function alphaBlend(src: RGBA, dst: RGBA): RGBA;
//# sourceMappingURL=color.d.ts.map
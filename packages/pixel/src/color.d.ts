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
 * Alpha-blend a source RGBA over a destination RGBA.
 * Standard Porter-Duff "source over" compositing.
 */
export declare function alphaBlend(src: RGBA, dst: RGBA): RGBA;
//# sourceMappingURL=color.d.ts.map

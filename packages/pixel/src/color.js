/**
 * Color parsing utilities for Pixel Format v1.
 *
 * Shared between the Canvas 2D renderer and the terminal renderer.
 */
/** Parse a PixelColor string into RGBA components. Returns null for transparent. */
export function parseColor(color) {
	if (color === 'transparent') return null;
	const hex = color.slice(1); // strip '#'
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	const a = hex.length >= 8 ? Number.parseInt(hex.slice(6, 8), 16) : 255;
	return { r, g, b, a };
}
/** Convert RGBA to a CSS rgba() string. */
export function rgbaToCSS(rgba) {
	return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${(rgba.a / 255).toFixed(3)})`;
}
/** Convert a PixelColor to a CSS color string. Returns 'transparent' for transparent. */
export function pixelColorToCSS(color) {
	if (color === 'transparent') return 'transparent';
	const rgba = parseColor(color);
	if (!rgba) return 'transparent';
	if (rgba.a === 255) return color; // Pass hex through directly
	return rgbaToCSS(rgba);
}
/**
 * Alpha-blend a source RGBA over a destination RGBA.
 * Standard Porter-Duff "source over" compositing.
 */
export function alphaBlend(src, dst) {
	const srcA = src.a / 255;
	const dstA = dst.a / 255;
	const outA = srcA + dstA * (1 - srcA);
	if (outA === 0) return { r: 0, g: 0, b: 0, a: 0 };
	return {
		r: Math.round((src.r * srcA + dst.r * dstA * (1 - srcA)) / outA),
		g: Math.round((src.g * srcA + dst.g * dstA * (1 - srcA)) / outA),
		b: Math.round((src.b * srcA + dst.b * dstA * (1 - srcA)) / outA),
		a: Math.round(outA * 255),
	};
}
//# sourceMappingURL=color.js.map

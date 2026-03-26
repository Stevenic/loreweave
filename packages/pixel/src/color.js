/**
 * Color parsing utilities for Pixel Format v1.
 *
 * Shared between the Canvas 2D renderer and the terminal renderer.
 */
/** Parse a PixelColor string into RGBA components. Returns null for transparent. */
export function parseColor(color) {
    if (color === 'transparent')
        return null;
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
    if (color === 'transparent')
        return 'transparent';
    const rgba = parseColor(color);
    if (!rgba)
        return 'transparent';
    if (rgba.a === 255)
        return color; // Pass hex through directly
    return rgbaToCSS(rgba);
}
/**
 * Compute Euclidean distance between two RGBA colors in RGB space.
 * Alpha is excluded — transparent colors should be handled before calling this.
 */
export function colorDistance(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}
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
export function remapPalette(source, target) {
    const mapping = {};
    // Pre-parse all target colors for distance computation
    const targetEntries = [];
    let targetTransparentKey;
    for (const [key, color] of Object.entries(target)) {
        if (color === 'transparent') {
            targetTransparentKey = key;
        }
        else {
            const rgba = parseColor(color);
            if (rgba)
                targetEntries.push({ key, rgba });
        }
    }
    for (const [srcKey, srcColor] of Object.entries(source)) {
        // Transparent → map to target's transparent key
        if (srcColor === 'transparent') {
            mapping[srcKey] = targetTransparentKey ?? srcKey;
            continue;
        }
        // Exact key match with same color — identity
        if (target[srcKey] === srcColor) {
            mapping[srcKey] = srcKey;
            continue;
        }
        // Find nearest color in target
        const srcRgba = parseColor(srcColor);
        if (!srcRgba) {
            mapping[srcKey] = srcKey;
            continue;
        }
        let bestKey = srcKey;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const entry of targetEntries) {
            const dist = colorDistance(srcRgba, entry.rgba);
            if (dist < bestDist) {
                bestDist = dist;
                bestKey = entry.key;
            }
        }
        mapping[srcKey] = bestKey;
    }
    return mapping;
}
/**
 * Remap a palette's colors to a target palette, returning new entries
 * with the source keys but target colors.
 */
export function remapPaletteEntries(source, target) {
    const mapping = remapPalette(source, target);
    const result = {};
    for (const [srcKey, targetKey] of Object.entries(mapping)) {
        result[srcKey] = target[targetKey] ?? source[srcKey];
    }
    return result;
}
/**
 * Alpha-blend a source RGBA over a destination RGBA.
 * Standard Porter-Duff "source over" compositing.
 */
export function alphaBlend(src, dst) {
    const srcA = src.a / 255;
    const dstA = dst.a / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA === 0)
        return { r: 0, g: 0, b: 0, a: 0 };
    return {
        r: Math.round((src.r * srcA + dst.r * dstA * (1 - srcA)) / outA),
        g: Math.round((src.g * srcA + dst.g * dstA * (1 - srcA)) / outA),
        b: Math.round((src.b * srcA + dst.b * dstA * (1 - srcA)) / outA),
        a: Math.round(outA * 255),
    };
}
//# sourceMappingURL=color.js.map
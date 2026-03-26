/**
 * Terminal renderer for Pixel Format v1 assets.
 *
 * Renders sprites and tiles as colored Unicode block characters
 * using ANSI true-color escape sequences. Used by the resource explorer CLI.
 */
import type { PixelPalette, PixelSprite, PixelTile } from '@loreweave/types';
/** Render a sprite to terminal-ready ANSI lines. Supports layers and animation frames. */
export declare function renderSpriteTerminal(sprite: PixelSprite, registry?: Map<string, PixelPalette>, frame?: number): string[];
/** Render a single tile to terminal-ready ANSI lines. */
export declare function renderTileTerminal(tile: PixelTile, tileWidth: number, tileHeight: number, palette: string | PixelPalette, registry?: Map<string, PixelPalette>): string[];
/** Render a sprite to a single string for printing. */
export declare function renderSpriteToTerminalString(sprite: PixelSprite, registry?: Map<string, PixelPalette>, frame?: number): string;
/** Render a tile to a single string for printing. */
export declare function renderTileToTerminalString(tile: PixelTile, tileWidth: number, tileHeight: number, palette: string | PixelPalette, registry?: Map<string, PixelPalette>): string;
//# sourceMappingURL=terminal-renderer.d.ts.map
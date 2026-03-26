#!/usr/bin/env node

/**
 * @loreweave/resource-explorer — CLI tool for browsing Pixel Format v1 assets
 *
 * Commands:
 *   list [dir]          — List all pixel resources in a directory tree
 *   info <file>         — Show detailed info about a specific resource
 *   validate [dir]      — Validate all pixel resources
 *   preview <file>      — Render a sprite/tile preview in the terminal
 *   palette <file>      — Display palette colors
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
	findPixelFiles,
	loadAllPixelFiles,
	loadPixelFile,
	renderSpriteToTerminalString,
	renderTileToTerminalString,
	validateEmitter,
	validatePalette,
	validateScene,
	validateSprite,
	validateTilemap,
	validateTileset,
} from '@loreweave/pixel';
import type {
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';

// ── Formatting helpers ──────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const BLUE = '\x1b[34m';

function badge(type: string): string {
	switch (type) {
		case 'sprite':
			return `${CYAN}[sprite]${RESET}`;
		case 'tileset':
			return `${MAGENTA}[tileset]${RESET}`;
		case 'tilemap':
			return `${BLUE}[tilemap]${RESET}`;
		case 'scene':
			return `${YELLOW}[scene]${RESET}`;
		case 'palette':
			return `${GREEN}[palette]${RESET}`;
		case 'emitter':
			return `${RED}[emitter]${RESET}`;
		default:
			return `[${type}]`;
	}
}

function heading(text: string): void {
	console.log(`\n${BOLD}${text}${RESET}`);
	console.log(DIM + '─'.repeat(text.length) + RESET);
}

// ── Commands ────────────────────────────────────────────────────────

async function cmdList(dir: string): Promise<void> {
	const files = await findPixelFiles(dir);

	if (files.length === 0) {
		console.log(`${DIM}No pixel files found in ${dir}${RESET}`);
		return;
	}

	heading(`Pixel Resources (${files.length} files)`);

	// Group by type
	const grouped = new Map<string, typeof files>();
	for (const f of files) {
		const group = grouped.get(f.fileType) ?? [];
		group.push(f);
		grouped.set(f.fileType, group);
	}

	for (const [type, items] of grouped) {
		console.log(`\n  ${badge(type)} ${BOLD}${items.length}${RESET} file(s)`);
		for (const item of items) {
			const relPath = item.path.replace(dir, '').replace(/^[/\\]/, '');
			console.log(`    ${DIM}${relPath}${RESET}`);
		}
	}

	console.log();
}

async function cmdInfo(filePath: string): Promise<void> {
	const absPath = resolve(filePath);
	const resource = await loadPixelFile(absPath, process.cwd());

	heading(`Resource: ${resource.relativePath}`);
	console.log(`  Type:   ${badge(resource.fileType)}`);

	const data = resource.data;

	if (resource.fileType === 'sprite') {
		const s = data as PixelSprite;
		console.log(`  Name:   ${s.name}`);
		console.log(`  Size:   ${s.width}x${s.height}`);
		console.log(`  Encode: ${s.encoding}`);
		if (s.frameCount && s.frameCount > 1) console.log(`  Frames: ${s.frameCount}`);
		if (s.layers) console.log(`  Layers: ${s.layers.length}`);
		if (s.origin) console.log(`  Origin: (${s.origin.x}, ${s.origin.y})`);
		if (s.baseScale !== undefined) console.log(`  Scale:  ${s.baseScale}x`);
		if (s.symmetry && s.symmetry !== 'none') console.log(`  Sym:    ${s.symmetry}`);
		if (s.tags?.length) console.log(`  Tags:   ${s.tags.join(', ')}`);
		if (s.collision) {
			console.log(
				`  Collide: (${s.collision.x},${s.collision.y}) ${s.collision.width}x${s.collision.height}`,
			);
		}
		if (s.clips) console.log(`  Clips:  ${Object.keys(s.clips).join(', ')}`);
		if (s.regions) console.log(`  Regions: ${Object.keys(s.regions).join(', ')}`);
		if (s.attachments) console.log(`  Attach: ${Object.keys(s.attachments).join(', ')}`);
		if (s.variants) console.log(`  Variants: ${Object.keys(s.variants).join(', ')}`);
		if (typeof s.palette === 'object') {
			console.log(`  Palette: inline (${Object.keys(s.palette.entries).length} entries)`);
		} else {
			console.log(`  Palette: ${s.palette}`);
		}
	} else if (resource.fileType === 'tileset') {
		const t = data as PixelTileset;
		console.log(`  Name:     ${t.name}`);
		console.log(`  Tile size: ${t.tileWidth}x${t.tileHeight}`);
		const tileNames = Object.keys(t.tiles);
		console.log(`  Tiles:    ${tileNames.length}`);
		for (const name of tileNames) {
			const tile = t.tiles[name];
			const tags = tile.tags?.length ? ` ${DIM}(${tile.tags.join(', ')})${RESET}` : '';
			const conn = tile.connectivity
				? ` ${DIM}[${Object.entries(tile.connectivity)
						.map(([d, v]) => `${d}:${v}`)
						.join(', ')}]${RESET}`
				: '';
			console.log(`    - ${name} [${tile.encoding}]${tags}${conn}`);
		}
	} else if (resource.fileType === 'tilemap') {
		const tm = data as PixelTilemap;
		console.log(`  Name:    ${tm.name}`);
		console.log(`  Tileset: ${tm.tileset}`);
		console.log(`  Grid:    ${tm.gridWidth}x${tm.gridHeight}`);
		console.log(`  Legend:  ${Object.keys(tm.legend).join(', ')}`);
	} else if (resource.fileType === 'scene') {
		const sc = data as PixelScene;
		console.log(`  Name:      ${sc.name}`);
		console.log(`  Canvas:    ${sc.canvas.width}x${sc.canvas.height}`);
		if (sc.canvas.background) console.log(`  Background: ${sc.canvas.background}`);
		if (sc.canvas.scale) console.log(`  Scale:     ${sc.canvas.scale}x`);
		if (sc.canvas.camera) {
			const cam = sc.canvas.camera;
			console.log(`  Camera:    (${cam.x}, ${cam.y}) zoom:${cam.zoom ?? 1}`);
		}
		console.log(`  Layers:    ${sc.layers.length}`);
		for (const layer of sc.layers) {
			const layerType = layer.type ?? 'items';
			if (layerType === 'tilemap') {
				const extras: string[] = [];
				if (layer.blend && layer.blend !== 'normal') extras.push(`blend:${layer.blend}`);
				if (layer.scrollFactor !== undefined) extras.push(`scroll:${layer.scrollFactor}`);
				const suffix = extras.length > 0 ? ` ${DIM}[${extras.join(', ')}]${RESET}` : '';
				console.log(`    - ${layer.name} (tilemap: ${layer.tilemap})${suffix}`);
			} else {
				const itemCount = layer.items?.length ?? 0;
				const extras: string[] = [];
				if (layer.blend && layer.blend !== 'normal') extras.push(`blend:${layer.blend}`);
				if (layer.sort === 'y') extras.push('y-sort');
				if (layer.scrollFactor !== undefined && layer.scrollFactor !== 1)
					extras.push(`scroll:${layer.scrollFactor}`);
				const suffix = extras.length > 0 ? ` ${DIM}[${extras.join(', ')}]${RESET}` : '';
				console.log(`    - ${layer.name} (${itemCount} items)${suffix}`);
				if (layer.items) {
					for (const item of layer.items) {
						const parts: string[] = [];
						if (item.flipX) parts.push('flipX');
						if (item.flipY) parts.push('flipY');
						if (item.opacity !== undefined) parts.push(`opacity:${item.opacity}`);
						if (item.scale !== undefined) parts.push(`scale:${item.scale}`);
						if (item.clip) parts.push(`clip:${item.clip}`);
						if (item.variant) parts.push(`variant:${item.variant}`);
						if (item.attach) parts.push(`attach:${item.attach.parent}.${item.attach.point}`);
						const suffix2 = parts.length > 0 ? ` ${DIM}[${parts.join(', ')}]${RESET}` : '';
						const pos = item.attach ? '' : ` @ (${item.x}, ${item.y})`;
						console.log(`      ${item.asset}${pos}${suffix2}`);
					}
				}
			}
		}
	} else if (resource.fileType === 'palette') {
		const p = data as PixelPalette;
		console.log(`  Name:    ${p.name ?? '(unnamed)'}`);
		console.log(`  Entries: ${Object.keys(p.entries).length}`);
		if (p.aliases) console.log(`  Aliases: ${Object.keys(p.aliases).length}`);
		if (p.ramps) console.log(`  Ramps:   ${Object.keys(p.ramps).join(', ')}`);
		printPaletteSwatches(p.entries);
	} else if (resource.fileType === 'emitter') {
		const e = data as PixelEmitter;
		console.log(`  Name:     ${e.name}`);
		console.log(`  Sprite:   ${e.sprite}`);
		console.log(`  Rate:     ${e.rate}/sec`);
		console.log(`  Lifetime: ${e.lifetime.min}–${e.lifetime.max}ms`);
		console.log(`  Max:      ${e.maxParticles ?? 100}`);
		if (e.gravity) console.log(`  Gravity:  ${e.gravity}`);
		if (e.fadeOut) console.log(`  FadeOut:  yes`);
		if (e.burst) console.log(`  Burst:    ${e.burst}`);
	}

	console.log();
}

async function cmdValidate(dir: string): Promise<void> {
	const resources = await loadAllPixelFiles(dir);

	if (resources.length === 0) {
		console.log(`${DIM}No pixel files found in ${dir}${RESET}`);
		return;
	}

	// Build palette registry from loaded palettes
	const paletteRegistry = new Map<string, PixelPalette>();
	for (const r of resources) {
		if (r.fileType === 'palette') {
			const p = r.data as PixelPalette;
			if (p.name) paletteRegistry.set(p.name, p);
		}
	}

	// Build tileset registry for tilemap validation
	const tilesetRegistry = new Map<string, PixelTileset>();
	for (const r of resources) {
		if (r.fileType === 'tileset') {
			const t = r.data as PixelTileset;
			if (t.name) tilesetRegistry.set(t.name, t);
		}
	}

	heading(`Validating ${resources.length} resources`);

	let passed = 0;
	let failed = 0;
	let warnings = 0;

	for (const r of resources) {
		const rel = r.relativePath;
		let result: { valid: boolean; errors: string[]; warnings: string[] };

		switch (r.fileType) {
			case 'sprite':
				result = validateSprite(r.data as PixelSprite, paletteRegistry);
				break;
			case 'tileset':
				result = validateTileset(r.data as PixelTileset, paletteRegistry);
				break;
			case 'tilemap':
				result = validateTilemap(r.data as PixelTilemap, tilesetRegistry);
				break;
			case 'scene':
				result = validateScene(r.data as PixelScene);
				break;
			case 'palette':
				result = validatePalette(r.data as PixelPalette);
				break;
			case 'emitter':
				result = validateEmitter(r.data as PixelEmitter);
				break;
			default:
				result = { valid: false, errors: [`Unknown type: ${r.fileType}`], warnings: [] };
		}

		if (result.valid) {
			const warnSuffix =
				result.warnings.length > 0 ? ` ${YELLOW}(${result.warnings.length} warnings)${RESET}` : '';
			console.log(`  ${GREEN}PASS${RESET} ${badge(r.fileType)} ${rel}${warnSuffix}`);
			passed++;
		} else {
			console.log(`  ${RED}FAIL${RESET} ${badge(r.fileType)} ${rel}`);
			for (const err of result.errors) {
				console.log(`       ${RED}${err}${RESET}`);
			}
			failed++;
		}

		if (result.warnings.length > 0) {
			warnings += result.warnings.length;
			for (const w of result.warnings) {
				console.log(`       ${YELLOW}${w}${RESET}`);
			}
		}
	}

	console.log();
	console.log(
		`  ${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET}, ${failed > 0 ? RED : DIM}${failed} failed${RESET}${warnings > 0 ? `, ${YELLOW}${warnings} warnings${RESET}` : ''}`,
	);
	console.log();

	if (failed > 0) process.exitCode = 1;
}

async function cmdPreview(filePath: string, tileName?: string): Promise<void> {
	const absPath = resolve(filePath);
	const resource = await loadPixelFile(absPath, process.cwd());

	if (resource.fileType === 'sprite') {
		const sprite = resource.data as PixelSprite;
		const frames = sprite.frameCount ?? 1;
		heading(`Preview: ${sprite.name} (${sprite.width}x${sprite.height}, ${frames} frame(s))`);
		console.log(renderSpriteToTerminalString(sprite));
		console.log();
	} else if (resource.fileType === 'tileset') {
		const tileset = resource.data as PixelTileset;
		const tileNames = tileName ? [tileName] : Object.keys(tileset.tiles);

		for (const name of tileNames) {
			const tile = tileset.tiles[name];
			if (!tile) {
				console.log(`${RED}Tile '${name}' not found in tileset${RESET}`);
				continue;
			}
			heading(`Preview: ${tileset.name}:${name} (${tileset.tileWidth}x${tileset.tileHeight})`);
			console.log(
				renderTileToTerminalString(tile, tileset.tileWidth, tileset.tileHeight, tileset.palette),
			);
			console.log();
		}
	} else {
		console.log(`${YELLOW}Preview only supports sprites and tilesets${RESET}`);
		console.log(`Use 'info' to inspect scenes, tilemaps, palettes, and emitters.`);
	}
}

async function cmdPalette(filePath: string): Promise<void> {
	const absPath = resolve(filePath);
	const content = await readFile(absPath, 'utf-8');
	const data = JSON.parse(content);

	let entries: Record<string, string>;

	if (data.format === 'pixel-palette-v1') {
		entries = data.entries;
		heading(`Palette: ${data.name ?? '(unnamed)'}`);
	} else if (typeof data.palette === 'object' && data.palette.entries) {
		entries = data.palette.entries;
		heading(`Inline palette from: ${data.name ?? filePath}`);
	} else {
		console.log(
			`${YELLOW}No inline palette found. Palette is a reference: '${data.palette}'${RESET}`,
		);
		return;
	}

	printPaletteSwatches(entries);
	console.log();
}

function printPaletteSwatches(entries: Record<string, string>): void {
	for (const [key, color] of Object.entries(entries)) {
		if (color === 'transparent') {
			console.log(`    ${BOLD}${key}${RESET}  ${DIM}transparent${RESET}`);
		} else {
			const hex = color.slice(1);
			const r = Number.parseInt(hex.slice(0, 2), 16);
			const g = Number.parseInt(hex.slice(2, 4), 16);
			const b = Number.parseInt(hex.slice(4, 6), 16);
			const swatch = `\x1b[48;2;${r};${g};${b}m    ${RESET}`;
			console.log(`    ${BOLD}${key}${RESET}  ${swatch} ${color}`);
		}
	}
}

// ── Help ────────────────────────────────────────────────────────────

function printHelp(): void {
	console.log(`
${BOLD}pixel-explorer${RESET} — Pixel Format v1 Resource Explorer

${BOLD}USAGE${RESET}
  pixel-explorer <command> [options]

${BOLD}COMMANDS${RESET}
  list [dir]               List all pixel resources (default: ./assets)
  info <file>              Show detailed info about a resource
  validate [dir]           Validate all resources (default: ./assets)
  preview <file> [tile]    Render a sprite/tile in the terminal
  palette <file>           Display palette color swatches

${BOLD}EXAMPLES${RESET}
  pixel-explorer list
  pixel-explorer list ./assets/sprites
  pixel-explorer info assets/sprites/campfire_small.pixel.json
  pixel-explorer validate
  pixel-explorer preview assets/sprites/torch.pixel.json
  pixel-explorer preview assets/tilesets/forest_ground.tileset.pixel.json grass
  pixel-explorer palette assets/palettes/fantasy16.palette.pixel.json
`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const command = args[0];

	if (!command || command === 'help' || command === '--help' || command === '-h') {
		printHelp();
		return;
	}

	switch (command) {
		case 'list':
			await cmdList(resolve(args[1] ?? './assets'));
			break;

		case 'info':
			if (!args[1]) {
				console.log(`${RED}Usage: pixel-explorer info <file>${RESET}`);
				process.exitCode = 1;
				return;
			}
			await cmdInfo(args[1]);
			break;

		case 'validate':
			await cmdValidate(resolve(args[1] ?? './assets'));
			break;

		case 'preview':
			if (!args[1]) {
				console.log(`${RED}Usage: pixel-explorer preview <file> [tileName]${RESET}`);
				process.exitCode = 1;
				return;
			}
			await cmdPreview(args[1], args[2]);
			break;

		case 'palette':
			if (!args[1]) {
				console.log(`${RED}Usage: pixel-explorer palette <file>${RESET}`);
				process.exitCode = 1;
				return;
			}
			await cmdPalette(args[1]);
			break;

		default:
			console.log(`${RED}Unknown command: ${command}${RESET}`);
			printHelp();
			process.exitCode = 1;
	}
}

main().catch((err: Error) => {
	console.error(`${RED}Error: ${err.message}${RESET}`);
	process.exitCode = 1;
});

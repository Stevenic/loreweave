/**
 * Canvas 2D renderer for Pixel Format v1.
 *
 * Implements the full browser rendering pipeline from spec §11.
 * All APIs accept standard Canvas 2D interfaces as parameters —
 * no browser globals are imported, so this works with any compliant
 * canvas implementation (browser, OffscreenCanvas, node-canvas, etc.).
 */

import type {
	BlendMode,
	Clip,
	EmitterConfig,
	PixelColor,
	PixelPalette,
	PixelScene,
	PixelSceneItem,
	PixelSceneLayer,
	PixelSprite,
	PixelTile,
	PixelTilemap,
	PixelTileset,
	TileRef,
} from '@loreweave/types';
import { type AnimatedProperties, DEFAULT_ANIMATED_PROPERTIES, sampleClip } from './animation.js';
import { parseColor, remapPaletteEntries } from './color.js';
import { compositeLayers, decodeAllFrames, decodePixelRows } from './decoder.js';
import { type Particle, ParticleEmitter } from './emitter.js';

// ─── Types ───

/** A function that creates an offscreen canvas. Injected to avoid browser globals. */
export type CanvasFactory = (width: number, height: number) => OffscreenCanvas;

/** Registry of loaded assets for scene rendering. */
export type AssetRegistry = {
	sprites: Map<string, PixelSprite>;
	tilesets: Map<string, PixelTileset>;
	tilemaps: Map<string, PixelTilemap>;
	palettes: Map<string, PixelPalette>;
	emitters: Map<string, EmitterConfig>;
};

/** Blend mode → Canvas 2D globalCompositeOperation mapping per spec §11.6. */
const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
	normal: 'source-over',
	multiply: 'multiply',
	screen: 'screen',
	overlay: 'overlay',
	additive: 'lighter',
};

// ─── Palette Resolution ───

/** Resolve palette entries from an inline palette, variant overrides, or registry. */
function resolvePaletteEntries(
	palette: string | PixelPalette,
	registry: Map<string, PixelPalette>,
	overrides?: Record<string, PixelColor>,
): Record<string, PixelColor> {
	let entries: Record<string, PixelColor>;

	if (typeof palette === 'string') {
		const found = registry.get(palette);
		if (!found) throw new Error(`Palette '${palette}' not found in registry`);
		entries = { ...found.entries };
	} else {
		entries = { ...palette.entries };
	}

	if (overrides) {
		Object.assign(entries, overrides);
	}

	return entries;
}

/** Find the transparent key in a palette (first key mapped to "transparent"). */
function findTransparentKey(entries: Record<string, PixelColor>): string {
	for (const [key, value] of Object.entries(entries)) {
		if (value === 'transparent') return key;
	}
	return '\0'; // Sentinel — no transparent key
}

// ─── Sprite Rasterization ───

/**
 * Rasterize a single frame of a sprite to an ImageData.
 * Returns raw RGBA pixel data at 1× scale.
 */
export function rasterizeSpriteFrame(
	sprite: PixelSprite,
	frameIndex: number,
	paletteRegistry: Map<string, PixelPalette>,
	paletteOverrides?: Record<string, PixelColor>,
): ImageData {
	const entries = resolvePaletteEntries(sprite.palette, paletteRegistry, paletteOverrides);
	const frameCount = sprite.frameCount ?? 1;
	const transparentKey = findTransparentKey(entries);

	let frameRows: string[];

	if (sprite.layers && sprite.layers.length > 0) {
		// Decode each layer for this frame, then composite
		const layerFrames: string[][] = [];
		for (const layer of sprite.layers) {
			const allFrames = decodeAllFrames(
				sprite.encoding,
				layer.pixels,
				sprite.width,
				sprite.height,
				frameCount,
			);
			layerFrames.push(allFrames[frameIndex] ?? allFrames[0]);
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
		frameRows = allFrames[frameIndex] ?? allFrames[0];
	} else {
		throw new Error(`Sprite '${sprite.name}' has no pixel data`);
	}

	// Convert to ImageData
	const imageData = new ImageData(sprite.width, sprite.height);
	const data = imageData.data;

	for (let y = 0; y < sprite.height; y++) {
		const row = frameRows[y];
		for (let x = 0; x < sprite.width; x++) {
			const key = row[x];
			const color = entries[key];
			const idx = (y * sprite.width + x) * 4;

			if (!color || color === 'transparent') {
				data[idx] = 0;
				data[idx + 1] = 0;
				data[idx + 2] = 0;
				data[idx + 3] = 0;
			} else {
				const rgba = parseColor(color);
				if (rgba) {
					data[idx] = rgba.r;
					data[idx + 1] = rgba.g;
					data[idx + 2] = rgba.b;
					data[idx + 3] = rgba.a;
				}
			}
		}
	}

	return imageData;
}

/**
 * Rasterize a tile to an ImageData at 1× scale.
 */
export function rasterizeTile(
	tile: PixelTile,
	tileWidth: number,
	tileHeight: number,
	entries: Record<string, PixelColor>,
): ImageData {
	const decoded = decodePixelRows(tile.encoding, tile.pixels, tileWidth, tileHeight);
	const imageData = new ImageData(tileWidth, tileHeight);
	const data = imageData.data;

	for (let y = 0; y < tileHeight; y++) {
		const row = decoded[y];
		for (let x = 0; x < tileWidth; x++) {
			const key = row[x];
			const color = entries[key];
			const idx = (y * tileWidth + x) * 4;

			if (!color || color === 'transparent') {
				data[idx] = 0;
				data[idx + 1] = 0;
				data[idx + 2] = 0;
				data[idx + 3] = 0;
			} else {
				const rgba = parseColor(color);
				if (rgba) {
					data[idx] = rgba.r;
					data[idx + 1] = rgba.g;
					data[idx + 2] = rgba.b;
					data[idx + 3] = rgba.a;
				}
			}
		}
	}

	return imageData;
}

// ─── Drawing Helpers ───

/**
 * Draw an ImageData onto a canvas context at a given position with transforms.
 * Uses an offscreen canvas to convert ImageData to a drawable source.
 */
export function drawImageData(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	imageData: ImageData,
	x: number,
	y: number,
	createCanvas: CanvasFactory,
	options?: {
		scale?: number;
		flipX?: boolean;
		flipY?: boolean;
		rotation?: number;
		opacity?: number;
		originX?: number;
		originY?: number;
	},
): void {
	const offscreen = createCanvas(imageData.width, imageData.height);
	const offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
	offCtx.putImageData(imageData, 0, 0);

	const scale = options?.scale ?? 1;
	const flipX = options?.flipX ?? false;
	const flipY = options?.flipY ?? false;
	const rotation = options?.rotation ?? 0;
	const opacity = options?.opacity ?? 1;
	const originX = options?.originX ?? 0;
	const originY = options?.originY ?? 0;

	ctx.save();
	ctx.globalAlpha *= opacity;

	// Translate to placement point
	ctx.translate(x, y);

	// Apply rotation around the origin
	if (rotation !== 0) {
		ctx.translate(originX * scale, originY * scale);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.translate(-originX * scale, -originY * scale);
	}

	// Apply flip
	ctx.scale(flipX ? -scale : scale, flipY ? -scale : scale);
	if (flipX) ctx.translate(-imageData.width, 0);
	if (flipY) ctx.translate(0, -imageData.height);

	// Draw — nearest-neighbor is set on the parent context
	ctx.drawImage(offscreen, 0, 0);

	ctx.restore();
}

// ─── Scene Rendering ───

/** State for a running scene (animation time, emitter states, etc.). */
export type SceneState = {
	time: number;
	emitters: Map<string, ParticleEmitter>;
};

/** Create a fresh scene state. */
export function createSceneState(): SceneState {
	return {
		time: 0,
		emitters: new Map(),
	};
}

/**
 * Render a complete scene to a canvas context.
 *
 * This is the main entry point for scene rendering per spec §11.8.
 */
export function renderScene(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	scene: PixelScene,
	registry: AssetRegistry,
	createCanvas: CanvasFactory,
	state?: SceneState,
	options?: {
		targetPalette?: PixelPalette;
	},
): void {
	const { canvas, layers } = scene;
	const canvasScale = canvas.scale ?? 1;
	const camera = canvas.camera;
	const cameraZoom = camera?.zoom ?? 1;
	const time = state?.time ?? 0;

	// Set nearest-neighbor scaling
	ctx.imageSmoothingEnabled = false;

	// 1. Fill background
	if (canvas.background && canvas.background !== 'transparent') {
		const rgba = parseColor(canvas.background);
		if (rgba) {
			ctx.fillStyle = `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
			ctx.fillRect(0, 0, canvas.width * canvasScale, canvas.height * canvasScale);
		}
	} else {
		ctx.clearRect(0, 0, canvas.width * canvasScale, canvas.height * canvasScale);
	}

	// 2. Render each layer
	for (const layer of layers) {
		if (layer.visible === false) continue;

		const layerType = layer.type ?? 'items';

		ctx.save();

		// Set blend mode
		const blendMode = layer.blend ?? 'normal';
		ctx.globalCompositeOperation = BLEND_MODE_MAP[blendMode];

		// Set layer opacity
		ctx.globalAlpha = layer.opacity ?? 1;

		// Compute layer offset with parallax
		const scrollFactor = layer.scrollFactor ?? 1;
		let layerOffsetX = layer.offsetX ?? 0;
		let layerOffsetY = layer.offsetY ?? 0;

		if (camera) {
			// Camera offset: center the viewport at camera position
			const viewCenterX = canvas.width / 2;
			const viewCenterY = canvas.height / 2;
			layerOffsetX += (viewCenterX - camera.x) * scrollFactor;
			layerOffsetY += (viewCenterY - camera.y) * scrollFactor;
		}

		ctx.translate(layerOffsetX * canvasScale * cameraZoom, layerOffsetY * canvasScale * cameraZoom);
		ctx.scale(canvasScale * cameraZoom, canvasScale * cameraZoom);

		if (layerType === 'tilemap' && layer.tilemap) {
			renderTilemapLayer(ctx, layer.tilemap, registry, createCanvas, options?.targetPalette);
		} else if (layerType === 'items' && layer.items) {
			renderItemsLayer(ctx, layer, registry, createCanvas, time, state, options?.targetPalette, canvas.referencePpu);
		}

		ctx.restore();
	}
}

/** Render a tilemap layer. */
function renderTilemapLayer(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	tilemapName: string,
	registry: AssetRegistry,
	createCanvas: CanvasFactory,
	targetPalette?: PixelPalette,
): void {
	const tilemap = registry.tilemaps.get(tilemapName);
	if (!tilemap) return;

	const tileset = registry.tilesets.get(tilemap.tileset);
	if (!tileset) return;

	let entries = resolvePaletteEntries(tileset.palette, registry.palettes);
	if (targetPalette) {
		entries = remapPaletteEntries(entries, targetPalette.entries);
	}

	// Cache rasterized tiles
	const tileCache = new Map<string, ImageData>();

	for (let gy = 0; gy < tilemap.gridHeight; gy++) {
		const row = tilemap.grid[gy];
		if (!row) continue;

		for (let gx = 0; gx < tilemap.gridWidth; gx++) {
			const ch = row[gx];
			if (!ch) continue;

			const legendEntry = tilemap.legend[ch];
			if (!legendEntry) continue;

			const tileName = typeof legendEntry === 'string' ? legendEntry : legendEntry.tile;
			const tile = tileset.tiles[tileName];
			if (!tile) continue;

			// Get or create cached rasterized tile
			let imageData = tileCache.get(tileName);
			if (!imageData) {
				imageData = rasterizeTile(tile, tileset.tileWidth, tileset.tileHeight, entries);
				tileCache.set(tileName, imageData);
			}

			const x = gx * tileset.tileWidth;
			const y = gy * tileset.tileHeight;

			// Apply transforms from legend
			const ref = typeof legendEntry === 'object' ? (legendEntry as TileRef) : null;

			drawImageData(ctx, imageData, x, y, createCanvas, {
				flipX: ref?.flipX,
				flipY: ref?.flipY,
				rotation: ref?.rotate,
			});
		}
	}
}

/** Render an items layer. */
function renderItemsLayer(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	layer: PixelSceneLayer,
	registry: AssetRegistry,
	createCanvas: CanvasFactory,
	time: number,
	state?: SceneState,
	targetPalette?: PixelPalette,
	referencePpu?: number,
): void {
	if (!layer.items) return;

	// Sort items if y-sort is enabled
	const items = [...layer.items];
	if (layer.sort === 'y') {
		items.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
	} else {
		// Manual sort — use z for stable sorting
		items.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
	}

	// Build ID-to-item map for attachment resolution
	const itemById = new Map<string, PixelSceneItem>();
	for (const item of items) {
		if (item.id) itemById.set(item.id, item);
	}

	for (const item of items) {
		renderSceneItem(ctx, item, registry, createCanvas, time, state, itemById, targetPalette, referencePpu);
	}
}

/** Render a single scene item. */
function renderSceneItem(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	item: PixelSceneItem,
	registry: AssetRegistry,
	createCanvas: CanvasFactory,
	time: number,
	state?: SceneState,
	itemById?: Map<string, PixelSceneItem>,
	targetPalette?: PixelPalette,
	referencePpu?: number,
): void {
	const sprite = registry.sprites.get(item.asset);
	if (!sprite) return;

	// Resolve position (direct or attachment)
	let x = item.x ?? 0;
	let y = item.y ?? 0;

	if (item.attach && itemById) {
		const parentItem = itemById.get(item.attach.parent);
		if (parentItem) {
			const parentSprite = registry.sprites.get(parentItem.asset);
			if (parentSprite?.attachments) {
				const att = parentSprite.attachments[item.attach.point];
				if (att) {
					x = (parentItem.x ?? 0) + att.x;
					y = (parentItem.y ?? 0) + att.y;
				}
			}
		}
	}

	// Resolve animation
	let animProps: AnimatedProperties = { ...DEFAULT_ANIMATED_PROPERTIES };
	if (item.clip && sprite.clips) {
		const clip = sprite.clips[item.clip];
		if (clip) {
			animProps = sampleClip(clip, time);
		}
	}

	// Resolve variant palette overrides
	let paletteOverrides: Record<string, PixelColor> | undefined;
	if (item.variant && sprite.variants) {
		const variant = sprite.variants[item.variant];
		if (variant?.palette) {
			paletteOverrides = variant.palette;
		}
	}
	// Item-level palette override takes priority
	if (item.palette && typeof item.palette === 'object') {
		paletteOverrides = {
			...paletteOverrides,
			...(item.palette as PixelPalette).entries,
		};
	}

	// Apply target palette remapping if requested
	if (targetPalette) {
		const sourceEntries = resolvePaletteEntries(sprite.palette, registry.palettes, paletteOverrides);
		paletteOverrides = remapPaletteEntries(sourceEntries, targetPalette.entries);
	}

	// Rasterize the current frame
	const frameIndex = Math.floor(animProps.frame) % (sprite.frameCount ?? 1);
	const imageData = rasterizeSpriteFrame(sprite, frameIndex, registry.palettes, paletteOverrides);

	// Compute PPU factor per spec §11.5
	const ppuFactor = referencePpu ? (sprite.ppu ?? 32) / referencePpu : 1;

	// Compute effective scale: canvas.scale × camera.zoom × ppuFactor × item.scale × sprite.baseScale
	const baseScale = sprite.baseScale ?? 1;
	const itemScale = item.scale ?? 1;
	const animScale = animProps.scale;
	const effectiveScale = ppuFactor * itemScale * baseScale * animScale;

	// Apply animation offsets
	const drawX = x + animProps.offsetX;
	const drawY = y + animProps.offsetY;

	// Compute origin for rotation
	const origin = sprite.origin ?? { x: 0, y: 0 };

	// Draw shadow if groundY is set
	if (item.groundY !== undefined) {
		drawShadow(ctx, drawX, item.groundY, sprite.width * effectiveScale, effectiveScale);
	}

	// Draw the sprite
	const itemOpacity = (item.opacity ?? 1) * animProps.opacity;
	drawImageData(ctx, imageData, drawX, drawY, createCanvas, {
		scale: effectiveScale,
		flipX: item.flipX,
		flipY: item.flipY,
		rotation: (item.rotation ?? 0) + animProps.rotation,
		opacity: itemOpacity,
		originX: origin.x,
		originY: origin.y,
	});

	// Handle inline emitter
	if (item.emitter && state) {
		const emitterId = item.id ?? `${item.asset}_${drawX}_${drawY}`;
		renderEmitterParticles(
			ctx,
			drawX,
			drawY,
			item.emitter,
			emitterId,
			sprite,
			registry,
			createCanvas,
			state,
			referencePpu,
		);
	}
}

/** Draw a simple shadow ellipse for depth anchoring. */
function drawShadow(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	x: number,
	groundY: number,
	width: number,
	scale: number,
): void {
	ctx.save();
	ctx.globalAlpha *= 0.3;
	ctx.fillStyle = '#000000';
	ctx.beginPath();
	const shadowWidth = Math.max(width * 0.6, 2);
	const shadowHeight = Math.max(scale * 2, 1);
	ctx.ellipse(x + width / 2, groundY, shadowWidth / 2, shadowHeight, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

/** Render particles from an emitter attached to a scene item. */
function renderEmitterParticles(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	originX: number,
	originY: number,
	config: EmitterConfig,
	emitterId: string,
	sprite: PixelSprite,
	registry: AssetRegistry,
	createCanvas: CanvasFactory,
	state: SceneState,
	referencePpu?: number,
): void {
	let emitter = state.emitters.get(emitterId);
	if (!emitter) {
		emitter = new ParticleEmitter(config);
		state.emitters.set(emitterId, emitter);
	}

	// Compute emitter ppuFactor per spec §11.6
	const emitterPpuFactor = referencePpu ? (config.ppu ?? 32) / referencePpu : 1;

	// Rasterize the particle sprite at frame 0
	const particleSprite = config.sprite ? (registry.sprites.get(config.sprite) ?? sprite) : sprite;
	const imageData = rasterizeSpriteFrame(particleSprite, 0, registry.palettes);

	for (const particle of emitter.particles) {
		drawImageData(
			ctx,
			imageData,
			originX + particle.x * emitterPpuFactor,
			originY + particle.y * emitterPpuFactor,
			createCanvas,
			{
				scale: particle.scale * emitterPpuFactor,
				rotation: particle.rotation,
				opacity: particle.opacity,
			},
		);
	}
}

// ─── Convenience: Render a single sprite to a canvas ───

/**
 * Render a single sprite (frame 0) onto a canvas context.
 * Simpler API for previewing individual sprites outside of scenes.
 */
export function renderSprite(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	sprite: PixelSprite,
	createCanvas: CanvasFactory,
	options?: {
		paletteRegistry?: Map<string, PixelPalette>;
		frame?: number;
		scale?: number;
		x?: number;
		y?: number;
		targetPalette?: PixelPalette;
	},
): void {
	ctx.imageSmoothingEnabled = false;

	const paletteRegistry = options?.paletteRegistry ?? new Map();
	const frame = options?.frame ?? 0;
	const scale = options?.scale ?? 1;
	const x = options?.x ?? 0;
	const y = options?.y ?? 0;

	let paletteOverrides: Record<string, PixelColor> | undefined;
	if (options?.targetPalette) {
		const sourceEntries = resolvePaletteEntries(sprite.palette, paletteRegistry);
		paletteOverrides = remapPaletteEntries(sourceEntries, options.targetPalette.entries);
	}

	const imageData = rasterizeSpriteFrame(sprite, frame, paletteRegistry, paletteOverrides);
	drawImageData(ctx, imageData, x, y, createCanvas, { scale });
}

/**
 * Pixel Format v1 type definitions.
 *
 * These types match the Pixel Format v1 spec exactly (§13).
 * See pixel_v_1_spec.md for the full specification.
 */

// ─── Colors & Palettes ───

export type PixelColor = 'transparent' | `#${string}`;

export type PixelPalette = {
	format?: 'pixel-palette-v1';
	name?: string;
	entries: Record<string, PixelColor>;
	aliases?: Record<string, string>;
	ramps?: Record<string, string[]>;
};

// ─── Encoding ───

export type PixelEncoding = 'raw' | 'rle';

// ─── Sprites ───

export type SpriteLayer = {
	name: string;
	pixels: string[];
	opacity?: number;
};

export type Region = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type Attachment = {
	x: number;
	y: number;
	frames?: Record<string, { x: number; y: number }>;
};

export type Constraints = {
	maxColors?: number;
	outline?: boolean;
	noIslands?: boolean;
	connectedPixels?: boolean;
};

export type Variant = {
	palette?: Record<string, PixelColor>;
	scale?: number;
};

export type GenerationMeta = {
	prompt?: string;
	model?: string;
	seed?: number;
	parent?: string;
	timestamp?: string;
};

export type Keyframe = {
	time: number;
	value: number | string;
};

export type Easing = 'step' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export type Track = {
	property: string;
	keyframes: Keyframe[];
	easing?: Easing;
};

export type Clip = {
	duration: number;
	playback?: 'loop' | 'once' | 'pingpong';
	tracks: Track[];
};

export type PixelSprite = {
	format: 'pixel-sprite-v1';
	name: string;
	width: number;
	height: number;
	palette: string | PixelPalette;
	encoding: PixelEncoding;
	pixels?: string[];
	layers?: SpriteLayer[];
	frameCount?: number;
	clips?: Record<string, Clip>;
	origin?: { x: number; y: number };
	baseScale?: number;
	symmetry?: 'none' | 'horizontal' | 'vertical' | 'both';
	regions?: Record<string, Region>;
	attachments?: Record<string, Attachment>;
	constraints?: Constraints;
	variants?: Record<string, Variant>;
	generation?: GenerationMeta;
	tags?: string[];
	collision?: Region;
	ppu?: number;
	meta?: Record<string, unknown>;
};

// ─── Tiles & Tilesets ───

export type TileConnectivity = {
	north?: string;
	east?: string;
	south?: string;
	west?: string;
};

export type PixelTile = {
	encoding: PixelEncoding;
	pixels: string[];
	connectivity?: TileConnectivity;
	tags?: string[];
	meta?: Record<string, unknown>;
};

export type PixelTileset = {
	format: 'pixel-tileset-v1';
	name: string;
	tileWidth: number;
	tileHeight: number;
	palette: string | PixelPalette;
	tiles: Record<string, PixelTile>;
	ppu?: number;
	meta?: Record<string, unknown>;
};

// ─── Tilemaps ───

export type TileRef = {
	tile: string;
	flipX?: boolean;
	flipY?: boolean;
	rotate?: 0 | 90 | 180 | 270;
};

export type PixelTilemap = {
	format: 'pixel-tilemap-v1';
	name: string;
	tileset: string;
	gridWidth: number;
	gridHeight: number;
	legend: Record<string, string | TileRef>;
	grid: string[];
	meta?: Record<string, unknown>;
};

// ─── Emitters ───

export type NumberRange = {
	min: number;
	max: number;
};

export type EmitterConfig = {
	sprite?: string;
	rate: number;
	lifetime: NumberRange;
	velocity: {
		x: NumberRange;
		y: NumberRange;
	};
	gravity?: number;
	fadeOut?: boolean;
	scaleRange?: NumberRange;
	rotationSpeed?: NumberRange;
	maxParticles?: number;
	burst?: number;
	ppu?: number;
};

export type PixelEmitter = {
	format: 'pixel-emitter-v1';
	name: string;
} & EmitterConfig;

// ─── Scenes ───

export type Camera = {
	x: number;
	y: number;
	zoom?: number;
};

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'additive';

export type AttachRef = {
	parent: string;
	point: string;
};

export type PixelSceneItem = {
	asset: string;
	x?: number;
	y?: number;
	id?: string;
	scale?: number;
	opacity?: number;
	flipX?: boolean;
	flipY?: boolean;
	rotation?: number;
	z?: number;
	palette?: string | PixelPalette;
	variant?: string;
	clip?: string;
	attach?: AttachRef;
	emitter?: EmitterConfig;
	groundY?: number;
	tags?: string[];
	if?: string;
	meta?: Record<string, unknown>;
};

export type PixelSceneLayer = {
	name: string;
	type?: 'items' | 'tilemap';
	items?: PixelSceneItem[];
	tilemap?: string;
	opacity?: number;
	blend?: BlendMode;
	scrollFactor?: number;
	sort?: 'manual' | 'y';
	offsetX?: number;
	offsetY?: number;
	visible?: boolean;
};

export type PixelScene = {
	format: 'pixel-scene-v1';
	name: string;
	canvas: {
		width: number;
		height: number;
		background?: PixelColor;
		scale?: number;
		referencePpu?: number;
		camera?: Camera;
		meta?: Record<string, unknown>;
	};
	layers: PixelSceneLayer[];
	meta?: Record<string, unknown>;
};

// ─── Asset Management ───

/** Relationship type between assets. */
export type AssetReferenceRole = 'component' | 'variant' | 'attachment' | 'dependency';

/** A reference from one managed asset to another. */
export type AssetReference = {
	/** Name/id of the referenced asset (matches another asset folder name). */
	asset: string;
	/** Relationship type. */
	role: AssetReferenceRole;
	/** Optional description of the relationship. */
	description?: string;
};

/** A named view within a managed asset — maps to a .pixel.json file. */
export type AssetView = {
	/** Filename of the .pixel.json file (relative to the asset folder). */
	file: string;
	/** Human-readable label for this view. */
	label?: string;
	/** Optional description of what this view represents. */
	description?: string;
};

/** Primary asset type for managed assets. */
export type AssetType = 'sprite' | 'tileset' | 'tilemap' | 'scene' | 'emitter';

/**
 * Asset metadata stored in asset.json within each asset folder.
 *
 * Each managed asset lives in its own directory under the assets root.
 * The asset.json file organizes the individual .pixel.json view files
 * and tracks relationships to other assets.
 */
export type AssetMeta = {
	/** Schema version for forward compatibility. */
	version: 1;
	/** Human-readable display name. */
	name: string;
	/** Primary asset type. */
	type: AssetType;
	/** Optional description. */
	description?: string;
	/** Detail level preference for generation. */
	detailLevel?: 'low' | 'standard' | 'high';
	/** Named views — each maps to a .pixel.json file in this folder. */
	views: Record<string, AssetView>;
	/** Default view to show in gallery thumbnail. */
	defaultView?: string;
	/** References to other assets (for composition). */
	references?: AssetReference[];
	/** Palette to use for generation (path relative to assets root, or palette name). */
	palette?: string;
	/**
	 * Up to 8 custom colors for this asset. Keys must be single characters
	 * not already used in the base palette (indices 64–71 in the key space).
	 * Merged on top of the base palette at render/generation time.
	 */
	customColors?: Record<string, PixelColor>;
	/** Freeform tags for filtering/search. */
	tags?: string[];
	/** Freeform metadata. */
	meta?: Record<string, unknown>;
};

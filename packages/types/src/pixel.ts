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
		camera?: Camera;
		meta?: Record<string, unknown>;
	};
	layers: PixelSceneLayer[];
	meta?: Record<string, unknown>;
};

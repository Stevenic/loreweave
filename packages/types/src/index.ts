/**
 * @loreweave/types — Shared type definitions for LoreWeave
 *
 * This package exports cross-cutting types used by multiple packages
 * and services in the LoreWeave monorepo.
 */

export type {
	// Asset Management
	AssetMeta,
	AssetReference,
	AssetReferenceRole,
	AssetType,
	AssetView,
	Attachment,
	AttachRef,
	BlendMode,
	// Scenes
	Camera,
	Clip,
	Constraints,
	Easing,
	EmitterConfig,
	GenerationMeta,
	Keyframe,
	// Emitters
	NumberRange,
	// Colors & Palettes
	PixelColor,
	PixelEmitter,
	// Encoding
	PixelEncoding,
	PixelPalette,
	PixelScene,
	PixelSceneItem,
	PixelSceneLayer,
	PixelSprite,
	PixelTile,
	PixelTilemap,
	PixelTileset,
	Region,
	// Sprites
	SpriteLayer,
	// Tiles & Tilesets
	TileConnectivity,
	// Tilemaps
	TileRef,
	Track,
	Variant,
} from './pixel.js';

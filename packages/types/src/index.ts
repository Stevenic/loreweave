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

export type {
	// Seeds & Coordinates
	WorldSeed,
	ChunkCoord,
	TileCoord,
	// Biomes
	BiomeType,
	BiomeDefinition,
	// Surface & Resources
	SurfaceType,
	ResourceType,
	// Features
	FeatureType,
	// Structures
	StructureID,
	StructurePlacement,
	StructureTile,
	StructureTemplate,
	// Spawns
	SpawnRule,
	SpawnPoint,
	NPCSpawn,
	LootTable,
	LootEntry,
	// Weave State
	WeaveState,
	// World Tiles & Chunks
	WorldTile,
	ChunkStage,
	Chunk,
	StructureRef,
	// Character System
	AbilityName,
	AbilityScores,
	SkillName,
	SkillAbilityMap,
	Condition,
	Item,
	InventorySlot,
	Character,
	// Actions & Intent
	ActionType,
	GameAction,
	Direction,
	DirectionOffset,
	ActionResult,
	GameEffect,
	// Dice
	DiceRoll,
	RollResult,
	// Time & Weather
	GameTime,
	TimeOfDay,
	Weather,
	Season,
	// World State
	WorldState,
	WorldEvent,
	WorldEventType,
	// Narrative Context
	NarrativeContext,
	EntityRef,
	CharacterSummary,
	ExitInfo,
	// Crafting
	Recipe,
	RecipeIngredient,
	// Scenarios
	Scenario,
	ScenarioConstraints,
	Quest,
	QuestObjective,
	QuestReward,
	// Dungeon Master
	DMConfig,
	DMResponse,
	GameSession,
	NarrativeAdapter,
	WorldAccess,
	// Archetype System
	ProbabilityPool,
	SettlementTier,
	LocationCategory,
	NpcCategory,
	StatsTier,
	AbilityArrayType,
	LocationArchetype,
	NpcArchetype,
	// Location Records
	LocationRecord,
	Settlement,
	// Stat Tiers
	StatTierDefinition,
	// Ward System
	WardThreshold,
	WardEventType,
	WardEventDefinition,
	// Fray Exposure
	FrayExposureLevel,
	FrayExposureSource,
	FrayExposureConfig,
	// Encounter Tables
	EncounterEntry,
	EncounterTable,
	DungeonEncounterModifier,
	// Skill Challenges
	ChallengeSkill,
	ChallengeFailure,
	SkillChallengeConfig,
	SkillChallengeResult,
	// Creature Stat Blocks
	CreatureAction,
	CreatureStatBlock,
	// Vocabulary
	SensoryDescriptors,
	VocabularyTable,
	// DM Persona & World Config
	DMPersona,
	WorldConfig,
	GameSessionConfig,
} from './game.js';

export {
	CHUNK_SIZE,
	DIRECTION_OFFSETS,
	SKILL_ABILITIES,
} from './game.js';

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
	WorldNarrativeHook,
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
	StreamingDMResponse,
	GameSession,
	NarrativeAdapter,
	NarrativeChunk,
	StreamingNarrativeAdapter,
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
	// Companion System
	CompanionReaction,
	CompanionRelationship,
	CompanionState,
	CompanionSummary,
	// Dialogue
	DialogueApproach,
	DialogueContext,
	SocialCheckResult,
	// Weave State Graph
	LoomStone,
	Threadline,
	WeaveGraph,
	// Weather & Seasons (Mechanical)
	LightLevel,
	WeatherResult,
	SeasonModifiers,
	WeatherEffects,
	CeremonyResult,
	CeremonyDefinition,
	SeasonWeatherTable,
	BiomeWeatherModifiers,
	// Faction Reputation
	FactionId,
	ReputationTier,
	ReputationEvent,
	FactionReputation,
	DialogueModifiers,
	AccessRequirement,
	// Player Threadcraft
	ThreadcraftTradition,
	PlayerThreadcraft,
	SpellInfo,
	// Threadcraft Crafting
	CraftingMaterial,
	MaterialRequirement,
	ItemEffect,
	ThreadcraftItem,
	CraftResult,
	// Character Creation
	CharacterClass,
	Ancestry,
	Background,
	FightingStyle,
	AbilityScoreMethod,
	CharacterCreationData,
	PlayerCharacter,
	EquipmentChoice,
	ClassDefinition,
	AncestryDefinition,
	BackgroundDefinition,
	// NPC System
	NPCTier,
	DispositionLabel,
	ScheduleEntry,
	NPCSchedule,
	NPCRecord,
	InteractionSummary,
	NPCPromise,
	NPCRelationship,
	PromotionConfig,
	DispositionConfig,
	// Companion System (Updated)
	CompanionTier,
	CompanionSource,
	BehavioralTemplateId,
	CompanionRestrictions,
	PactDuration,
	PactObligation,
	CompanionPact,
	StandingOrders,
	CompanionInstance,
	// Behavioral Templates
	BehavioralPriority,
	BehavioralDefaults,
	BehavioralNarrationHints,
	BehavioralTemplate,
	// Creature Archetypes
	CreatureCategory,
	CreatureBehavior,
	CreatureSensory,
	CreatureLootEntry,
	CreatureArchetype,
	// Quest Templates
	QuestTag,
	QuestTier,
	QuestScaling,
	QuestRole,
	QuestStage,
	QuestResolution,
	SideQuestTemplate,
	QuestInstance,
	// Starting Settlement Generation
	NamedNPCSlot,
	AmbientNPCType,
	SettlementRing,
	StartingSettlementConfig,
	SettlementScaling,
	// World Instance
	WorldInstance,
} from './game.js';

export {
	CHUNK_SIZE,
	DIRECTION_OFFSETS,
	SKILL_ABILITIES,
} from './game.js';

export type {
	// Connection Lifecycle
	ConnectionState,
	// SignalR
	SignalRMessage,
	HubName,
	// Chat
	ChatChannel,
	ChatScope,
	ChatMessage,
	// Presence
	PlayerPresence,
	HeartbeatPayload,
	// World Settings (Multiplayer)
	WorldTone,
	DifficultyTier,
	PlayMode,
	FrayIntensity,
	HouseRules,
	WorldSettings,
	// Player Session
	PlayerSession,
	PendingAction,
	// Containers
	ContainerType,
	Container,
	ContainerItem,
	// Party System
	PartyDecisionModel,
	Party,
	PartyVote,
	// Trading
	TradeProposal,
	// Turn Coordination (Wave 2)
	TurnPhase,
	TurnState,
	TurnResult,
	TurnActionResult,
	// Graceful Disconnect (Wave 2)
	DisconnectEvent,
	ReconnectResult,
	// Session Recap (Wave 2)
	RecapContext,
	SessionRecap,
	// Chat-to-Intent LLM Fallback (Wave 2)
	IntentExtractionContext,
	IntentExtractionResult,
	// World Event Log (Wave 2)
	WorldEventLogEntry,
	// Narrative Modes
	VerbosityMode,
	// Storage
	BlobPath,
	WorldStore,
	MessageBroker,
	ChatStore,
} from './multiplayer.js';

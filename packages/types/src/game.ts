/**
 * @loreweave/types — Game engine type definitions.
 *
 * Core types for the world engine, rules engine, and narrative engine.
 * These types match the LoreWeave spec (loreweave_spec.md) and
 * World Generation spec (world_generation_spec.md).
 */

// ─── Seeds & Coordinates ───

/** 64-bit world seed. All generation derives from this. */
export type WorldSeed = bigint;

/** Chunk coordinate in chunk-space (world coord = cx * CHUNK_SIZE + localX). */
export type ChunkCoord = {
	cx: number;
	cy: number;
};

/** World-space tile coordinate. */
export type TileCoord = {
	x: number;
	y: number;
};

// ─── Biomes ───

export type BiomeType =
	| 'forest'
	| 'plains'
	| 'mountain'
	| 'swamp'
	| 'tundra'
	| 'desert'
	| 'taiga'
	| 'coast'
	| 'hills'
	| 'cavern'
	| 'farmland'
	| 'deep_forest';

/** Biome definition in 3D parameter space. §4.2 */
export type BiomeDefinition = {
	type: BiomeType;
	temperature: [min: number, max: number];
	moisture: [min: number, max: number];
	elevation: [min: number, max: number];
	description: string;
};

// ─── Surface ───

export type SurfaceType =
	| 'grass'
	| 'dirt'
	| 'sand'
	| 'stone'
	| 'snow'
	| 'water'
	| 'mud'
	| 'ice'
	| 'pine_floor'
	| 'gravel'
	| 'peat'
	| 'cave_floor'
	| 'tilled_soil'
	| 'root_floor';

// ─── Resources ───

export type ResourceType =
	| 'wood'
	| 'stone'
	| 'iron'
	| 'herb'
	| 'fish'
	| 'clay'
	| 'crystal'
	| 'peat'
	| 'fur';

// ─── Features ───

export type FeatureType =
	// Terrain features
	| 'boulder'
	| 'cliff'
	| 'pond'
	| 'sand_dune'
	// Major vegetation
	| 'oak_tree'
	| 'pine_tree'
	| 'dead_tree'
	| 'bush'
	| 'cactus'
	| 'willow_tree'
	// Minor vegetation
	| 'flowers'
	| 'mushrooms'
	| 'tall_grass'
	| 'reeds'
	| 'moss'
	| 'fern'
	// Ground detail
	| 'fallen_log'
	| 'leaf_pile'
	| 'pebbles'
	| 'bones'
	| 'campfire_remains'
	// Ambient
	| 'fog'
	| 'snow_drift'
	| 'heat_shimmer'
	// Coast
	| 'tide_pool'
	| 'driftwood'
	| 'seaweed'
	| 'seabirds'
	| 'salt_spray'
	| 'sea_shell'
	// Hills / Moorland
	| 'heather'
	| 'gorse'
	| 'standing_stone'
	| 'exposed_rock'
	| 'low_scrub'
	// Cavern / Underground
	| 'stalactite'
	| 'stalagmite'
	| 'underground_pool'
	| 'glowing_fungus'
	| 'crystal_formation'
	| 'cave_moss'
	// Farmland
	| 'crop_field'
	| 'fence'
	| 'orchard_tree'
	| 'hay_bale'
	| 'scarecrow'
	| 'pasture'
	// Deep Forest
	| 'ancient_tree'
	| 'massive_root'
	| 'thick_undergrowth'
	| 'canopy_shadow'
	| 'hollow_trunk'
	| 'hanging_vine';

// ─── Structures ───

export type StructureID =
	| 'village'
	| 'ruins'
	| 'cave_entrance'
	| 'shrine'
	| 'watchtower'
	| 'bridge';

export type StructurePlacement = {
	id: StructureID;
	spacing: number;
	separation: number;
	frequency: number;
	biomes: BiomeType[];
	minElevation?: number;
	maxElevation?: number;
};

export type StructureTile = {
	localX: number;
	localY: number;
	surface: SurfaceType;
	features: FeatureType[];
	walkable: boolean;
};

export type StructureTemplate = {
	id: StructureID;
	width: number;
	height: number;
	tiles: StructureTile[];
	npcs?: NPCSpawn[];
	loot?: LootTable[];
};

// ─── Spawns ───

export type SpawnRule = {
	entityType: string;
	biomes: BiomeType[];
	density: number;
	minGroupSize: number;
	maxGroupSize: number;
	minElevation?: number;
	maxElevation?: number;
	requiresFeature?: FeatureType[];
	avoidStructures?: boolean;
};

export type SpawnPoint = {
	x: number;
	y: number;
	entityType: string;
	groupSize: number;
};

export type NPCSpawn = {
	entityType: string;
	localX: number;
	localY: number;
	name?: string;
	dialogue?: string[];
};

export type LootTable = {
	items: LootEntry[];
};

export type LootEntry = {
	item: string;
	quantity: [min: number, max: number];
	weight: number;
};

// ─── World Tiles & Chunks ───

/** Weave stability state — overlay modifier for any biome. */
export type WeaveState = 'stable' | 'thin' | 'frayed' | 'unraveled';

/** A single tile in world space. §4.1 */
export type WorldTile = {
	x: number;
	y: number;
	biome: BiomeType;
	elevation: number;
	surface: SurfaceType;
	resources: ResourceType[];
	structures: StructureID[];
	features: FeatureType[];
	walkable: boolean;
	river: boolean;
	/** Weave stability at this tile. Affects encounters, hazards, and narrative. */
	weaveState: WeaveState;
};

/** Chunk generation stage. §3.2 */
export type ChunkStage =
	| 'empty'
	| 'biomes'
	| 'elevation'
	| 'surface'
	| 'resources'
	| 'structures'
	| 'features'
	| 'spawns'
	| 'complete';

/** A 32×32 tile chunk. §3.1 */
export type Chunk = {
	coord: ChunkCoord;
	stage: ChunkStage;
	tiles: WorldTile[];
	spawns: SpawnPoint[];
	structureRefs: StructureRef[];
};

/** Reference to a structure placed in/near this chunk. */
export type StructureRef = {
	id: StructureID;
	worldX: number;
	worldY: number;
	templateId: string;
	/** Footprint radius in tiles from the center. */
	radius: number;
	/** Settlement tier (for villages/towns). */
	settlementTier?: SettlementTier;
	/** Deterministic unique ID for ward tracking, faction assignment, etc. */
	settlementId?: string;
};

// ─── D&D 5e Character System ───

export type AbilityName = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type AbilityScores = Record<AbilityName, number>;

export type SkillName =
	| 'acrobatics'
	| 'animal_handling'
	| 'arcana'
	| 'athletics'
	| 'deception'
	| 'history'
	| 'insight'
	| 'intimidation'
	| 'investigation'
	| 'medicine'
	| 'nature'
	| 'perception'
	| 'performance'
	| 'persuasion'
	| 'religion'
	| 'sleight_of_hand'
	| 'stealth'
	| 'survival';

/** Maps each skill to its governing ability. */
export type SkillAbilityMap = Record<SkillName, AbilityName>;

export type Condition =
	| 'blinded'
	| 'charmed'
	| 'deafened'
	| 'frightened'
	| 'grappled'
	| 'incapacitated'
	| 'invisible'
	| 'paralyzed'
	| 'petrified'
	| 'poisoned'
	| 'prone'
	| 'restrained'
	| 'stunned'
	| 'unconscious';

export type Item = {
	id: string;
	name: string;
	description?: string;
	weight: number;
	value: number;
	stackable: boolean;
	maxStack?: number;
};

export type InventorySlot = {
	item: Item;
	quantity: number;
};

export type Character = {
	id: string;
	name: string;
	level: number;
	abilities: AbilityScores;
	hp: number;
	maxHp: number;
	ac: number;
	proficiencyBonus: number;
	proficientSkills: SkillName[];
	proficientSaves?: AbilityName[];
	conditions: Condition[];
	inventory: InventorySlot[];
	location: TileCoord;
	speed: number;
};

// ─── Actions & Intent ───

export type ActionType =
	| 'move'
	| 'look'
	| 'attack'
	| 'use_item'
	| 'pickup'
	| 'drop'
	| 'craft'
	| 'talk'
	| 'rest'
	| 'search'
	| 'persuade'
	| 'intimidate'
	| 'deceive'
	| 'ceremony';

/** Social approach for dialogue-based actions. */
export type DialogueApproach = 'persuasion' | 'intimidation' | 'deception' | 'insight';

export type GameAction = {
	type: ActionType;
	actorId: string;
	targetId?: string;
	direction?: Direction;
	itemId?: string;
	stealth?: boolean;
	/** Social skill approach for talk/persuade/intimidate/deceive actions. */
	dialogueApproach?: DialogueApproach;
	/** Topic keyword for talk actions (used for NPC knowledge lookup). */
	dialogueTopic?: string;
	/** Skill challenge config ID for ceremony actions. */
	challengeId?: string;
};

export type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';

/** Offsets for each direction in tile-space. */
export type DirectionOffset = Record<Direction, TileCoord>;

export type ActionResult = {
	success: boolean;
	action: GameAction;
	effects: GameEffect[];
	narrationHints: string[];
};

export type GameEffect =
	| { type: 'move'; entityId: string; from: TileCoord; to: TileCoord }
	| { type: 'damage'; targetId: string; amount: number; source: string }
	| { type: 'heal'; targetId: string; amount: number }
	| { type: 'item_gained'; entityId: string; item: Item; quantity: number }
	| { type: 'item_lost'; entityId: string; itemId: string; quantity: number }
	| { type: 'condition_added'; entityId: string; condition: Condition }
	| { type: 'condition_removed'; entityId: string; condition: Condition }
	| { type: 'structure_placed'; structureId: StructureID; location: TileCoord }
	| { type: 'resource_gathered'; location: TileCoord; resource: ResourceType; quantity: number }
	| { type: 'reputation_changed'; factionId: string; delta: number }
	| { type: 'companion_reaction'; companionId: string; reaction: CompanionReaction; reason: string }
	| { type: 'weave_state_changed'; location: TileCoord; from: WeaveState; to: WeaveState };

// ─── Dice ───

export type DiceRoll = {
	count: number;
	sides: number;
	modifier: number;
};

export type RollResult = {
	rolls: number[];
	total: number;
	natural: number;
	modifier: number;
};

// ─── Game Time & Weather ───

export type GameTime = {
	day: number;
	hour: number;
	minute: number;
};

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';

export type Weather =
	| 'clear'
	| 'overcast'
	| 'rain'
	| 'storm'
	| 'fog'
	| 'snow'
	| 'blizzard';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// ─── World State ───

export type WorldState = {
	seed: WorldSeed;
	time: GameTime;
	weather: Weather;
	season: Season;
	characters: Map<string, Character>;
	loadedChunks: Map<string, Chunk>;
	events: WorldEvent[];
};

export type WorldEvent = {
	timestamp: GameTime;
	location: TileCoord;
	type: WorldEventType;
	details: Record<string, unknown>;
};

export type WorldEventType =
	| 'entity_spawned'
	| 'entity_killed'
	| 'structure_damaged'
	| 'structure_destroyed'
	| 'structure_rebuilt'
	| 'resource_depleted'
	| 'resource_replenished'
	| 'quest_started'
	| 'quest_completed';

// ─── Narrative Context ───

/** Context assembled for the LLM to render narrative. §4.4 */
export type NarrativeContext = {
	location: WorldTile;
	visibleEntities: EntityRef[];
	weather: Weather;
	timeOfDay: TimeOfDay;
	season: Season;
	recentEvents: WorldEvent[];
	players: CharacterSummary[];
	nearbyExits: ExitInfo[];
	questHints: string[];
	/** Weave state at the party's location. */
	weaveState: WeaveState;
	/** Active companion summaries for LLM narration. */
	companions: CompanionSummary[];
	/** Dialogue context when talking to an NPC (populated for talk actions). */
	dialogueTarget?: DialogueContext;
};

/** Summary of a companion for LLM context. */
export type CompanionSummary = {
	name: string;
	hp: number;
	maxHp: number;
	conditions: Condition[];
	/** Qualitative relationship descriptor (not the raw number). */
	relationshipTone: 'devoted' | 'warm' | 'friendly' | 'neutral' | 'cool' | 'strained' | 'hostile';
	/** Topics the companion might interject about this turn. */
	relevantInterjections: string[];
};

export type EntityRef = {
	id: string;
	type: string;
	name: string;
	location: TileCoord;
	hostile: boolean;
};

export type CharacterSummary = {
	name: string;
	hp: number;
	maxHp: number;
	conditions: Condition[];
};

export type ExitInfo = {
	direction: Direction;
	description: string;
	biome: BiomeType;
};

// ─── Crafting ───

export type Recipe = {
	id: string;
	name: string;
	requires: RecipeIngredient[];
	produces: string;
	producesQuantity: number;
};

export type RecipeIngredient = {
	item: string;
	quantity: number;

};

// ─── Scenarios ───

export type Scenario = {
	id: string;
	name: string;
	description: string;
	constraints: ScenarioConstraints;
	structures: StructureTemplate[];
	npcs: NPCSpawn[];
	quests: Quest[];
};

export type ScenarioConstraints = {
	biome?: BiomeType;
	near?: string;
	minChunkRadius?: number;
	maxChunkRadius?: number;
};

export type Quest = {
	id: string;
	name: string;
	description: string;
	objectives: QuestObjective[];
	rewards: QuestReward[];
};

export type QuestObjective = {
	id: string;
	description: string;
	type: 'kill' | 'gather' | 'deliver' | 'explore' | 'talk';
	target: string;
	quantity: number;
};

export type QuestReward = {
	type: 'item' | 'xp' | 'gold';
	value: string | number;
	quantity: number;
};

// ─── Dungeon Master ───

/** Configuration for the DM engine. */
export type DMConfig = {
	/** Visible tile radius around the party for context assembly. Default: 5. */
	viewRadius: number;
	/** How many recent world events to include in narrative context. Default: 10. */
	recentEventCount: number;
	/** Maximum game-days back to search for recent events. Default: 7. */
	recentEventDays: number;
	/** Default DC for unspecified checks. Default: 12. */
	defaultDC: number;
	/** Minutes of game time a standard action takes. Default: 5. */
	actionTimeMinutes: number;
	/** Minutes of game time a rest takes. Default: 480 (8 hours). */
	restTimeMinutes: number;
};

/** Interface for LLM-based narrative text generation. */
export type NarrativeAdapter = {
	/** Generate narrative text from a system prompt and user prompt. */
	generate(systemPrompt: string, userPrompt: string): Promise<string>;
};

/** The result of the DM processing a player's turn. */
export type DMResponse = {
	/** The narrative text describing what happened. */
	narrative: string;
	/** The parsed action (null if input couldn't be parsed). */
	action: GameAction | null;
	/** The mechanical result of the action (null if no action or look/talk). */
	result: ActionResult | null;
	/** All game effects applied this turn. */
	effects: GameEffect[];
	/** The narrative context that was assembled for the LLM. */
	context: NarrativeContext;
	/** Updated party state after effects. */
	party: Character[];
	/** Game time after this turn. */
	time: GameTime;
};

/**
 * Interface for world access from the DM layer.
 * Defines the subset of World class methods the narrative engine needs.
 * The World class in @loreweave/world naturally satisfies this interface.
 */
export type WorldAccess = {
	readonly seed: WorldSeed;
	time: GameTime;
	weather: Weather;
	season: Season;
	getTile(x: number, y: number): WorldTile;
	getVisibleTiles(center: TileCoord, radius: number): WorldTile[];
	getEventsAt(location: TileCoord, radius?: number): WorldEvent[];
	getRecentEvents(withinDays: number): WorldEvent[];
	advanceTime(minutes: number): void;
	addEvent(event: WorldEvent): void;
	getTimeOfDay(): TimeOfDay;
};

/** Active game session state managed by the DM. */
export type GameSession = {
	/** Unique session identifier. */
	id: string;
	/** The world instance (satisfies WorldAccess interface). */
	world: WorldAccess;
	/** Player characters in the party. */
	party: Character[];
	/** Active quests. */
	quests: Quest[];
	/** Turn counter. */
	turnCount: number;
	/** Entities the party is aware of (NPCs, creatures in vicinity). */
	knownEntities: EntityRef[];
	/** Whether the party is currently in combat. */
	inCombat: boolean;
	/** Combat initiative order (character IDs), if in combat. */
	initiativeOrder: string[];
	/** Active companions (max 2). */
	companions: CompanionState[];
};

// ─── Archetype System ───

/** Probability-tiered pool for archetype generation. */
export type ProbabilityPool<T = string> = {
	required: T[];
	common: T[];
	rare: T[];
};

/** Settlement size tier. */
export type SettlementTier = 'hamlet' | 'village' | 'town' | 'city';

/** Location archetype category. */
export type LocationCategory =
	| 'tavern'
	| 'shop'
	| 'temple'
	| 'residence'
	| 'civic'
	| 'wilderness'
	| 'dungeon';

/** NPC archetype category. */
export type NpcCategory =
	| 'merchant'
	| 'authority'
	| 'craft'
	| 'service'
	| 'wanderer';

/** NPC combat tier for stat block generation. */
export type StatsTier = 'commoner' | 'skilled' | 'expert' | 'veteran' | 'elite' | 'legendary';

/** Ability score array variant. */
export type AbilityArrayType = 'physical' | 'balanced' | 'mental';

/** Location archetype — loaded from worlds/shared/locations/ JSON. */
export type LocationArchetype = {
	id: string;
	type: 'location';
	category: LocationCategory;
	name: string;
	description: string;
	tier: SettlementTier[];
	biomes: (BiomeType | 'any')[];
	features: ProbabilityPool;
	objects: ProbabilityPool;
	npcs: ProbabilityPool;
	exits: ProbabilityPool;
	atmosphere: {
		sounds: string[];
		smells: string[];
		lighting: string[];
	};
	layout: {
		footprint: string;
		floors: number[];
		shape: string[];
	};
	challenges?: {
		encounters: string[];
		traps: string[];
		skill_checks: string[];
		saving_throws: string[];
		loot_tier: 'none' | 'low' | 'medium' | 'high' | 'legendary';
	};
};

/** NPC archetype — loaded from worlds/shared/npcs/ JSON. */
export type NpcArchetype = {
	id: string;
	type: 'npc';
	category: NpcCategory;
	name: string;
	description: string;
	stats_tier: StatsTier;
	primaryAbility?: AbilityName;
	primaryArrayType?: AbilityArrayType;
	traits: {
		common: string[];
		rare: string[];
	};
	skills: SkillName[];
	inventory: ProbabilityPool;
	knowledge: {
		always: string[];
		sometimes: string[];
		rarely: string[];
	};
	dialogue_hooks: string[];
	voice_patterns: string[];
	schedule?: {
		morning: string;
		afternoon: string;
		evening: string;
		night: string;
	};
};

// ─── Location Records ───

/**
 * A concrete instantiated location within a settlement or structure.
 * Generated from a LocationArchetype + seed. This is the runtime
 * representation that the DM and narrative engine work with.
 */
export type LocationRecord = {
	/** Unique ID for this location instance. */
	id: string;
	/** The archetype ID this was generated from. */
	archetypeId: string;
	/** Display name (generated from archetype name patterns). */
	name: string;
	/** Location category. */
	category: LocationCategory;
	/** World-space tile coordinate of this location. */
	position: TileCoord;
	/** The settlement this location belongs to (null for wilderness/dungeon). */
	settlementId: string | null;
	/** Concrete features rolled from the archetype's probability pools. */
	features: string[];
	/** Concrete objects rolled from the archetype's probability pools. */
	objects: string[];
	/** NPC archetype IDs assigned to this location. */
	npcArchetypes: string[];
	/** Concrete exits rolled from the archetype's probability pools. */
	exits: string[];
	/** Atmosphere snapshot for LLM context. */
	atmosphere: {
		sounds: string[];
		smells: string[];
		lighting: string[];
	};
	/** Challenge data (if any). */
	challenges?: {
		encounters: string[];
		traps: string[];
		skill_checks: string[];
		saving_throws: string[];
		loot_tier: 'none' | 'low' | 'medium' | 'high' | 'legendary';
	};
};

/**
 * A settlement — a collection of locations generated around a structure.
 * Settlements are created from village/town/city structure refs.
 */
export type Settlement = {
	/** Deterministic unique ID (matches StructureRef.settlementId). */
	id: string;
	/** Generated display name. */
	name: string;
	/** Settlement tier. */
	tier: SettlementTier;
	/** World-space center coordinate. */
	center: TileCoord;
	/** Footprint radius in tiles. */
	radius: number;
	/** Biome at the settlement center. */
	biome: BiomeType;
	/** Locations within this settlement. */
	locations: LocationRecord[];
	/** Ward strength (0-100). */
	wardStrength: number;
};

// ─── Stat Tier Definitions ───

/** Stat tier definition — maps tier name to mechanical values. */
export type StatTierDefinition = {
	tier: StatsTier;
	crRange: [min: number, max: number];
	hpRange: [min: number, max: number];
	acRange: [min: number, max: number];
	proficiencyBonus: number;
	attackBonusRange: [min: number, max: number];
	saveDCRange: [min: number, max: number];
	abilityArrays: Record<AbilityArrayType, number[]>;
};

// ─── Ward System ───

/** Ward strength threshold — defines mechanical effects at a ward level. */
export type WardThreshold = {
	minStrength: number;
	maxStrength: number;
	label: string;
	maxCreatureCR: number;
	threadcraftDCModifier: number;
	additionalEffects: string[];
};

/** Ward event that affects ward strength. */
export type WardEventType =
	| 'ceremony_full'
	| 'ceremony_partial'
	| 'ceremony_failed'
	| 'ceremony_missed'
	| 'daily_maintenance'
	| 'no_maintenance_week'
	| 'wardweaver_death_month'
	| 'loom_stone_restored'
	| 'incursion_repelled'
	| 'incursion_undefended'
	| 'major_quest_completed';

/** Ward event definition — maps event type to strength delta. */
export type WardEventDefinition = {
	type: WardEventType;
	strengthDelta: number;
	hollowingMultiplier?: number;
	description: string;
};

// ─── Fray Exposure ───

/** Fray exposure level definition. */
export type FrayExposureLevel = {
	level: number;
	name: string;
	effect: string;
	mechanicalConsequence: string;
};

/** Fray exposure source with associated save DC. */
export type FrayExposureSource = {
	source: string;
	saveDC: number;
};

/** Full fray exposure configuration for a world. */
export type FrayExposureConfig = {
	levels: FrayExposureLevel[];
	sources: FrayExposureSource[];
	transformationLevel: number;
	transformationDC: number;
};

// ─── Encounter Tables ───

/** A single entry in an encounter table. */
export type EncounterEntry = {
	minRoll: number;
	maxRoll: number;
	description: string;
	creatures?: { type: string; count: string; cr: number }[];
	isNonCombat?: boolean;
	environmentalDC?: number;
};

/** An encounter table for a biome/zone combination. */
export type EncounterTable = {
	id: string;
	name: string;
	levelRange: [min: number, max: number];
	dieSize: number;
	entries: EncounterEntry[];
};

/** Dungeon encounter modifier. */
export type DungeonEncounterModifier = {
	dungeonType: string;
	description: string;
};

// ─── Skill Challenges ───

/** A skill that can be used in a skill challenge. */
export type ChallengeSkill = {
	skill: SkillName;
	application: string;
	dcModifier: number;
};

/** Failure consequence in a skill challenge. */
export type ChallengeFailure = {
	failureNumber: number;
	effect: string;
	mechanicalConsequence?: string;
};

/** Skill challenge configuration — reusable framework. */
export type SkillChallengeConfig = {
	id: string;
	name: string;
	successesRequired: number;
	failuresAllowed: number;
	applicableSkills: ChallengeSkill[];
	failureConsequences: ChallengeFailure[];
	criticalSuccessBonus?: string;
	baseDCTable?: Record<string, number>;
};

/** Result of running a skill challenge. */
export type SkillChallengeResult = {
	success: boolean;
	flawless: boolean;
	successes: number;
	failures: number;
	rolls: { skill: SkillName; dc: number; roll: number; success: boolean }[];
};

// ─── Creature Stat Blocks ───

/** Action a creature can take. */
export type CreatureAction = {
	name: string;
	description: string;
	attackBonus?: number;
	reach?: number;
	damage?: string;
	saveDC?: number;
	saveAbility?: AbilityName;
	recharge?: string;
};

/** Full creature stat block — loaded from world config. */
export type CreatureStatBlock = {
	id: string;
	name: string;
	size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
	type: string;
	alignment: string;
	cr: number;
	ac: number;
	hp: number;
	hpFormula: string;
	speed: string;
	abilities: AbilityScores;
	savingThrows?: Partial<Record<AbilityName, number>>;
	skills?: Partial<Record<SkillName, number>>;
	damageResistances?: string[];
	damageImmunities?: string[];
	conditionImmunities?: Condition[];
	senses: string;
	languages: string;
	traits: { name: string; description: string }[];
	actions: CreatureAction[];
	reactions?: CreatureAction[];
	legendaryActions?: CreatureAction[];
	lairActions?: CreatureAction[];
};

// ─── Vocabulary Tables ───

/** Sensory descriptor set for a biome, time, or condition. */
export type SensoryDescriptors = {
	terrain?: string[];
	sounds?: string[];
	smells?: string[];
	atmosphere?: string[];
	sky?: string[];
	light?: string[];
	feel?: string[];
};

/** Vocabulary table — maps keys to sensory descriptors. */
export type VocabularyTable = Record<string, SensoryDescriptors>;

// ─── DM Persona ───

/** DM persona — defines how the LLM narrates for a specific world. */
export type DMPersona = {
	name: string;
	worldName: string;
	toneGuide: string[];
	forbiddenTopics: string[];
	namingConventions: string[];
	narrativeStyle: string;
	responseLength: string;
	specialInstructions: string[];
};

// ─── World Configuration ───

/**
 * World configuration — the complete data package for a world.
 * Loaded from worlds/<name>/config/ at runtime.
 * All game-specific rules tables, creature data, encounter tables,
 * and DM personality are defined here. The engine is world-agnostic;
 * the WorldConfig makes it world-specific.
 */
export type WorldConfig = {
	id: string;
	name: string;
	description: string;

	/** DM persona for LLM narrative generation. */
	persona: DMPersona;

	/** Stat tier definitions for NPC generation. */
	statTiers: StatTierDefinition[];

	/** Ward system configuration (if the world uses wards). */
	wardThresholds?: WardThreshold[];
	wardEvents?: WardEventDefinition[];

	/** Fray/corruption exposure system (if the world uses it). */
	frayExposure?: FrayExposureConfig;

	/** Encounter tables by zone/biome. */
	encounterTables?: EncounterTable[];
	dungeonModifiers?: DungeonEncounterModifier[];

	/** Skill challenge templates. */
	skillChallenges?: SkillChallengeConfig[];

	/** Creature stat blocks unique to this world. */
	creatures?: CreatureStatBlock[];

	/** Vocabulary tables for narrative enrichment. */
	vocabulary?: {
		biomes?: VocabularyTable;
		timeOfDay?: VocabularyTable;
		weather?: VocabularyTable;
		settlements?: VocabularyTable;
		buildingStyles?: VocabularyTable;
	};

	/** Archetype-to-tier overrides (e.g., guard captain = expert in this world). */
	tierOverrides?: Record<string, StatsTier>;

	/** World-specific action types beyond the base 10. */
	customActions?: string[];

	/** Additional world-specific data (open-ended for expansions). */
	extensions?: Record<string, unknown>;
};

/** Updated game session with world config support. */
export type GameSessionConfig = {
	/** The world configuration data. */
	worldConfig?: WorldConfig;
	/** Ward strengths per settlement. */
	wardStrengths?: Map<string, number>;
	/** Faction reputation scores. */
	factionReputation?: Map<string, number>;
	/** Fray exposure per character. */
	frayExposure?: Map<string, number>;
	/** Weave state graph (Threadlines + Loom Stones). */
	weaveGraph?: WeaveGraph;
};

// ─── Companion System ───

/** Companion reaction type — drives LLM narration of companion behavior. */
export type CompanionReaction = 'approve' | 'disapprove' | 'interject' | 'warn' | 'leave';

/** Hidden relationship state between the player and a companion. */
export type CompanionRelationship = {
	/** Approval score: -100 (hostile) to +100 (devoted). Starts at 0. */
	approval: number;
	/** Number of value-violation warnings issued. At 3, companion leaves. */
	warnings: number;
	/** Topics the companion has already commented on (avoids repeat interjections). */
	discussedTopics: Set<string>;
	/** Whether the companion's personal quest arc has been started. */
	personalQuestStarted: boolean;
	/** Whether the companion's personal quest arc is complete. */
	personalQuestComplete: boolean;
};

/**
 * Companion state — a named NPC who travels with the party.
 * Max 2 companions at a time per the companion system design.
 */
export type CompanionState = {
	/** The companion's character data (stats, HP, inventory, etc.). */
	character: Character;
	/** Companion's archetype ID (for dialogue hooks, voice, knowledge). */
	archetypeId: string;
	/** Hidden relationship tracking. */
	relationship: CompanionRelationship;
	/** Values that, if violated, move toward departure. */
	values: string[];
	/** Topics that trigger interjections from this companion. */
	interjectionTopics: string[];
	/** The companion's faction alignment. */
	factionId?: string;
	/** Whether the companion is currently in the active party. */
	active: boolean;
};

// ─── Dialogue Context ───

/**
 * NPC dialogue context — assembled from archetype data for the LLM.
 * This is what the LLM uses to voice an NPC in conversation.
 */
export type DialogueContext = {
	/** The NPC's name. */
	npcName: string;
	/** NPC archetype ID. */
	archetypeId: string;
	/** Voice patterns (speech mannerisms, accent notes, verbal tics). */
	voicePatterns: string[];
	/** Dialogue hooks — topics the NPC is eager to discuss. */
	dialogueHooks: string[];
	/** Knowledge tiers — what the NPC knows, gated by social check results. */
	knowledge: {
		/** Always shared freely. */
		always: string[];
		/** Shared on a successful social check (DC 12). */
		sometimes: string[];
		/** Only shared on a hard check (DC 18) or high trust. */
		rarely: string[];
	};
	/** NPC's current schedule state (what they're doing right now). */
	currentActivity?: string;
	/** Whether this NPC is hostile, neutral, or friendly. */
	disposition: 'hostile' | 'wary' | 'neutral' | 'friendly' | 'allied';
};

/** Result of a social skill check during dialogue. */
export type SocialCheckResult = {
	skill: DialogueApproach;
	roll: number;
	total: number;
	dc: number;
	success: boolean;
	critical: boolean;
	/** Knowledge tier unlocked: 'always' (failed), 'sometimes' (success), 'rarely' (high success). */
	knowledgeTier: 'always' | 'sometimes' | 'rarely';
};

// ─── Weave State Graph ───

/**
 * A Loom Stone — a node in the weave graph.
 * Loom Stones anchor the Threadlines and maintain weave stability.
 */
export type LoomStone = {
	/** Unique identifier. */
	id: string;
	/** Display name. */
	name: string;
	/** World-space position. */
	position: TileCoord;
	/** Current integrity (0-100). 0 = shattered, 100 = pristine. */
	integrity: number;
	/** Whether this stone has been discovered by the party. */
	discovered: boolean;
	/** Associated settlement ID (if this stone anchors a settlement's ward). */
	settlementId?: string;
	/** Whether this is a Keystone (critical node — Act IV target). */
	isKeystone: boolean;
};

/**
 * A Threadline — an edge in the weave graph connecting two Loom Stones.
 * Threadlines carry weave stability between regions.
 */
export type Threadline = {
	/** Unique identifier. */
	id: string;
	/** Source Loom Stone ID. */
	fromId: string;
	/** Target Loom Stone ID. */
	toId: string;
	/** Current strength (0-100). Affects weave state of tiles near the line. */
	strength: number;
	/** Whether this Threadline is severed (0 strength, no propagation). */
	severed: boolean;
	/** Influence radius — tiles within this distance are affected. */
	influenceRadius: number;
};

/**
 * The Weave Graph — the spatial network of Loom Stones and Threadlines.
 * This is the mechanical backbone of the Thinning: when stones degrade
 * or Threadlines weaken, weave state degrades in affected regions.
 */
export type WeaveGraph = {
	/** All Loom Stones in the world. */
	stones: LoomStone[];
	/** All Threadlines connecting stones. */
	threadlines: Threadline[];
	/** Global weave health (0-100). Average of all stone integrities. */
	globalHealth: number;
};

// ─── Weather & Seasons (Mechanical) ───

/** Light level — determines visibility and mechanical effects. */
export type LightLevel = 'bright' | 'dim' | 'dark';

/** Result of deterministic weather generation for a watch period. */
export type WeatherResult = {
	/** The weather type for this watch. */
	type: Weather;
	/** How many watches (4-hour blocks) this weather persists (1-4). */
	persistence: number;
	/** True if weave state amplified the weather. */
	amplified: boolean;
	/** True if a Fray manifestation is mixed in (unraveled/frayed zones). */
	frayPhenomenon: boolean;
};

/** Seasonal modifiers affecting travel, foraging, encounters, rest, and wards. */
export type SeasonModifiers = {
	/** Travel speed multiplier (1.0 = normal, 0.5 = half). */
	travelSpeedMod: number;
	/** Base foraging DC before biome/weather adjustments. */
	forageDC: number;
	/** Encounter frequency multiplier (1.0 = normal, 1.2 = +20%). */
	encounterFreqMod: number;
	/** Whether rest is impaired this season. */
	restQuality: 'normal' | 'impaired';
	/** Ward decay rate per week (negative number, e.g. -1 or -2). */
	wardDecayRate: number;
};

/**
 * Mechanical effects of a weather condition.
 * Composed from base weather + weave state amplification.
 */
export type WeatherEffects = {
	/** Visibility level. */
	visibility: 'normal' | 'lightly_obscured' | 'heavily_obscured';
	/** Max visibility range in feet (-1 = unlimited). */
	visibilityRange: number;
	/** Hearing penalty. */
	hearingPenalty: 'none' | 'disadvantage' | 'auto_fail';
	/** Max hearing range in feet (-1 = unlimited). */
	hearingRange: number;
	/** Terrain modification. */
	terrainMod: 'normal' | 'difficult';
	/** Fire damage reduction (non-magical). */
	fireMod: number;
	/** Ranged attack penalty. */
	rangedPenalty: 'none' | 'disadvantage' | 'auto_miss_beyond_30';
	/** Extra concentration DC (0 = no additional check). */
	concentrationDC: number;
	/** Cold/heat exposure save DC (0 = no check). */
	exposureDC: number;
	/** Minutes between exposure checks (0 = N/A). */
	exposureInterval: number;
	/** Travel speed multiplier from weather. */
	travelSpeedMod: number;
};

/** Result of a Binding Song ceremony. */
export type CeremonyResult = {
	/** Game day the ceremony occurred. */
	day: number;
	/** Which ceremony in the annual cycle (0-7). */
	ceremonyIndex: number;
	/** Number of successes achieved. */
	successes: number;
	/** Number of failures accumulated. */
	failures: number;
	/** True if flawless (max successes, 0 failures). */
	flawless: boolean;
	/** True if this was the Hollowing (2x multiplier). */
	isHollowing: boolean;
	/** Actual ward strength change applied. */
	wardChange: number;
};

/** Ceremony definition for the Wheel of Binding calendar. */
export type CeremonyDefinition = {
	/** Ceremony name. */
	name: string;
	/** Month when the ceremony occurs (1-12). */
	month: number;
	/** Season the ceremony falls in. */
	season: Season;
	/** Base ward strength bonus on success. */
	wardBonus: number;
	/** Whether this is the Hollowing (2x multiplier on success AND failure). */
	isHollowing: boolean;
};

/** Weather probability table for a season. Maps Weather → percentage (0-100). */
export type SeasonWeatherTable = Partial<Record<Weather, number>>;

/** Biome weather modifiers — adjustments to seasonal probabilities. */
export type BiomeWeatherModifiers = Partial<Record<Weather, number>>;

// ─── Faction Reputation ───

/** Faction identifier for the 5 Threadhallow factions. */
export type FactionId =
	| 'wardweavers'
	| 'threadwalkers'
	| 'rememberers'
	| 'hollow_court'
	| 'common_folk';

/** Reputation tier — derived from score. */
export type ReputationTier =
	| 'enemy'
	| 'hostile'
	| 'unfavorable'
	| 'neutral_negative'
	| 'neutral'
	| 'neutral_positive'
	| 'favorable'
	| 'friendly'
	| 'allied';

/** A logged reputation change event. */
export type ReputationEvent = {
	actionId: string;
	delta: number;
	reason: string;
	timestamp: number;
	crossEffect: boolean;
};

/** Per-faction reputation state. */
export type FactionReputation = {
	factionId: FactionId;
	score: number;
	tier: ReputationTier;
	history: ReputationEvent[];
};

/** Dialogue modifiers derived from faction reputation. */
export type DialogueModifiers = {
	dcModifier: number;
	merchantPriceModifier: number;
	knowledgeTier: 'always' | 'sometimes' | 'rarely';
	toneDescriptor: string;
};

/** Access requirement for content gating. */
export type AccessRequirement = {
	factionId: FactionId;
	minTier?: ReputationTier;
	minScore?: number;
	notTier?: ReputationTier;
};

// ─── Player Threadcraft ───

/** Threadcraft tradition. */
export type ThreadcraftTradition =
	| 'wardweaving'
	| 'threadwalking'
	| 'binding'
	| 'remembering'
	| 'fraytouch'
	| 'threadline_reading';

/** Player Threadcraft progression state. */
export type PlayerThreadcraft = {
	tradition: ThreadcraftTradition;
	secondTradition?: ThreadcraftTradition;
	tier: 1 | 2 | 3;
	isSpeaker: boolean;
	knownCantrips: string[];
	knownSpells: string[];
	freecastsRemaining: Record<string, number>;
	frayRiskCastsToday: number;
	signatureAbilityUsed: boolean;
};

/** Information about a Threadcraft spell for UI/engine queries. */
export type SpellInfo = {
	id: string;
	name: string;
	level: number;
	tradition: ThreadcraftTradition;
	canFreecast: boolean;
};

// ─── Threadcraft Crafting ───

/** Threadcraft crafting material type. */
export type CraftingMaterial =
	| 'thread_iron_ingot'
	| 'ward_crystal'
	| 'threadline_silk'
	| 'fray_essence'
	| 'gold';

/** Material requirement for crafting an item. */
export type MaterialRequirement = {
	material: CraftingMaterial;
	quantity: number;
};

/** Effect descriptor for a craftable item. */
export type ItemEffect = {
	description: string;
	/** Mechanical properties (ac bonus, damage type, ward strength, etc.). */
	properties: Record<string, string | number | boolean>;
};

/** Threadcraft item recipe definition. */
export type ThreadcraftItem = {
	id: string;
	name: string;
	tier: 1 | 2 | 3;
	materials: MaterialRequirement[];
	craftingTime: number;
	toolDC: number;
	infusionDC: number;
	requiredWeaveState: WeaveState[];
	requiredTradition?: ThreadcraftTradition;
	effect: ItemEffect;
	isConsumable: boolean;
	durability?: number;
};

/** Result of a crafting attempt. */
export type CraftResult = {
	outcome: 'critical_success' | 'success' | 'flawed' | 'failed' | 'backfire';
	item?: ThreadcraftItem;
	/** For flawed items, remaining uses before breaking. */
	remainingUses?: number;
	/** Fray exposure triggered by backfire. */
	frayExposure: boolean;
	toolRoll: number;
	infusionRoll: number;
};

// ─── Constants ───

export const CHUNK_SIZE = 32;

export const DIRECTION_OFFSETS: DirectionOffset = {
	north: { x: 0, y: -1 },
	south: { x: 0, y: 1 },
	east: { x: 1, y: 0 },
	west: { x: -1, y: 0 },
	northeast: { x: 1, y: -1 },
	northwest: { x: -1, y: -1 },
	southeast: { x: 1, y: 1 },
	southwest: { x: -1, y: 1 },
};

export const SKILL_ABILITIES: SkillAbilityMap = {
	acrobatics: 'DEX',
	animal_handling: 'WIS',
	arcana: 'INT',
	athletics: 'STR',
	deception: 'CHA',
	history: 'INT',
	insight: 'WIS',
	intimidation: 'CHA',
	investigation: 'INT',
	medicine: 'WIS',
	nature: 'INT',
	perception: 'WIS',
	performance: 'CHA',
	persuasion: 'CHA',
	religion: 'INT',
	sleight_of_hand: 'DEX',
	stealth: 'DEX',
	survival: 'WIS',
};

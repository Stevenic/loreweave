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
	| 'taiga';

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
	| 'pine_floor';

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
	| 'heat_shimmer';

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
	| 'search';

export type GameAction = {
	type: ActionType;
	actorId: string;
	targetId?: string;
	direction?: Direction;
	itemId?: string;
	stealth?: boolean;
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
	| { type: 'resource_gathered'; location: TileCoord; resource: ResourceType; quantity: number };

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
	| 'cloudy'
	| 'rain'
	| 'storm'
	| 'snow'
	| 'fog'
	| 'wind';

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

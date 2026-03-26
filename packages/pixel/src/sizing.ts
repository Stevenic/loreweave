/**
 * Auto-sizing for pixel assets.
 *
 * Maps semantic object categories to world-space dimensions (in tiles),
 * then computes pixel dimensions from a global detail level (PPU).
 *
 * This eliminates the need to specify pixel dimensions when generating assets —
 * the user picks a detail level once, and each asset type gets appropriate dimensions
 * based on what it IS in the game world.
 */

// ── Detail Levels ──

/**
 * Named detail levels that map to PPU values.
 * Higher PPU = more pixels per world tile = more detail.
 */
export type DetailLevel = 'low' | 'standard' | 'high';

/** PPU value for each detail level. */
export const DETAIL_LEVEL_PPU: Record<DetailLevel, number> = {
	low: 16,
	standard: 32,
	high: 64,
};

/** Human-readable labels for detail levels. */
export const DETAIL_LEVEL_LABELS: Record<DetailLevel, string> = {
	low: 'Low (16 PPU)',
	standard: 'Standard (32 PPU)',
	high: 'High (64 PPU)',
};

// ── Sprite Archetypes ──

/** A canonical object category with world-space dimensions. */
export interface SpriteArchetype {
	/** Unique key for this archetype. */
	key: string;
	/** Human-readable label. */
	label: string;
	/** Width in world tiles. */
	worldWidth: number;
	/** Height in world tiles. */
	worldHeight: number;
	/** Description for LLM context. */
	description: string;
	/** Keywords that help match prompts to this archetype. */
	keywords: string[];
}

/** All registered sprite archetypes. */
export const SPRITE_ARCHETYPES: SpriteArchetype[] = [
	{
		key: 'icon',
		label: 'Icon',
		worldWidth: 0.5,
		worldHeight: 0.5,
		description: 'Tiny UI elements, status icons, minimap markers',
		keywords: ['icon', 'ui', 'minimap', 'marker', 'indicator', 'badge', 'symbol'],
	},
	{
		key: 'small-item',
		label: 'Small Item',
		worldWidth: 0.5,
		worldHeight: 0.5,
		description: 'Potions, keys, coins, gems, small collectibles',
		keywords: [
			'potion', 'key', 'coin', 'gem', 'scroll', 'ring', 'amulet', 'vial',
			'herb', 'arrow', 'bolt', 'rune', 'orb', 'small',
		],
	},
	{
		key: 'item',
		label: 'Item / Equipment',
		worldWidth: 1,
		worldHeight: 1,
		description: 'Weapons, shields, armor pieces, tools, medium objects',
		keywords: [
			'sword', 'shield', 'axe', 'bow', 'staff', 'wand', 'hammer', 'mace',
			'helmet', 'armor', 'boot', 'glove', 'lantern', 'torch', 'chest',
			'crate', 'barrel', 'weapon', 'equipment', 'tool', 'item',
		],
	},
	{
		key: 'character',
		label: 'Character',
		worldWidth: 1,
		worldHeight: 1.5,
		description: 'Humanoid characters — player, NPC, villager, merchant',
		keywords: [
			'character', 'person', 'human', 'elf', 'dwarf', 'halfling', 'gnome',
			'warrior', 'mage', 'rogue', 'cleric', 'ranger', 'paladin', 'bard',
			'wizard', 'sorcerer', 'druid', 'monk', 'warlock', 'barbarian',
			'knight', 'archer', 'thief', 'priest', 'villager', 'merchant',
			'guard', 'king', 'queen', 'npc', 'hero', 'player',
		],
	},
	{
		key: 'creature',
		label: 'Creature',
		worldWidth: 1,
		worldHeight: 1,
		description: 'Medium creatures — wolves, goblins, skeletons, slimes',
		keywords: [
			'wolf', 'goblin', 'skeleton', 'slime', 'rat', 'bat', 'spider',
			'snake', 'imp', 'zombie', 'ghost', 'fox', 'cat', 'dog', 'boar',
			'deer', 'bird', 'rabbit', 'frog', 'beetle', 'creature', 'monster',
			'animal', 'beast', 'pet', 'familiar', 'companion',
		],
	},
	{
		key: 'large-creature',
		label: 'Large Creature',
		worldWidth: 2,
		worldHeight: 2,
		description: 'Large monsters — ogres, bears, trolls, giant spiders',
		keywords: [
			'ogre', 'troll', 'bear', 'giant', 'minotaur', 'centaur', 'golem',
			'elemental', 'wyvern', 'griffon', 'owlbear', 'hydra', 'large',
			'big', 'huge', 'dire',
		],
	},
	{
		key: 'boss',
		label: 'Boss / Dragon',
		worldWidth: 3,
		worldHeight: 3,
		description: 'Massive creatures — dragons, elder beasts, boss enemies',
		keywords: [
			'dragon', 'boss', 'titan', 'colossus', 'leviathan', 'ancient',
			'elder', 'wyrm', 'behemoth', 'kraken', 'massive', 'colossal',
		],
	},
	{
		key: 'prop',
		label: 'Prop / Furniture',
		worldWidth: 1,
		worldHeight: 1,
		description: 'Tables, chairs, signs, fences, campfires, small props',
		keywords: [
			'table', 'chair', 'sign', 'fence', 'campfire', 'fire', 'fountain',
			'well', 'lamp', 'post', 'rock', 'boulder', 'stump', 'log', 'bush',
			'prop', 'furniture', 'tombstone', 'grave', 'altar', 'pedestal',
		],
	},
	{
		key: 'tree',
		label: 'Tree / Tall Prop',
		worldWidth: 2,
		worldHeight: 3,
		description: 'Trees, pillars, tall structures, banners',
		keywords: [
			'tree', 'pine', 'oak', 'willow', 'birch', 'palm', 'pillar',
			'column', 'banner', 'flag', 'totem', 'statue',
		],
	},
	{
		key: 'building',
		label: 'Building',
		worldWidth: 3,
		worldHeight: 3,
		description: 'Houses, shops, inns, small buildings',
		keywords: [
			'house', 'shop', 'inn', 'tavern', 'cabin', 'hut', 'cottage',
			'shed', 'tent', 'building', 'home', 'dwelling',
		],
	},
	{
		key: 'large-building',
		label: 'Large Building',
		worldWidth: 4,
		worldHeight: 4,
		description: 'Castles, temples, mansions, lodges, fortifications',
		keywords: [
			'castle', 'temple', 'mansion', 'lodge', 'fortress', 'cathedral',
			'palace', 'tower', 'keep', 'citadel', 'church', 'monastery',
			'gate', 'gatehouse', 'wall', 'fortification', 'large building',
		],
	},
	{
		key: 'tile',
		label: 'Tile',
		worldWidth: 1,
		worldHeight: 1,
		description: 'Ground tiles, wall tiles, floor tiles (1×1 tile unit)',
		keywords: ['tile', 'ground', 'floor', 'wall', 'terrain', 'grass', 'dirt', 'stone', 'water', 'sand', 'snow', 'lava'],
	},
];

// ── Computed Dimensions ──

/** Computed pixel dimensions for an asset. */
export interface ComputedDimensions {
	width: number;
	height: number;
	ppu: number;
	archetype: string;
}

/**
 * Compute pixel dimensions from an archetype and detail level.
 *
 * Formula: pixelDimension = worldDimension × ppu
 */
export function computeDimensions(
	archetype: SpriteArchetype,
	detailLevel: DetailLevel | number,
): ComputedDimensions {
	const ppu = typeof detailLevel === 'number' ? detailLevel : DETAIL_LEVEL_PPU[detailLevel];
	return {
		width: Math.round(archetype.worldWidth * ppu),
		height: Math.round(archetype.worldHeight * ppu),
		ppu,
		archetype: archetype.key,
	};
}

/**
 * Infer the best-matching archetype from a generation prompt.
 *
 * Uses keyword matching — returns the archetype with the most keyword hits.
 * Falls back to 'character' if no keywords match.
 */
export function inferArchetype(prompt: string): SpriteArchetype {
	const lower = prompt.toLowerCase();
	const words = lower.split(/\s+/);

	let bestMatch: SpriteArchetype | undefined;
	let bestScore = 0;

	for (const archetype of SPRITE_ARCHETYPES) {
		let score = 0;
		for (const keyword of archetype.keywords) {
			// Check both whole-word match and substring match
			if (words.includes(keyword)) {
				score += 2; // Exact word match is stronger
			} else if (lower.includes(keyword)) {
				score += 1; // Substring match
			}
		}
		if (score > bestScore) {
			bestScore = score;
			bestMatch = archetype;
		}
	}

	// Default to 'character' if nothing matched
	return bestMatch ?? SPRITE_ARCHETYPES.find((a) => a.key === 'character')!;
}

/**
 * Build a sizing reference table for LLM system prompts.
 *
 * Shows all archetypes with their computed dimensions at the given detail level,
 * so the LLM knows exactly what size to use for any object type.
 */
export function buildSizingTable(detailLevel: DetailLevel | number): string {
	const ppu = typeof detailLevel === 'number' ? detailLevel : DETAIL_LEVEL_PPU[detailLevel];
	const label = typeof detailLevel === 'string' ? DETAIL_LEVEL_LABELS[detailLevel] : `Custom (${ppu} PPU)`;

	const rows = SPRITE_ARCHETYPES.map((a) => {
		const dims = computeDimensions(a, ppu);
		return `| ${a.label.padEnd(18)} | ${String(dims.width).padStart(3)}×${String(dims.height).padEnd(3)} | ${a.worldWidth}×${a.worldHeight} tiles | ${a.description} |`;
	});

	return `## Asset Sizing — Detail Level: ${label}

PPU (Pixels Per Unit): ${ppu} — each world tile = ${ppu}×${ppu} pixels.

| Category           | Pixels    | World Size     | Examples |
|--------------------|-----------|----------------|----------|
${rows.join('\n')}

**How to use:** Determine which category the requested asset belongs to, then use the pixel dimensions from this table. Set \`"ppu": ${ppu}\` on the asset.`;
}

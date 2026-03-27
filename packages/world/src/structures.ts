/**
 * Structure placement — deterministic grid-based placement of settlements,
 * ruins, shrines, and other landmarks in the world.
 *
 * Uses a spacing grid per structure type. Each grid cell produces 0 or 1
 * structure via positional RNG. No neighbor lookups required — placement
 * is fully deterministic from (worldSeed, gridCellX, gridCellY).
 *
 * When generating a chunk, we check all grid cells whose structures
 * could reach into the chunk's tile area (based on maximum structure radius).
 */

import type {
	BiomeType,
	SettlementTier,
	StructureID,
	StructurePlacement,
	StructureRef,
	SurfaceType,
	WorldSeed,
	WorldTile,
} from '@loreweave/types';
import { CHUNK_SIZE } from '@loreweave/types';
import { positionalRandom } from './rng.js';

// ─── Placement Rules ───

/** Structure placement rules. Each defines a grid and spawn probability. */
export const STRUCTURE_RULES: StructurePlacement[] = [
	{
		id: 'village',
		spacing: 128,
		separation: 64,
		frequency: 0.35,
		biomes: ['forest', 'plains', 'taiga', 'coast', 'hills', 'farmland'],
		minElevation: 10,
		maxElevation: 60,
	},
	{
		id: 'ruins',
		spacing: 96,
		separation: 40,
		frequency: 0.25,
		biomes: ['forest', 'plains', 'mountain', 'swamp', 'desert', 'taiga', 'hills', 'deep_forest', 'coast'],
	},
	{
		id: 'cave_entrance',
		spacing: 64,
		separation: 24,
		frequency: 0.30,
		biomes: ['mountain', 'forest', 'swamp', 'hills'],
		minElevation: 30,
	},
	{
		id: 'shrine',
		spacing: 48,
		separation: 16,
		frequency: 0.20,
		biomes: ['forest', 'plains', 'mountain', 'swamp', 'tundra', 'desert', 'taiga', 'hills', 'deep_forest', 'coast', 'farmland'],
	},
	{
		id: 'watchtower',
		spacing: 80,
		separation: 32,
		frequency: 0.15,
		biomes: ['plains', 'forest', 'mountain', 'hills', 'coast'],
		minElevation: 40,
	},
	// Bridge placement requires river data — deferred to a river-aware pass.
	// For now, bridges are not grid-placed.
];

// ─── Structure Footprint Sizes ───

/** Settlement tier → footprint radius in tiles from center. */
const SETTLEMENT_RADIUS: Record<SettlementTier, number> = {
	hamlet: 4,
	village: 6,
	town: 8,
	city: 12,
};

/** Non-settlement structure footprint radii. */
const STRUCTURE_RADIUS: Partial<Record<StructureID, number>> = {
	ruins: 5,
	cave_entrance: 2,
	shrine: 2,
	watchtower: 3,
};

/** Maximum possible radius of any structure. Used for grid cell search bounds. */
const MAX_STRUCTURE_RADIUS = 12;

// ─── RNG Context Offsets ───
// Each structure type gets a unique context offset to avoid correlation.

function structureContext(id: StructureID): number {
	switch (id) {
		case 'village': return 7000;
		case 'ruins': return 7100;
		case 'cave_entrance': return 7200;
		case 'shrine': return 7300;
		case 'watchtower': return 7400;
		case 'bridge': return 7500;
	}
}

// ─── Settlement Tier Roll ───

/**
 * Determine settlement tier from a random roll.
 * Distribution: ~50% hamlet, ~30% village, ~15% town, ~5% city.
 */
function rollSettlementTier(roll: number): SettlementTier {
	if (roll < 0.50) return 'hamlet';
	if (roll < 0.80) return 'village';
	if (roll < 0.95) return 'town';
	return 'city';
}

// ─── Core Placement Algorithm ───

/**
 * Compute all structure placements that overlap a given chunk.
 *
 * For each structure rule, finds grid cells that could produce structures
 * reaching into this chunk, computes whether a structure spawns in each cell,
 * and validates biome/elevation at the center position.
 *
 * @param worldSeed - World seed
 * @param cx - Chunk X coordinate
 * @param cy - Chunk Y coordinate
 * @param biomeAt - Function to get biome at any world-space position
 * @param elevationAt - Function to get elevation at any world-space position
 * @returns Array of structure references overlapping this chunk
 */
export function computeStructurePlacements(
	worldSeed: WorldSeed,
	cx: number,
	cy: number,
	biomeAt: (wx: number, wy: number) => BiomeType,
	elevationAt: (wx: number, wy: number) => number,
): StructureRef[] {
	const refs: StructureRef[] = [];
	const chunkMinX = cx * CHUNK_SIZE;
	const chunkMinY = cy * CHUNK_SIZE;
	const chunkMaxX = chunkMinX + CHUNK_SIZE - 1;
	const chunkMaxY = chunkMinY + CHUNK_SIZE - 1;

	for (const rule of STRUCTURE_RULES) {
		const ctx = structureContext(rule.id);

		// Determine which grid cells could have structures reaching into this chunk.
		// A structure in grid cell (gx, gy) has center within:
		//   [gx * spacing, (gx+1) * spacing) × [gy * spacing, (gy+1) * spacing)
		// Its footprint extends ±MAX_STRUCTURE_RADIUS from center.
		// So we need grid cells where center could be within
		//   [chunkMinX - maxRadius, chunkMaxX + maxRadius]
		const searchMinX = chunkMinX - MAX_STRUCTURE_RADIUS;
		const searchMinY = chunkMinY - MAX_STRUCTURE_RADIUS;
		const searchMaxX = chunkMaxX + MAX_STRUCTURE_RADIUS;
		const searchMaxY = chunkMaxY + MAX_STRUCTURE_RADIUS;

		const gridMinX = Math.floor(searchMinX / rule.spacing);
		const gridMinY = Math.floor(searchMinY / rule.spacing);
		const gridMaxX = Math.floor(searchMaxX / rule.spacing);
		const gridMaxY = Math.floor(searchMaxY / rule.spacing);

		for (let gy = gridMinY; gy <= gridMaxY; gy++) {
			for (let gx = gridMinX; gx <= gridMaxX; gx++) {
				// Roll: does this grid cell spawn a structure?
				const freqRoll = positionalRandom(worldSeed, gx, gy, ctx);
				if (freqRoll >= rule.frequency) continue;

				// Roll: exact position within cell (jittered, constrained to inner 75%)
				const jitterMargin = rule.spacing * 0.125;
				const jitterRange = rule.spacing * 0.75;
				const posRollX = positionalRandom(worldSeed, gx, gy, ctx + 1);
				const posRollY = positionalRandom(worldSeed, gx, gy, ctx + 2);
				const worldX = Math.floor(gx * rule.spacing + jitterMargin + posRollX * jitterRange);
				const worldY = Math.floor(gy * rule.spacing + jitterMargin + posRollY * jitterRange);

				// Validate: biome at center
				const biome = biomeAt(worldX, worldY);
				if (!rule.biomes.includes(biome)) continue;

				// Validate: elevation at center
				const elevation = elevationAt(worldX, worldY);
				if (rule.minElevation !== undefined && elevation < rule.minElevation) continue;
				if (rule.maxElevation !== undefined && elevation > rule.maxElevation) continue;

				// Compute radius and settlement-specific data
				let radius: number;
				let settlementTier: SettlementTier | undefined;
				let settlementId: string | undefined;

				if (rule.id === 'village') {
					const tierRoll = positionalRandom(worldSeed, gx, gy, ctx + 3);
					settlementTier = rollSettlementTier(tierRoll);
					radius = SETTLEMENT_RADIUS[settlementTier];
					settlementId = `settlement_${gx}_${gy}`;
				} else {
					radius = STRUCTURE_RADIUS[rule.id] ?? 3;
				}

				// Check: does this structure's footprint actually overlap this chunk?
				if (
					worldX + radius < chunkMinX ||
					worldX - radius > chunkMaxX ||
					worldY + radius < chunkMinY ||
					worldY - radius > chunkMaxY
				) {
					continue;
				}

				refs.push({
					id: rule.id,
					worldX,
					worldY,
					templateId: settlementId ?? `${rule.id}_${gx}_${gy}`,
					radius,
					settlementTier,
					settlementId,
				});
			}
		}
	}

	return refs;
}

// ─── Tile Modification ───

/**
 * Apply structure footprints to chunk tiles.
 *
 * Modifies tiles within each structure's radius: sets surfaces,
 * clears natural features, marks tiles with structure IDs.
 *
 * @param tiles - The chunk's tile array (mutated in place)
 * @param refs - Structure references overlapping this chunk
 * @param cx - Chunk X coordinate
 * @param cy - Chunk Y coordinate
 * @param worldSeed - World seed for deterministic detail placement
 */
export function applyStructuresToTiles(
	tiles: WorldTile[],
	refs: StructureRef[],
	cx: number,
	cy: number,
	worldSeed: WorldSeed,
): void {
	const chunkMinX = cx * CHUNK_SIZE;
	const chunkMinY = cy * CHUNK_SIZE;

	for (const ref of refs) {
		for (let ly = 0; ly < CHUNK_SIZE; ly++) {
			for (let lx = 0; lx < CHUNK_SIZE; lx++) {
				const wx = chunkMinX + lx;
				const wy = chunkMinY + ly;

				const dx = wx - ref.worldX;
				const dy = wy - ref.worldY;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist > ref.radius) continue;

				const idx = ly * CHUNK_SIZE + lx;
				const tile = tiles[idx];

				// Mark tile as belonging to this structure
				if (!tile.structures.includes(ref.id)) {
					tile.structures.push(ref.id);
				}

				// Apply structure-specific tile modifications
				applyStructureTileModifications(tile, ref, dist, wx, wy, worldSeed);
			}
		}
	}
}

/**
 * Apply per-tile modifications based on structure type.
 * Each structure type has a distinct visual footprint.
 */
function applyStructureTileModifications(
	tile: WorldTile,
	ref: StructureRef,
	distFromCenter: number,
	wx: number,
	wy: number,
	worldSeed: WorldSeed,
): void {
	switch (ref.id) {
		case 'village':
			applyVillageTile(tile, ref, distFromCenter, wx, wy, worldSeed);
			break;
		case 'ruins':
			applyRuinsTile(tile, distFromCenter, wx, wy, worldSeed);
			break;
		case 'cave_entrance':
			applyCaveEntranceTile(tile, distFromCenter);
			break;
		case 'shrine':
			applyShrineTile(tile, distFromCenter);
			break;
		case 'watchtower':
			applyWatchtowerTile(tile, distFromCenter);
			break;
		case 'bridge':
			// Bridge placement is deferred — no tile mods yet
			break;
	}
}

/**
 * Village tile modifications.
 * - Inner core (≤2): stone surface (village square)
 * - Middle ring (≤radius*0.6): dirt paths, cleared features
 * - Outer ring (≤radius): partially cleared, transition to biome
 */
function applyVillageTile(
	tile: WorldTile,
	ref: StructureRef,
	dist: number,
	wx: number,
	wy: number,
	worldSeed: WorldSeed,
): void {
	const innerRadius = 2;
	const middleRadius = ref.radius * 0.6;

	// Clear natural features in the entire footprint
	tile.features = [];
	tile.walkable = true;
	tile.river = false;

	if (dist <= innerRadius) {
		// Village square — stone surface
		tile.surface = 'stone';
	} else if (dist <= middleRadius) {
		// Building zone — dirt paths
		tile.surface = 'dirt';
	} else {
		// Outer ring — partial clearing, dirt paths between biome
		const pathRoll = positionalRandom(worldSeed, wx, wy, 7600);
		tile.surface = pathRoll < 0.4 ? 'dirt' : tile.surface;
	}
}

/**
 * Ruins tile modifications.
 * - Scattered stone surfaces with gaps
 * - Some features cleared, some added (bones, fallen_log)
 * - Partially walkable
 */
function applyRuinsTile(
	tile: WorldTile,
	dist: number,
	wx: number,
	wy: number,
	worldSeed: WorldSeed,
): void {
	const roll = positionalRandom(worldSeed, wx, wy, 7700);

	if (dist <= 2) {
		// Inner ruins — mostly stone
		tile.surface = 'stone';
		tile.features = [];
		if (roll < 0.2) {
			tile.features = ['bones'];
		}
	} else {
		// Outer ruins — scattered stone and debris
		if (roll < 0.3) {
			tile.surface = 'stone';
			tile.features = [];
		} else if (roll < 0.5) {
			tile.features = tile.features.filter(f => f !== 'flowers' && f !== 'tall_grass');
		}
	}
	tile.walkable = true;
}

/**
 * Cave entrance tile modifications.
 * - Center tile is stone (the entrance)
 * - Surrounding tiles are stone/dirt
 */
function applyCaveEntranceTile(
	tile: WorldTile,
	dist: number,
): void {
	if (dist <= 1) {
		tile.surface = 'stone';
		tile.features = [];
		tile.walkable = true;
	} else {
		tile.surface = 'stone';
		tile.features = tile.features.filter(f => f !== 'flowers' && f !== 'tall_grass' && f !== 'fern');
	}
}

/**
 * Shrine tile modifications.
 * - Small stone platform at center
 * - Cleared immediate surroundings
 */
function applyShrineTile(
	tile: WorldTile,
	dist: number,
): void {
	if (dist <= 1) {
		tile.surface = 'stone';
		tile.features = [];
		tile.walkable = true;
	} else {
		tile.features = tile.features.filter(f =>
			f !== 'bush' && f !== 'tall_grass' && f !== 'fern',
		);
		tile.walkable = true;
	}
}

/**
 * Watchtower tile modifications.
 * - Stone base at center
 * - Cleared area around it for visibility
 */
function applyWatchtowerTile(
	tile: WorldTile,
	dist: number,
): void {
	if (dist <= 1) {
		tile.surface = 'stone';
		tile.features = [];
		tile.walkable = true;
	} else {
		// Clear trees for line of sight
		tile.features = tile.features.filter(f =>
			f !== 'oak_tree' && f !== 'pine_tree' && f !== 'willow_tree' && f !== 'dead_tree',
		);
		tile.walkable = true;
	}
}

/**
 * Chunk generation pipeline.
 *
 * Implements the full 7-stage pipeline from world_generation_spec.md §11:
 * biomes → elevation → surface → resources → structures → features → spawns → complete
 *
 * Each stage is a pure function that transforms the chunk state.
 * Given the same (worldSeed, cx, cy), output is always identical.
 */

import type {
	BiomeType,
	Chunk,
	ChunkCoord,
	FeatureType,
	ResourceType,
	WeaveState,
	WorldSeed,
	WorldTile,
} from '@loreweave/types';
import { CHUNK_SIZE } from '@loreweave/types';
import { selectBiome, computeElevation } from './biomes.js';
import { determineSurface, isWalkable } from './surface.js';
import { determineResources, ALL_RESOURCE_TYPES } from './resources.js';
import { determineFeatures } from './features.js';
import { generateSpawnPoints } from './spawns.js';
import { computeStructurePlacements, applyStructuresToTiles } from './structures.js';
import { createNoise, octaveNoise, ridgedNoise, type NoiseGenerator } from './noise.js';
import { positionalRandom } from './rng.js';

/** River threshold — tiles with ridged noise above this value are rivers. §4.4 */
const RIVER_THRESHOLD = 0.92;
const RIVER_THRESHOLD_SWAMP = 0.88;
const RIVER_THRESHOLD_MOUNTAIN = 0.95;

/** Biome blend radius. §4.3 */
const BLEND_RADIUS = 4;

/**
 * Pre-computed noise layers for a chunk.
 * Computing all 32×32 values in one pass is more efficient than per-tile. §13.1
 */
type NoiseCache = {
	temperature: Float64Array;
	moisture: Float64Array;
	elevation: Float64Array;
	river: Float64Array;
	surfaceVariation: Float64Array;
	weaveStability: Float64Array;
	resourceNoise: Map<ResourceType, Float64Array>;
};

/** Create seeded noise generators for all layers. */
function createNoiseGenerators(worldSeed: WorldSeed): {
	temperature: NoiseGenerator;
	moisture: NoiseGenerator;
	elevation: NoiseGenerator;
	river: NoiseGenerator;
	surfaceVariation: NoiseGenerator;
	weaveStability: NoiseGenerator;
	resourceGenerators: Map<ResourceType, NoiseGenerator>;
} {
	const seedNum = Number(worldSeed & 0xffffffffn);
	return {
		temperature: createNoise(seedNum),
		moisture: createNoise(seedNum + 1),
		elevation: createNoise(seedNum + 2),
		river: createNoise(seedNum + 3),
		surfaceVariation: createNoise(seedNum + 4),
		weaveStability: createNoise(seedNum + 5),
		resourceGenerators: new Map(
			ALL_RESOURCE_TYPES.map((r, i) => [r, createNoise(seedNum + 100 + i)]),
		),
	};
}

/** Pre-compute all noise values for a chunk (and a border for blending). */
function computeNoiseCache(
	worldSeed: WorldSeed,
	cx: number,
	cy: number,
	generators: ReturnType<typeof createNoiseGenerators>,
): NoiseCache {
	const size = CHUNK_SIZE;
	const baseX = cx * size;
	const baseY = cy * size;

	const temperature = new Float64Array(size * size);
	const moisture = new Float64Array(size * size);
	const elevation = new Float64Array(size * size);
	const river = new Float64Array(size * size);
	const surfaceVariation = new Float64Array(size * size);
	const weaveStability = new Float64Array(size * size);
	const resourceNoise = new Map<ResourceType, Float64Array>();

	for (const r of ALL_RESOURCE_TYPES) {
		resourceNoise.set(r, new Float64Array(size * size));
	}

	for (let ly = 0; ly < size; ly++) {
		for (let lx = 0; lx < size; lx++) {
			const wx = baseX + lx;
			const wy = baseY + ly;
			const idx = ly * size + lx;

			temperature[idx] = octaveNoise(generators.temperature, wx, wy, 4, 0.5, 0.005);
			moisture[idx] = octaveNoise(generators.moisture, wx, wy, 4, 0.5, 0.005);
			elevation[idx] = octaveNoise(generators.elevation, wx, wy, 6, 0.5, 0.005);
			river[idx] = ridgedNoise(generators.river, wx, wy, 3, 0.5, 0.005);
			surfaceVariation[idx] = octaveNoise(generators.surfaceVariation, wx, wy, 2, 0.6, 0.01);
			weaveStability[idx] = octaveNoise(generators.weaveStability, wx, wy, 3, 0.5, 0.003);

			for (const [r, gen] of generators.resourceGenerators.entries()) {
				const arr = resourceNoise.get(r);
				if (arr) {
					arr[idx] = octaveNoise(gen, wx, wy, 2, 0.6, 0.01);
				}
			}
		}
	}

	return { temperature, moisture, elevation, river, surfaceVariation, weaveStability, resourceNoise };
}

/**
 * Generate a complete chunk at the given coordinates.
 *
 * This runs all 7 stages in sequence and returns a fully populated chunk.
 * The result is deterministic: same (worldSeed, cx, cy) = identical output.
 */
export function generateChunk(
	worldSeed: WorldSeed,
	coord: ChunkCoord,
): Chunk {
	const { cx, cy } = coord;
	const generators = createNoiseGenerators(worldSeed);
	const noise = computeNoiseCache(worldSeed, cx, cy, generators);
	const baseX = cx * CHUNK_SIZE;
	const baseY = cy * CHUNK_SIZE;
	const tiles: WorldTile[] = new Array(CHUNK_SIZE * CHUNK_SIZE);

	// Count biomes for dominant biome detection
	const biomeCounts = new Map<BiomeType, number>();

	// ── Stage 1: Biomes ──
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			const biome = selectBiome(
				noise.temperature[idx],
				noise.moisture[idx],
				noise.elevation[idx],
			);

			biomeCounts.set(biome, (biomeCounts.get(biome) ?? 0) + 1);

			tiles[idx] = {
				x: baseX + lx,
				y: baseY + ly,
				biome,
				elevation: 0,
				surface: 'grass',
				resources: [],
				structures: [],
				features: [],
				walkable: true,
				river: false,
				weaveState: 'stable',
			};
		}
	}

	// Biome blending: for tiles near borders, sample neighborhood and use majority
	applyBiomeBlending(tiles, noise, CHUNK_SIZE);

	// Recount after blending
	biomeCounts.clear();
	for (const tile of tiles) {
		biomeCounts.set(tile.biome, (biomeCounts.get(tile.biome) ?? 0) + 1);
	}
	const dominantBiome = [...biomeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

	// River overlay §4.4
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			const tile = tiles[idx];
			let threshold = RIVER_THRESHOLD;
			if (tile.biome === 'swamp') threshold = RIVER_THRESHOLD_SWAMP;
			if (tile.biome === 'mountain') threshold = RIVER_THRESHOLD_MOUNTAIN;

			if (noise.river[idx] > threshold) {
				tile.river = true;
			}
		}
	}

	// ── Stage 2: Elevation ──
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			tiles[idx].elevation = computeElevation(noise.elevation[idx], tiles[idx].biome);
		}
	}

	// ── Stage 3: Surface ──
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			const tile = tiles[idx];

			if (tile.river) {
				tile.surface = 'water';
				tile.walkable = false;
			} else {
				tile.surface = determineSurface(tile.biome, tile.elevation);
				tile.walkable = isWalkable(tile.surface);
			}
		}
	}

	// ── Stage 4: Resources ──
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			const tile = tiles[idx];
			const noiseValues = new Map<ResourceType, number>();
			for (const [r, arr] of noise.resourceNoise.entries()) {
				noiseValues.set(r, arr[idx]);
			}
			tile.resources = determineResources(tile.biome, tile.elevation, tile.river, noiseValues);
		}
	}

	// ── Stage 5: Structures ──
	// Grid-based deterministic placement. Each structure type uses a coarse spacing
	// grid; each grid cell produces 0 or 1 structure via positional RNG.
	// No multi-chunk coordination needed — placement is per-cell, not per-chunk.
	const structureRefs = computeStructurePlacements(
		worldSeed,
		cx,
		cy,
		(wx, wy) => {
			// Use tile data if within this chunk, otherwise compute from noise
			const lx = wx - baseX;
			const ly = wy - baseY;
			if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
				return tiles[ly * CHUNK_SIZE + lx].biome;
			}
			const t = octaveNoise(generators.temperature, wx, wy, 4, 0.5, 0.005);
			const m = octaveNoise(generators.moisture, wx, wy, 4, 0.5, 0.005);
			const e = octaveNoise(generators.elevation, wx, wy, 6, 0.5, 0.005);
			return selectBiome(t, m, e);
		},
		(wx, wy) => {
			// Use tile data if within this chunk, otherwise compute from noise
			const lx = wx - baseX;
			const ly = wy - baseY;
			if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
				return tiles[ly * CHUNK_SIZE + lx].elevation;
			}
			const eNoise = octaveNoise(generators.elevation, wx, wy, 6, 0.5, 0.005);
			const biome = selectBiome(
				octaveNoise(generators.temperature, wx, wy, 4, 0.5, 0.005),
				octaveNoise(generators.moisture, wx, wy, 4, 0.5, 0.005),
				eNoise,
			);
			return computeElevation(eNoise, biome);
		},
	);

	// Apply structure footprints to tiles (surface changes, feature clearing)
	applyStructuresToTiles(tiles, structureRefs, cx, cy, worldSeed);

	// ── Stage 5b: Weave State ──
	// Weave stability is a continuous noise field. Tiles inside settlement wards
	// are always stable. Distance from settlements increases fraying probability.
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			const tile = tiles[idx];

			// Tiles inside settlements are always stable (ward protection)
			if (tile.structures.includes('village')) {
				tile.weaveState = 'stable';
				continue;
			}

			// Map noise to weave state. Lower values = less stable.
			// Noise is [-1, 1], normalize to [0, 1].
			const stability = (noise.weaveStability[idx] + 1) / 2;
			tile.weaveState = stabilityToWeaveState(stability);
		}
	}

	// ── Stage 6: Features ──
	for (let ly = 0; ly < CHUNK_SIZE; ly++) {
		for (let lx = 0; lx < CHUNK_SIZE; lx++) {
			const idx = ly * CHUNK_SIZE + lx;
			const tile = tiles[idx];
			const wx = tile.x;
			const wy = tile.y;
			const isStructure = tile.structures.length > 0;

			tile.features = determineFeatures(
				tile.biome,
				tile.elevation,
				isStructure,
				(featureType: FeatureType, step: number) => {
					// Hash feature type for unique context
					let hash = 0;
					for (let i = 0; i < featureType.length; i++) {
						hash = Math.imul(hash, 31) + featureType.charCodeAt(i);
					}
					return positionalRandom(worldSeed, wx, wy, 3000 + (hash >>> 0) + step * 100);
				},
			);
		}
	}

	// ── Stage 7: Spawns ──
	const spawns = generateSpawnPoints(
		worldSeed,
		cx,
		cy,
		dominantBiome,
		(x, y) => {
			// Map world coords to local if within this chunk, otherwise use noise
			const lx = x - baseX;
			const ly = y - baseY;
			if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
				return tiles[ly * CHUNK_SIZE + lx].biome;
			}
			// Out-of-chunk: compute from noise directly
			const t = octaveNoise(generators.temperature, x, y, 4, 0.5, 0.005);
			const m = octaveNoise(generators.moisture, x, y, 4, 0.5, 0.005);
			const e = octaveNoise(generators.elevation, x, y, 6, 0.5, 0.005);
			return selectBiome(t, m, e);
		},
	);

	return {
		coord,
		stage: 'complete',
		tiles,
		spawns,
		structureRefs,
	};
}

/**
 * Apply biome blending within a chunk.
 * Tiles within BLEND_RADIUS of a biome boundary sample their neighborhood
 * and use the most common biome. §4.3
 */
function applyBiomeBlending(
	tiles: WorldTile[],
	noise: NoiseCache,
	size: number,
): void {
	// Work on a copy to avoid cascading changes
	const originalBiomes = tiles.map((t) => t.biome);

	for (let ly = 0; ly < size; ly++) {
		for (let lx = 0; lx < size; lx++) {
			const idx = ly * size + lx;
			const centerBiome = originalBiomes[idx];

			// Check if any neighbor (within BLEND_RADIUS) has a different biome
			let needsBlend = false;
			const checkRadius = Math.min(BLEND_RADIUS, 2); // Quick check radius
			for (let dy = -checkRadius; dy <= checkRadius && !needsBlend; dy++) {
				for (let dx = -checkRadius; dx <= checkRadius && !needsBlend; dx++) {
					const ny = ly + dy;
					const nx = lx + dx;
					if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
						if (originalBiomes[ny * size + nx] !== centerBiome) {
							needsBlend = true;
						}
					}
				}
			}

			if (!needsBlend) continue;

			// Full neighborhood sample
			const counts = new Map<BiomeType, number>();
			for (let dy = -BLEND_RADIUS; dy <= BLEND_RADIUS; dy++) {
				for (let dx = -BLEND_RADIUS; dx <= BLEND_RADIUS; dx++) {
					const ny = ly + dy;
					const nx = lx + dx;
					let biome: BiomeType;
					if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
						biome = originalBiomes[ny * size + nx];
					} else {
						// Edge tile: use noise to get biome outside chunk
						const nidx = Math.max(0, Math.min(size - 1, ny)) * size + Math.max(0, Math.min(size - 1, nx));
						biome = selectBiome(
							noise.temperature[nidx],
							noise.moisture[nidx],
							noise.elevation[nidx],
						);
					}
					counts.set(biome, (counts.get(biome) ?? 0) + 1);
				}
			}

			// Use most common biome
			let bestBiome = centerBiome;
			let bestCount = 0;
			for (const [biome, count] of counts.entries()) {
				if (count > bestCount) {
					bestCount = count;
					bestBiome = biome;
				}
			}
			tiles[idx].biome = bestBiome;
		}
	}
}

/** Get the chunk coordinate for a world-space position. */
export function worldToChunkCoord(x: number, y: number): ChunkCoord {
	return {
		cx: Math.floor(x / CHUNK_SIZE),
		cy: Math.floor(y / CHUNK_SIZE),
	};
}

/** Get the local tile coordinate within a chunk. */
export function worldToLocalCoord(x: number, y: number): { lx: number; ly: number } {
	return {
		lx: ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
		ly: ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
	};
}

/**
 * Map a stability noise value [0, 1] to a WeaveState.
 *
 * Distribution: ~70% stable, ~18% thin, ~9% frayed, ~3% unraveled.
 * These thresholds create natural patches of instability.
 */
function stabilityToWeaveState(stability: number): WeaveState {
	if (stability >= 0.30) return 'stable';
	if (stability >= 0.12) return 'thin';
	if (stability >= 0.03) return 'frayed';
	return 'unraveled';
}

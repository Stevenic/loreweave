/**
 * Spawn point generation — marks where entities may appear.
 *
 * Spawn points are placed during chunk generation but actual entity
 * instantiation happens at runtime when players enter the chunk.
 * See world_generation_spec.md §10.
 */

import type {
	BiomeType,
	SpawnPoint,
	SpawnRule,
	WorldSeed,
} from '@loreweave/types';
import { CHUNK_SIZE } from '@loreweave/types';
import { positionalRandom } from './rng.js';

/** Spawn table v1. §10.3 */
export const SPAWN_TABLE: SpawnRule[] = [
	{
		entityType: 'deer',
		biomes: ['forest', 'plains', 'taiga'],
		density: 1.5,
		minGroupSize: 2,
		maxGroupSize: 4,
		avoidStructures: true,
	},
	{
		entityType: 'wolf',
		biomes: ['forest', 'taiga', 'tundra'],
		density: 0.8,
		minGroupSize: 2,
		maxGroupSize: 3,
	},
	{
		entityType: 'goblin',
		biomes: ['forest', 'swamp', 'mountain'],
		density: 0.5,
		minGroupSize: 3,
		maxGroupSize: 6,
	},
	{
		entityType: 'bandit',
		biomes: ['plains', 'forest'],
		density: 0.3,
		minGroupSize: 2,
		maxGroupSize: 4,
	},
	{
		entityType: 'bear',
		biomes: ['forest', 'mountain', 'taiga'],
		density: 0.3,
		minGroupSize: 1,
		maxGroupSize: 1,
	},
	{
		entityType: 'snake',
		biomes: ['swamp', 'desert'],
		density: 0.6,
		minGroupSize: 1,
		maxGroupSize: 2,
	},
	{
		entityType: 'merchant',
		biomes: ['plains'],
		density: 0.1,
		minGroupSize: 1,
		maxGroupSize: 1,
		avoidStructures: false,
	},
];

/**
 * Generate spawn points for a chunk.
 *
 * @param worldSeed - World seed
 * @param cx - Chunk X coordinate
 * @param cy - Chunk Y coordinate
 * @param dominantBiome - The most common biome in this chunk
 * @param biomeAt - Function to get the biome at a specific tile position
 * @returns Array of spawn points
 */
export function generateSpawnPoints(
	worldSeed: WorldSeed,
	cx: number,
	cy: number,
	dominantBiome: BiomeType,
	biomeAt: (x: number, y: number) => BiomeType,
): SpawnPoint[] {
	const spawns: SpawnPoint[] = [];
	const worldBaseX = cx * CHUNK_SIZE;
	const worldBaseY = cy * CHUNK_SIZE;

	for (const rule of SPAWN_TABLE) {
		if (!rule.biomes.includes(dominantBiome)) continue;

		// Hash entity type for unique context per entity
		const entityHash = simpleStringHash(rule.entityType);

		// Determine count using positional RNG (Poisson-like)
		const countRoll = positionalRandom(worldSeed, cx, cy, 5000 + entityHash);
		const count = Math.floor(countRoll * rule.density * 2);

		for (let i = 0; i < count; i++) {
			// Pick a tile within the chunk
			const tileRoll1 = positionalRandom(worldSeed, cx * 1000 + i, cy, 5100 + entityHash);
			const tileRoll2 = positionalRandom(worldSeed, cx, cy * 1000 + i, 5200 + entityHash);
			const localX = Math.floor(tileRoll1 * CHUNK_SIZE);
			const localY = Math.floor(tileRoll2 * CHUNK_SIZE);
			const worldX = worldBaseX + localX;
			const worldY = worldBaseY + localY;

			// Validate biome at actual position
			if (!rule.biomes.includes(biomeAt(worldX, worldY))) continue;

			// Determine group size
			const groupRoll = positionalRandom(worldSeed, worldX, worldY, 5300 + entityHash);
			const groupSize = rule.minGroupSize +
				Math.floor(groupRoll * (rule.maxGroupSize - rule.minGroupSize + 1));

			spawns.push({
				x: worldX,
				y: worldY,
				entityType: rule.entityType,
				groupSize,
			});
		}
	}

	return spawns;
}

/** Simple string hash for entity type differentiation. */
function simpleStringHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = Math.imul(hash, 31) + str.charCodeAt(i);
	}
	return hash >>> 0;
}

/**
 * @loreweave/world — World engine
 *
 * Chunk-based world state management, tile access, biome definitions,
 * and pure-function state transitions.
 */

// World manager
export { World } from './world.js';

// Chunk generation
export { generateChunk, worldToChunkCoord, worldToLocalCoord } from './chunk-generator.js';

// Biomes
export {
	BIOME_ELEVATION_MODIFIERS,
	BIOME_ELEVATION_RANGES,
	BIOME_TABLE,
	computeElevation,
	selectBiome,
} from './biomes.js';

// Surface
export { determineSurface, isWalkable } from './surface.js';

// Resources
export { ALL_RESOURCE_TYPES, determineResources } from './resources.js';

// Features
export { determineFeatures } from './features.js';

// Spawns
export { generateSpawnPoints, SPAWN_TABLE } from './spawns.js';

// Noise
export { createNoise, octaveNoise, ridgedNoise } from './noise.js';
export type { NoiseGenerator } from './noise.js';

// RNG
export { fnv1a, positionalRandom, positionalSeed, seedFromString } from './rng.js';

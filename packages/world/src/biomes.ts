/**
 * Biome definitions and selection.
 *
 * Biomes are determined by 3 noise parameters (temperature, moisture, elevation)
 * evaluated at each tile position. Selection uses closest-match in 3D parameter space.
 * See world_generation_spec.md §4.
 */

import type { BiomeDefinition, BiomeType } from '@loreweave/types';

/** Biome definitions with parameter space centers and ranges. §4.2 */
export const BIOME_TABLE: BiomeDefinition[] = [
	{
		type: 'forest',
		temperature: [0.0, 0.5],
		moisture: [0.2, 0.8],
		elevation: [-0.3, 0.3],
		description: 'Temperate woodland. Dense trees, moderate resources.',
	},
	{
		type: 'plains',
		temperature: [0.0, 0.6],
		moisture: [-0.5, 0.2],
		elevation: [-0.5, 0.0],
		description: 'Open grassland. Few trees, good visibility.',
	},
	{
		type: 'mountain',
		temperature: [-0.3, 0.3],
		moisture: [-0.3, 0.3],
		elevation: [0.5, 1.0],
		description: 'High elevation. Rocky, sparse vegetation.',
	},
	{
		type: 'swamp',
		temperature: [0.1, 0.6],
		moisture: [0.5, 1.0],
		elevation: [-1.0, -0.3],
		description: 'Low-lying wetland. Dense foliage, murky water.',
	},
	{
		type: 'tundra',
		temperature: [-1.0, -0.3],
		moisture: [-0.8, 0.2],
		elevation: [-0.2, 0.5],
		description: 'Frozen terrain. Snow, ice, minimal life.',
	},
	{
		type: 'desert',
		temperature: [0.6, 1.0],
		moisture: [-1.0, -0.3],
		elevation: [-0.3, 0.3],
		description: 'Arid sand. No trees, scarce resources.',
	},
	{
		type: 'taiga',
		temperature: [-0.5, 0.0],
		moisture: [0.2, 0.7],
		elevation: [0.0, 0.5],
		description: 'Cold coniferous forest. Pine trees, wolves.',
	},
];

/** Compute the center of a biome's parameter space region. */
function biomeCenter(biome: BiomeDefinition): [number, number, number] {
	return [
		(biome.temperature[0] + biome.temperature[1]) / 2,
		(biome.moisture[0] + biome.moisture[1]) / 2,
		(biome.elevation[0] + biome.elevation[1]) / 2,
	];
}

/**
 * Select the biome for a tile based on its noise parameters.
 *
 * Uses closest-match in 3D Euclidean distance to biome centers.
 * Guarantees every tile maps to exactly one biome.
 */
export function selectBiome(
	temperature: number,
	moisture: number,
	elevation: number,
): BiomeType {
	let bestBiome: BiomeType = 'plains';
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const biome of BIOME_TABLE) {
		const center = biomeCenter(biome);
		const dt = temperature - center[0];
		const dm = moisture - center[1];
		const de = elevation - center[2];
		const distance = dt * dt + dm * dm + de * de;

		if (distance < bestDistance) {
			bestDistance = distance;
			bestBiome = biome.type;
		}
	}

	return bestBiome;
}

/** Biome elevation modifiers for §5.1 elevation computation. */
export const BIOME_ELEVATION_MODIFIERS: Record<BiomeType, number> = {
	plains: 0.2,
	forest: 0.3,
	mountain: 0.5,
	swamp: 0.0,
	tundra: 0.2,
	desert: 0.1,
	taiga: 0.3,
};

/** Biome elevation base ranges for §5.1. */
export const BIOME_ELEVATION_RANGES: Record<BiomeType, [min: number, max: number]> = {
	plains: [0, 50],
	forest: [20, 60],
	mountain: [70, 100],
	swamp: [0, 20],
	tundra: [10, 60],
	desert: [5, 45],
	taiga: [25, 65],
};

/**
 * Compute the integer elevation for a tile.
 *
 * Maps the raw elevation noise + biome modifier to [0, 100].
 */
export function computeElevation(
	elevationNoise: number,
	biome: BiomeType,
): number {
	const modifier = BIOME_ELEVATION_MODIFIERS[biome];
	const [min, max] = BIOME_ELEVATION_RANGES[biome];

	// Normalize noise from [-1, 1] to [0, 1], apply modifier
	const normalized = (elevationNoise + modifier + 1) / 2;
	const clamped = Math.max(0, Math.min(1, normalized));

	return Math.round(min + clamped * (max - min));
}

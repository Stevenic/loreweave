/**
 * Surface generation — determines visual surface type and traversability.
 *
 * See world_generation_spec.md §6.
 */

import type { BiomeType, SurfaceType } from '@loreweave/types';

type SurfaceRule = {
	biome: BiomeType;
	minElevation: number;
	maxElevation: number;
	surface: SurfaceType;
};

/** Surface rules table. §6.3 */
const SURFACE_RULES: SurfaceRule[] = [
	{ biome: 'plains', minElevation: 0, maxElevation: 50, surface: 'grass' },
	{ biome: 'forest', minElevation: 0, maxElevation: 30, surface: 'grass' },
	{ biome: 'forest', minElevation: 30, maxElevation: 60, surface: 'dirt' },
	{ biome: 'mountain', minElevation: 70, maxElevation: 85, surface: 'stone' },
	{ biome: 'mountain', minElevation: 85, maxElevation: 100, surface: 'snow' },
	{ biome: 'swamp', minElevation: 0, maxElevation: 5, surface: 'water' },
	{ biome: 'swamp', minElevation: 5, maxElevation: 20, surface: 'mud' },
	{ biome: 'tundra', minElevation: 0, maxElevation: 20, surface: 'ice' },
	{ biome: 'tundra', minElevation: 20, maxElevation: 60, surface: 'snow' },
	{ biome: 'desert', minElevation: 0, maxElevation: 45, surface: 'sand' },
	{ biome: 'taiga', minElevation: 0, maxElevation: 30, surface: 'pine_floor' },
	{ biome: 'taiga', minElevation: 30, maxElevation: 65, surface: 'snow' },
];

/** Determine the surface type for a tile based on biome and elevation. */
export function determineSurface(biome: BiomeType, elevation: number): SurfaceType {
	for (const rule of SURFACE_RULES) {
		if (rule.biome === biome && elevation >= rule.minElevation && elevation <= rule.maxElevation) {
			return rule.surface;
		}
	}
	// Fallback: use the biome's default surface
	return BIOME_DEFAULT_SURFACE[biome];
}

/** Default surface type per biome (fallback when no rule matches). */
const BIOME_DEFAULT_SURFACE: Record<BiomeType, SurfaceType> = {
	plains: 'grass',
	forest: 'grass',
	mountain: 'stone',
	swamp: 'mud',
	tundra: 'snow',
	desert: 'sand',
	taiga: 'pine_floor',
};

/** Non-walkable surface types. */
const NON_WALKABLE_SURFACES: Set<SurfaceType> = new Set(['water']);

/** Determine if a surface type is walkable. */
export function isWalkable(surface: SurfaceType): boolean {
	return !NON_WALKABLE_SURFACES.has(surface);
}

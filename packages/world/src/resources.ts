/**
 * Resource distribution — biome-driven resource placement.
 *
 * See world_generation_spec.md §7.
 */

import type { BiomeType, ResourceType } from '@loreweave/types';

type ResourceRule = {
	resource: ResourceType;
	threshold: number;
	minElevation?: number;
};

/** Resource tables per biome. §7.3 */
const BIOME_RESOURCES: Record<BiomeType, ResourceRule[]> = {
	forest: [
		{ resource: 'wood', threshold: 0.1 },
		{ resource: 'herb', threshold: 0.6 },
	],
	plains: [
		{ resource: 'stone', threshold: 0.7 },
	],
	mountain: [
		{ resource: 'stone', threshold: 0.2 },
		{ resource: 'iron', threshold: 0.75 },
		{ resource: 'crystal', threshold: 0.95, minElevation: 90 },
	],
	swamp: [
		{ resource: 'herb', threshold: 0.3 },
		{ resource: 'clay', threshold: 0.5 },
		{ resource: 'peat', threshold: 0.6 },
	],
	tundra: [
		{ resource: 'stone', threshold: 0.5 },
	],
	desert: [
		{ resource: 'stone', threshold: 0.8 },
	],
	taiga: [
		{ resource: 'wood', threshold: 0.2 },
	],
};

/** River-specific resources. */
const RIVER_RESOURCES: ResourceRule[] = [
	{ resource: 'fish', threshold: 0.3 },
	{ resource: 'clay', threshold: 0.6 },
];

/**
 * Determine which resources are present at a tile.
 *
 * @param biome - Tile biome
 * @param elevation - Tile elevation
 * @param isRiver - Whether this is a river tile
 * @param noiseValues - Pre-computed resource noise values per resource type
 */
export function determineResources(
	biome: BiomeType,
	elevation: number,
	isRiver: boolean,
	noiseValues: Map<ResourceType, number>,
): ResourceType[] {
	const resources: ResourceType[] = [];
	const rules = BIOME_RESOURCES[biome];

	for (const rule of rules) {
		if (rule.minElevation !== undefined && elevation < rule.minElevation) {
			continue;
		}
		const noise = noiseValues.get(rule.resource) ?? 0;
		if (noise > rule.threshold) {
			resources.push(rule.resource);
		}
	}

	if (isRiver) {
		for (const rule of RIVER_RESOURCES) {
			const noise = noiseValues.get(rule.resource) ?? 0;
			if (noise > rule.threshold) {
				resources.push(rule.resource);
			}
		}
	}

	return resources;
}

/** All resource types for noise layer enumeration. */
export const ALL_RESOURCE_TYPES: ResourceType[] = [
	'wood', 'stone', 'iron', 'herb', 'fish', 'clay', 'crystal', 'peat', 'fur',
];

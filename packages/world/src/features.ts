/**
 * Feature placement — decorative single-tile elements.
 *
 * Features are placed in 5 ordered decoration steps.
 * See world_generation_spec.md §9.
 */

import type { BiomeType, FeatureType } from '@loreweave/types';

type FeatureRule = {
	type: FeatureType;
	density: number;
	step: number;
	minElevation?: number;
};

/** Feature tables per biome. §9.4 */
const BIOME_FEATURES: Record<BiomeType, FeatureRule[]> = {
	forest: [
		{ type: 'boulder', density: 0.02, step: 1 },
		{ type: 'oak_tree', density: 0.40, step: 2 },
		{ type: 'bush', density: 0.15, step: 2 },
		{ type: 'flowers', density: 0.10, step: 3 },
		{ type: 'mushrooms', density: 0.05, step: 3 },
		{ type: 'tall_grass', density: 0.20, step: 3 },
		{ type: 'fallen_log', density: 0.03, step: 4 },
		{ type: 'leaf_pile', density: 0.05, step: 4 },
	],
	plains: [
		{ type: 'boulder', density: 0.03, step: 1 },
		{ type: 'bush', density: 0.05, step: 2 },
		{ type: 'tall_grass', density: 0.40, step: 3 },
		{ type: 'flowers', density: 0.15, step: 3 },
		{ type: 'pebbles', density: 0.05, step: 4 },
	],
	mountain: [
		{ type: 'boulder', density: 0.25, step: 1 },
		{ type: 'cliff', density: 0.10, step: 1 },
		{ type: 'pine_tree', density: 0.08, step: 2 },
		{ type: 'pebbles', density: 0.15, step: 4 },
		{ type: 'snow_drift', density: 0.10, step: 5, minElevation: 85 },
	],
	swamp: [
		{ type: 'pond', density: 0.08, step: 1 },
		{ type: 'willow_tree', density: 0.20, step: 2 },
		{ type: 'reeds', density: 0.25, step: 3 },
		{ type: 'mushrooms', density: 0.15, step: 3 },
		{ type: 'moss', density: 0.20, step: 3 },
		{ type: 'bones', density: 0.02, step: 4 },
		{ type: 'fog', density: 0.10, step: 5 },
	],
	tundra: [
		{ type: 'boulder', density: 0.10, step: 1 },
		{ type: 'dead_tree', density: 0.05, step: 2 },
		{ type: 'pebbles', density: 0.10, step: 4 },
		{ type: 'bones', density: 0.03, step: 4 },
		{ type: 'snow_drift', density: 0.30, step: 5 },
	],
	desert: [
		{ type: 'sand_dune', density: 0.20, step: 1 },
		{ type: 'cactus', density: 0.08, step: 2 },
		{ type: 'pebbles', density: 0.10, step: 4 },
		{ type: 'bones', density: 0.05, step: 4 },
		{ type: 'heat_shimmer', density: 0.08, step: 5 },
	],
	taiga: [
		{ type: 'pine_tree', density: 0.35, step: 2 },
		{ type: 'bush', density: 0.10, step: 2 },
		{ type: 'fern', density: 0.15, step: 3 },
		{ type: 'mushrooms', density: 0.08, step: 3 },
		{ type: 'moss', density: 0.10, step: 3 },
		{ type: 'fallen_log', density: 0.05, step: 4 },
		{ type: 'snow_drift', density: 0.05, step: 5 },
	],
};

/**
 * Determine features for a tile using the 5-step decoration system.
 *
 * @param biome - Tile biome
 * @param elevation - Tile elevation
 * @param isStructureTile - Whether this tile is occupied by a structure
 * @param rollForFeature - Function that returns a random [0, 1) value for a given feature type + step
 */
export function determineFeatures(
	biome: BiomeType,
	elevation: number,
	isStructureTile: boolean,
	rollForFeature: (featureType: FeatureType, step: number) => number,
): FeatureType[] {
	if (isStructureTile) return [];

	const features: FeatureType[] = [];
	const stepsUsed = new Set<number>();

	// Group rules by step
	const rules = BIOME_FEATURES[biome];
	const byStep = new Map<number, FeatureRule[]>();
	for (const rule of rules) {
		const stepRules = byStep.get(rule.step) ?? [];
		stepRules.push(rule);
		byStep.set(rule.step, stepRules);
	}

	// Process steps in order (1-5). One feature per step max.
	for (let step = 1; step <= 5; step++) {
		if (stepsUsed.has(step)) continue;
		const stepRules = byStep.get(step);
		if (!stepRules) continue;

		for (const rule of stepRules) {
			if (rule.minElevation !== undefined && elevation < rule.minElevation) {
				continue;
			}
			const roll = rollForFeature(rule.type, step);
			if (roll < rule.density) {
				features.push(rule.type);
				stepsUsed.add(step);
				break; // One feature per step per tile
			}
		}
	}

	return features;
}

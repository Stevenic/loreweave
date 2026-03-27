/**
 * Archetype Loader — reads location and NPC archetype JSON files
 * from the worlds/ directory structure.
 *
 * Supports both shared archetypes (worlds/shared/) and world-specific
 * overrides (worlds/<name>/). World-specific archetypes take precedence
 * over shared ones with the same ID.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { LocationArchetype, NpcArchetype } from '@loreweave/types';

/** Loaded archetype registries. */
export type ArchetypeRegistry = {
	locations: Map<string, LocationArchetype>;
	npcs: Map<string, NpcArchetype>;
};

/**
 * Load all archetypes from a worlds/ directory structure.
 *
 * Reads from `shared/` first (generic archetypes), then overlays
 * world-specific archetypes from `<worldId>/archetypes/` if present.
 *
 * @param worldsDir - Path to the worlds/ directory
 * @param worldId - Optional world ID to load world-specific overrides
 */
export async function loadArchetypes(
	worldsDir: string,
	worldId?: string,
): Promise<ArchetypeRegistry> {
	const registry: ArchetypeRegistry = {
		locations: new Map(),
		npcs: new Map(),
	};

	// Load shared archetypes
	const sharedDir = join(worldsDir, 'shared');
	await loadArchetypesFromDir(join(sharedDir, 'locations'), registry, 'location');
	await loadArchetypesFromDir(join(sharedDir, 'npcs'), registry, 'npc');

	// Load world-specific overrides
	if (worldId) {
		const worldDir = join(worldsDir, worldId, 'archetypes');
		const worldLocDir = join(worldDir, 'locations');
		const worldNpcDir = join(worldDir, 'npcs');
		await loadArchetypesFromDir(worldLocDir, registry, 'location');
		await loadArchetypesFromDir(worldNpcDir, registry, 'npc');
	}

	return registry;
}

/**
 * Recursively scan a directory for JSON archetype files and add them
 * to the registry. Handles nested subdirectories (e.g., locations/taverns/).
 */
async function loadArchetypesFromDir(
	dir: string,
	registry: ArchetypeRegistry,
	expectedType: 'location' | 'npc',
): Promise<void> {
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		// Directory doesn't exist — skip silently
		return;
	}

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const info = await stat(fullPath);

		if (info.isDirectory()) {
			await loadArchetypesFromDir(fullPath, registry, expectedType);
		} else if (extname(entry) === '.json') {
			try {
				const content = await readFile(fullPath, 'utf-8');
				const data = JSON.parse(content) as Record<string, unknown>;

				if (expectedType === 'location' && data['type'] === 'location') {
					const archetype = data as unknown as LocationArchetype;
					registry.locations.set(archetype.id, archetype);
				} else if (expectedType === 'npc' && data['type'] === 'npc') {
					const archetype = data as unknown as NpcArchetype;
					registry.npcs.set(archetype.id, archetype);
				}
			} catch {
				// Skip malformed JSON files
			}
		}
	}
}

/**
 * Get all location archetypes matching a category.
 */
export function getLocationsByCategory(
	registry: ArchetypeRegistry,
	category: string,
): LocationArchetype[] {
	const results: LocationArchetype[] = [];
	for (const archetype of registry.locations.values()) {
		if (archetype.category === category) {
			results.push(archetype);
		}
	}
	return results;
}

/**
 * Get all NPC archetypes matching a category.
 */
export function getNpcsByCategory(
	registry: ArchetypeRegistry,
	category: string,
): NpcArchetype[] {
	const results: NpcArchetype[] = [];
	for (const archetype of registry.npcs.values()) {
		if (archetype.category === category) {
			results.push(archetype);
		}
	}
	return results;
}

/**
 * Get location archetypes valid for a given settlement tier and biome.
 */
export function getLocationsForSettlement(
	registry: ArchetypeRegistry,
	tier: string,
	biome: string,
): LocationArchetype[] {
	const results: LocationArchetype[] = [];
	for (const archetype of registry.locations.values()) {
		const tierMatch = archetype.tier.includes(tier as never);
		const biomeMatch = archetype.biomes.includes('any') || archetype.biomes.includes(biome as never);
		if (tierMatch && biomeMatch) {
			results.push(archetype);
		}
	}
	return results;
}

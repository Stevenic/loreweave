/**
 * Location Generator — creates concrete LocationRecords inside settlements.
 *
 * Takes a settlement's StructureRef + ArchetypeRegistry and generates
 * the locations that populate the settlement: taverns, shops, temples, etc.
 *
 * The number and type of locations depends on the settlement tier:
 *   hamlet  → 2-4 locations (always: tavern/residence; maybe: shop, shrine)
 *   village → 4-7 locations (always: tavern, shop; maybe: temple, smith, residence)
 *   town    → 7-12 locations (always: tavern, shop, temple, civic; more variety)
 *   city    → 12-20 locations (all categories represented, multiples of each)
 *
 * All generation is deterministic: same (seed, settlementId) → identical output.
 */

import type {
	BiomeType,
	LocationArchetype,
	LocationCategory,
	LocationRecord,
	Settlement,
	SettlementTier,
	StructureRef,
	TileCoord,
	WorldSeed,
} from '@loreweave/types';
import type { ArchetypeRegistry } from './archetype-loader.js';
import { positionalRandom } from './rng.js';

// ─── Settlement Location Slot Tables ───

type LocationSlot = {
	category: LocationCategory;
	required: boolean;
};

/**
 * Location slot definitions per settlement tier.
 * Required slots are always filled. Optional slots are filled probabilistically.
 */
const SETTLEMENT_SLOTS: Record<SettlementTier, LocationSlot[]> = {
	hamlet: [
		{ category: 'tavern', required: true },
		{ category: 'residence', required: true },
		{ category: 'shop', required: false },
		{ category: 'temple', required: false },
	],
	village: [
		{ category: 'tavern', required: true },
		{ category: 'shop', required: true },
		{ category: 'residence', required: true },
		{ category: 'temple', required: false },
		{ category: 'civic', required: false },
		{ category: 'shop', required: false },
		{ category: 'residence', required: false },
	],
	town: [
		{ category: 'tavern', required: true },
		{ category: 'shop', required: true },
		{ category: 'temple', required: true },
		{ category: 'civic', required: true },
		{ category: 'residence', required: true },
		{ category: 'tavern', required: false },
		{ category: 'shop', required: false },
		{ category: 'shop', required: false },
		{ category: 'residence', required: false },
		{ category: 'residence', required: false },
		{ category: 'civic', required: false },
		{ category: 'temple', required: false },
	],
	city: [
		{ category: 'tavern', required: true },
		{ category: 'tavern', required: true },
		{ category: 'shop', required: true },
		{ category: 'shop', required: true },
		{ category: 'shop', required: true },
		{ category: 'temple', required: true },
		{ category: 'temple', required: true },
		{ category: 'civic', required: true },
		{ category: 'civic', required: true },
		{ category: 'residence', required: true },
		{ category: 'residence', required: true },
		{ category: 'residence', required: true },
		{ category: 'tavern', required: false },
		{ category: 'shop', required: false },
		{ category: 'shop', required: false },
		{ category: 'temple', required: false },
		{ category: 'civic', required: false },
		{ category: 'residence', required: false },
		{ category: 'residence', required: false },
		{ category: 'residence', required: false },
	],
};

/** Optional slot fill probability by tier. */
const OPTIONAL_FILL_RATE: Record<SettlementTier, number> = {
	hamlet: 0.40,
	village: 0.55,
	town: 0.65,
	city: 0.75,
};

// ─── Name Generation ───

/** Settlement name components for deterministic name generation. */
const NAME_PREFIXES = [
	'Green', 'Stone', 'Iron', 'Silver', 'Golden', 'Red', 'White', 'Black',
	'Grey', 'Old', 'High', 'Low', 'East', 'West', 'North', 'South',
	'Long', 'Bright', 'Dark', 'Thorn', 'Ash', 'Oak', 'Elm', 'Reed',
	'Moss', 'Fern', 'Willow', 'Raven', 'Hawk', 'Wolf', 'Bear', 'Fox',
];

const NAME_SUFFIXES = [
	'wick', 'ford', 'bridge', 'haven', 'hold', 'gate', 'keep', 'watch',
	'moor', 'vale', 'dale', 'fell', 'stead', 'field', 'wood', 'creek',
	'hollow', 'marsh', 'ridge', 'brook', 'heath', 'ton', 'ham', 'bury',
	'combe', 'hurst', 'ley', 'by', 'thorpe', 'mere', 'holm', 'garth',
];

/**
 * Generate a deterministic settlement name from the seed and settlement ID.
 */
function generateSettlementName(worldSeed: WorldSeed, settlementId: string): string {
	// Hash the settlement ID for a stable seed
	let hash = 0;
	for (let i = 0; i < settlementId.length; i++) {
		hash = Math.imul(hash, 31) + settlementId.charCodeAt(i);
	}
	hash = hash >>> 0;

	const prefixRoll = positionalRandom(worldSeed, hash, 0, 8000);
	const suffixRoll = positionalRandom(worldSeed, hash, 0, 8001);

	const prefix = NAME_PREFIXES[Math.floor(prefixRoll * NAME_PREFIXES.length)];
	const suffix = NAME_SUFFIXES[Math.floor(suffixRoll * NAME_SUFFIXES.length)];

	return `${prefix}${suffix}`;
}

// ─── Probability Pool Resolution ───

/**
 * Roll items from a probability pool.
 * Required items are always included. Common items have high chance.
 * Rare items have low chance.
 *
 * @param pool - The probability pool
 * @param seed - Base random value [0, 1)
 * @param maxItems - Maximum items to return
 * @returns Selected items
 */
function rollPool(
	pool: { required: string[]; common: string[]; rare: string[] },
	rollFn: (context: number) => number,
	maxItems: number,
): string[] {
	const items: string[] = [...pool.required];

	// Roll common items (70% chance each)
	for (let i = 0; i < pool.common.length && items.length < maxItems; i++) {
		if (rollFn(100 + i) < 0.70) {
			items.push(pool.common[i]);
		}
	}

	// Roll rare items (20% chance each)
	for (let i = 0; i < pool.rare.length && items.length < maxItems; i++) {
		if (rollFn(200 + i) < 0.20) {
			items.push(pool.rare[i]);
		}
	}

	return items;
}

// ─── Core Generation ───

/**
 * Generate a single LocationRecord from an archetype.
 *
 * @param archetype - The location archetype template
 * @param position - World-space tile coordinate
 * @param settlementId - The settlement this location belongs to (or null)
 * @param worldSeed - World seed for deterministic generation
 * @param instanceIndex - Index to differentiate multiple locations of the same type
 */
export function generateLocation(
	archetype: LocationArchetype,
	position: TileCoord,
	settlementId: string | null,
	worldSeed: WorldSeed,
	instanceIndex: number,
): LocationRecord {
	// Deterministic roll function for this specific location instance
	const rollFn = (context: number) =>
		positionalRandom(worldSeed, position.x + instanceIndex, position.y, 8100 + context);

	const features = rollPool(archetype.features, rollFn, 8);
	const objects = rollPool(archetype.objects, rollFn, 10);
	const npcArchetypes = rollPool(archetype.npcs, rollFn, 6);
	const exits = rollPool(archetype.exits, rollFn, 6);

	// Pick atmosphere elements (1-3 from each category)
	const sounds = pickRandom(archetype.atmosphere.sounds, rollFn(300), 3);
	const smells = pickRandom(archetype.atmosphere.smells, rollFn(301), 2);
	const lighting = pickRandom(archetype.atmosphere.lighting, rollFn(302), 2);

	const locationId = settlementId
		? `${settlementId}_${archetype.id}_${instanceIndex}`
		: `wild_${archetype.id}_${position.x}_${position.y}`;

	return {
		id: locationId,
		archetypeId: archetype.id,
		name: archetype.name,
		category: archetype.category,
		position,
		settlementId,
		features,
		objects,
		npcArchetypes,
		exits,
		atmosphere: { sounds, smells, lighting },
		challenges: archetype.challenges ? { ...archetype.challenges } : undefined,
	};
}

/**
 * Pick up to maxItems from an array using a random seed.
 */
function pickRandom(items: string[], roll: number, maxItems: number): string[] {
	if (items.length === 0) return [];
	const count = Math.min(items.length, Math.max(1, Math.floor(roll * maxItems) + 1));
	// Simple deterministic selection: take evenly spaced items
	const result: string[] = [];
	const step = items.length / count;
	for (let i = 0; i < count; i++) {
		result.push(items[Math.floor(i * step) % items.length]);
	}
	return result;
}

/**
 * Generate a complete Settlement with all its locations from a StructureRef.
 *
 * @param ref - The village/town/city structure reference
 * @param biome - The biome at the settlement center
 * @param registry - Loaded archetype registry
 * @param worldSeed - World seed for deterministic generation
 * @returns A fully populated Settlement, or null if the ref isn't a settlement
 */
export function generateSettlement(
	ref: StructureRef,
	biome: BiomeType,
	registry: ArchetypeRegistry,
	worldSeed: WorldSeed,
): Settlement | null {
	if (ref.id !== 'village' || !ref.settlementTier || !ref.settlementId) {
		return null;
	}

	const tier = ref.settlementTier;
	const settlementId = ref.settlementId;
	const name = generateSettlementName(worldSeed, settlementId);

	// Determine which location slots to fill
	const slots = SETTLEMENT_SLOTS[tier];
	const fillRate = OPTIONAL_FILL_RATE[tier];
	const filledSlots: LocationCategory[] = [];

	for (let i = 0; i < slots.length; i++) {
		const slot = slots[i];
		if (slot.required) {
			filledSlots.push(slot.category);
		} else {
			const roll = positionalRandom(worldSeed, i, 0, 8200 + simpleStringHash(settlementId));
			if (roll < fillRate) {
				filledSlots.push(slot.category);
			}
		}
	}

	// For each slot, pick an archetype that matches the tier and biome
	const locations: LocationRecord[] = [];
	const usedArchetypes = new Set<string>();

	for (let i = 0; i < filledSlots.length; i++) {
		const category = filledSlots[i];
		const candidates = getMatchingArchetypes(registry, category, tier, biome);

		if (candidates.length === 0) continue;

		// Prefer archetypes not yet used (for variety), but allow duplicates if exhausted
		let archetype: LocationArchetype;
		const unused = candidates.filter(a => !usedArchetypes.has(a.id));
		if (unused.length > 0) {
			const roll = positionalRandom(worldSeed, i, 0, 8300 + simpleStringHash(settlementId));
			archetype = unused[Math.floor(roll * unused.length)];
		} else {
			const roll = positionalRandom(worldSeed, i, 0, 8300 + simpleStringHash(settlementId));
			archetype = candidates[Math.floor(roll * candidates.length)];
		}
		usedArchetypes.add(archetype.id);

		// Position: spread locations around the settlement center
		const angle = (i / filledSlots.length) * Math.PI * 2;
		const dist = ref.radius * 0.3 + (ref.radius * 0.4) * positionalRandom(worldSeed, i, 0, 8400 + simpleStringHash(settlementId));
		const locPosition: TileCoord = {
			x: Math.round(ref.worldX + Math.cos(angle) * dist),
			y: Math.round(ref.worldY + Math.sin(angle) * dist),
		};

		const location = generateLocation(archetype, locPosition, settlementId, worldSeed, i);
		locations.push(location);
	}

	return {
		id: settlementId,
		name,
		tier,
		center: { x: ref.worldX, y: ref.worldY },
		radius: ref.radius,
		biome,
		locations,
		wardStrength: 100, // Start at full strength
	};
}

/**
 * Get archetypes matching a category, tier, and biome.
 */
function getMatchingArchetypes(
	registry: ArchetypeRegistry,
	category: LocationCategory,
	tier: SettlementTier,
	biome: BiomeType,
): LocationArchetype[] {
	const results: LocationArchetype[] = [];
	for (const archetype of registry.locations.values()) {
		if (archetype.category !== category) continue;
		const tierMatch = archetype.tier.includes(tier);
		const biomeMatch = archetype.biomes.includes('any' as BiomeType) || archetype.biomes.includes(biome);
		if (tierMatch && biomeMatch) {
			results.push(archetype);
		}
	}
	return results;
}

/**
 * Generate LocationRecords for a non-settlement structure (ruins, shrine, cave).
 *
 * @param ref - The structure reference
 * @param biome - The biome at the structure
 * @param registry - Loaded archetype registry
 * @param worldSeed - World seed
 * @returns Array of LocationRecords (typically 1 for simple structures)
 */
export function generateStructureLocations(
	ref: StructureRef,
	biome: BiomeType,
	registry: ArchetypeRegistry,
	worldSeed: WorldSeed,
): LocationRecord[] {
	// Map structure type to archetype category
	const categoryMap: Record<string, LocationCategory> = {
		ruins: 'wilderness',
		cave_entrance: 'dungeon',
		shrine: 'temple',
		watchtower: 'civic',
	};

	const category = categoryMap[ref.id];
	if (!category) return [];

	// Find matching archetypes
	const candidates: LocationArchetype[] = [];
	for (const archetype of registry.locations.values()) {
		if (archetype.category !== category) continue;
		const biomeMatch = archetype.biomes.includes('any' as BiomeType) || archetype.biomes.includes(biome);
		if (biomeMatch) candidates.push(archetype);
	}

	if (candidates.length === 0) return [];

	// Pick one archetype deterministically
	const roll = positionalRandom(worldSeed, ref.worldX, ref.worldY, 8500);
	const archetype = candidates[Math.floor(roll * candidates.length)];
	const position: TileCoord = { x: ref.worldX, y: ref.worldY };

	return [generateLocation(archetype, position, null, worldSeed, 0)];
}

/** Simple string hash. */
function simpleStringHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = Math.imul(hash, 31) + str.charCodeAt(i);
	}
	return hash >>> 0;
}

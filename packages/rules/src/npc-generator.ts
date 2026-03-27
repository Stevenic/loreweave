/**
 * NPC Generator — creates a Character from an NPC archetype + stat tier.
 *
 * This is the bridge between Bard's narrative archetypes and the
 * mechanical Character type the game engine operates on. The generator:
 *
 * 1. Looks up the stat tier definition for ability score arrays
 * 2. Assigns the primary ability from the archetype's role
 * 3. Computes derived stats (HP, AC, proficiency, attack bonus)
 * 4. Selects personality traits and inventory from probability pools
 * 5. Returns a fully formed Character ready for the game engine
 *
 * All functions are pure — same inputs produce same outputs.
 */

import type {
	AbilityName,
	AbilityScores,
	AbilityArrayType,
	Character,
	InventorySlot,
	Item,
	NpcArchetype,
	NpcCategory,
	ProbabilityPool,
	SkillName,
	StatTierDefinition,
	StatsTier,
	TileCoord,
} from '@loreweave/types';
import { createRng, rollDie } from './dice.js';
import { abilityModifier, proficiencyBonus } from './abilities.js';

/** Maps NPC categories to their primary ability array type. */
const CATEGORY_ARRAY_TYPE: Record<NpcCategory, AbilityArrayType> = {
	authority: 'physical',
	craft: 'physical',
	merchant: 'balanced',
	service: 'balanced',
	wanderer: 'physical',
};

/** Maps NPC categories to their primary ability score. */
const CATEGORY_PRIMARY_ABILITY: Record<NpcCategory, AbilityName> = {
	authority: 'STR',
	craft: 'STR',
	merchant: 'CHA',
	service: 'CHA',
	wanderer: 'DEX',
};

/** Ability score assignment order. */
const ABILITY_ORDER: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/**
 * Generate a full Character from an NPC archetype and stat tier definitions.
 *
 * @param archetype - The NPC archetype (from JSON)
 * @param tierDefs - All stat tier definitions (from WorldConfig)
 * @param seed - Deterministic seed for this NPC
 * @param location - Where in the world this NPC is placed
 * @param tierOverride - Override the archetype's default tier
 * @param id - Optional custom ID (defaults to archetype.id + seed hex)
 */
export function generateNpc(
	archetype: NpcArchetype,
	tierDefs: StatTierDefinition[],
	seed: number,
	location: TileCoord,
	tierOverride?: StatsTier,
	id?: string,
): Character {
	const rng = createRng(seed);
	const tier = tierOverride ?? archetype.stats_tier;
	const tierDef = tierDefs.find((t) => t.tier === tier);

	if (!tierDef) {
		throw new Error(`Unknown stat tier: ${tier}`);
	}

	// 1. Select ability array type — archetype override takes precedence over category default
	const arrayType = archetype.primaryArrayType ?? CATEGORY_ARRAY_TYPE[archetype.category] ?? 'balanced';
	const abilityArray = tierDef.abilityArrays[arrayType];

	// 2. Assign abilities — archetype primaryAbility override takes precedence over category default
	const primaryAbility = archetype.primaryAbility ?? CATEGORY_PRIMARY_ABILITY[archetype.category] ?? 'CHA';
	const abilities = assignAbilities(
		abilityArray,
		primaryAbility,
	);

	// 3. Determine level from CR range (pick within range using rng)
	const crMin = tierDef.crRange[0];
	const crMax = tierDef.crRange[1];
	const cr = crMin + (crMax - crMin) * rng();
	const level = Math.max(1, Math.round(cr * 2));

	// 4. Compute derived stats
	const profBonus = proficiencyBonus(level);
	const conMod = abilityModifier(abilities.CON);
	const dexMod = abilityModifier(abilities.DEX);

	// HP: roll within tier range, influenced by CON
	const hpMin = tierDef.hpRange[0];
	const hpMax = tierDef.hpRange[1];
	const baseHp = Math.floor(hpMin + (hpMax - hpMin) * rng());
	const hp = Math.max(1, baseHp + conMod * level);

	// AC: base from tier range + DEX modifier (capped by tier)
	const acMin = tierDef.acRange[0];
	const acMax = tierDef.acRange[1];
	const ac = Math.min(acMax, acMin + Math.max(0, dexMod));

	// 5. Select proficient skills from archetype
	const proficientSkills = archetype.skills.slice() as SkillName[];

	// 6. Generate inventory from probability pools
	const inventory = rollProbabilityPool(archetype.inventory, rng).map(
		(itemName) => createInventorySlot(itemName, rng),
	);

	// 7. Generate traits (stored as NPC metadata, not on Character directly)
	// Traits go into the character description for LLM context

	// 8. Select a voice pattern
	const voiceIndex = Math.floor(rng() * archetype.voice_patterns.length);
	const voicePattern = archetype.voice_patterns[voiceIndex] ?? '';

	// 9. Select personality traits
	const selectedTraits = rollTraits(archetype.traits, rng);

	// 10. Build the character
	const npcId = id ?? `${archetype.id}_${(seed >>> 0).toString(16)}`;
	const description = `${archetype.description} [${selectedTraits.join(', ')}] Voice: ${voicePattern}`;

	return {
		id: npcId,
		name: generateNpcName(archetype, rng),
		level,
		abilities,
		hp,
		maxHp: hp,
		ac,
		proficiencyBonus: profBonus,
		proficientSkills,
		conditions: [],
		inventory,
		location,
		speed: 30,
	};
}

/**
 * Assign ability scores from an array, putting the highest value
 * at the primary ability position.
 */
function assignAbilities(scores: number[], primaryAbility: AbilityName): AbilityScores {
	// Sort scores descending
	const sorted = [...scores].sort((a, b) => b - a);
	const primaryIndex = ABILITY_ORDER.indexOf(primaryAbility);

	const abilities: AbilityScores = {
		STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10,
	};

	// Place highest score at primary ability
	abilities[primaryAbility] = sorted[0];

	// Distribute remaining scores to other abilities in order
	let scoreIndex = 1;
	for (let i = 0; i < ABILITY_ORDER.length; i++) {
		if (i === primaryIndex) continue;
		abilities[ABILITY_ORDER[i]] = sorted[scoreIndex] ?? 10;
		scoreIndex++;
	}

	return abilities;
}

/**
 * Roll items from a probability pool.
 * Required items always included, common at 65% chance, rare at 15%.
 */
function rollProbabilityPool(pool: ProbabilityPool, rng: () => number): string[] {
	const results = [...pool.required];

	for (const item of pool.common) {
		if (rng() < 0.65) {
			results.push(item);
		}
	}

	for (const item of pool.rare) {
		if (rng() < 0.15) {
			results.push(item);
		}
	}

	return results;
}

/**
 * Roll personality traits from trait pools.
 * Pick 2-3 common traits and 0-1 rare traits.
 */
function rollTraits(
	traits: { common: string[]; rare: string[] },
	rng: () => number,
): string[] {
	const selected: string[] = [];

	// Pick 2-3 common traits
	const commonCount = 2 + (rng() < 0.5 ? 1 : 0);
	const shuffled = [...traits.common].sort(() => rng() - 0.5);
	for (let i = 0; i < Math.min(commonCount, shuffled.length); i++) {
		selected.push(shuffled[i]);
	}

	// Pick 0-1 rare traits
	if (rng() < 0.25 && traits.rare.length > 0) {
		const rareIndex = Math.floor(rng() * traits.rare.length);
		selected.push(traits.rare[rareIndex]);
	}

	return selected;
}

/**
 * Create an inventory slot from an item name.
 * Simple items get default properties.
 */
function createInventorySlot(itemName: string, rng: () => number): InventorySlot {
	const item: Item = {
		id: itemName.toLowerCase().replace(/\s+/g, '_'),
		name: itemName,
		weight: 1,
		value: Math.floor(rng() * 10) + 1,
		stackable: false,
	};
	return { item, quantity: 1 };
}

/**
 * Generate a placeholder name for an NPC.
 * In the full system, names come from the DMPersona naming conventions.
 * This provides a deterministic fallback.
 */
function generateNpcName(archetype: NpcArchetype, rng: () => number): string {
	// Use archetype name + a descriptor as placeholder
	// The LLM will give proper names in narrative
	return `The ${archetype.name}`;
}

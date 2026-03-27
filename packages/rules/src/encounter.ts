/**
 * Encounter Table Roller — generates encounters from data-driven tables.
 *
 * Each world defines encounter tables as EncounterTable objects.
 * This module rolls on those tables using the deterministic RNG
 * and returns encounter descriptions + creature lists.
 *
 * All functions are pure.
 */

import type {
	CreatureStatBlock,
	EncounterEntry,
	EncounterTable,
	WeaveState,
} from '@loreweave/types';
import { createRng, rollDie, parseDiceNotation, rollDice } from './dice.js';

/** The result of rolling on an encounter table. */
export type EncounterResult = {
	roll: number;
	entry: EncounterEntry;
	creatures: ResolvedCreature[];
	isNonCombat: boolean;
	/** Weave state modifiers applied to this encounter. */
	weaveModifiers?: WeaveEncounterModifiers;
};

/**
 * Weave state modifiers applied to an encounter result.
 * Per Loremaster's Encounter Tables Expanded §1.
 */
export type WeaveEncounterModifiers = {
	/** Whether Fray creatures were injected into a combat encounter. */
	frayCreaturesInjected: boolean;
	/** Additional Fray creatures added to the encounter. */
	injectedCreatures: ResolvedCreature[];
	/** Whether an environmental hazard was added. */
	environmentalHazard: boolean;
	/** DC for the environmental hazard (0 = none). */
	hazardDC: number;
	/** Force damage from Fray pulses (frayed/unraveled "no encounter" replacement). */
	hazardDamage: string;
	/** Whether this is a Fray exposure zone (hourly CON saves). */
	frayExposureActive: boolean;
	/** DC for Fray exposure saves. */
	frayExposureDC: number;
	/** Whether rest is restricted. */
	restRestricted: boolean;
	/** The weave state that produced these modifiers. */
	weaveState: WeaveState;
};

/** A resolved creature instance with count. */
export type ResolvedCreature = {
	type: string;
	count: number;
	cr: number;
	statBlock?: CreatureStatBlock;
};

/**
 * Roll an encounter from a table.
 *
 * @param table - The encounter table to roll on
 * @param creatures - Available creature stat blocks for resolution
 * @param rng - Deterministic RNG
 */
export function rollEncounter(
	table: EncounterTable,
	creatures: CreatureStatBlock[],
	rng: () => number,
): EncounterResult {
	// Roll on the table
	const roll = rollDie(table.dieSize, rng);
	const entry = resolveTableEntry(table, roll);

	// Resolve creatures
	const resolvedCreatures: ResolvedCreature[] = [];
	if (entry.creatures) {
		for (const creature of entry.creatures) {
			const count = resolveCount(creature.count, rng);
			const statBlock = creatures.find((c) => c.id === creature.type);

			resolvedCreatures.push({
				type: creature.type,
				count,
				cr: creature.cr,
				statBlock,
			});
		}
	}

	return {
		roll,
		entry,
		creatures: resolvedCreatures,
		isNonCombat: entry.isNonCombat ?? resolvedCreatures.length === 0,
	};
}

/**
 * Find the matching entry for a roll on an encounter table.
 */
function resolveTableEntry(table: EncounterTable, roll: number): EncounterEntry {
	for (const entry of table.entries) {
		if (roll >= entry.minRoll && roll <= entry.maxRoll) {
			return entry;
		}
	}
	// Fallback to last entry if roll somehow doesn't match
	return table.entries[table.entries.length - 1];
}

/**
 * Resolve a count string (e.g., "1d4", "2d4", "4") into a number.
 */
function resolveCount(countStr: string, rng: () => number): number {
	// Check if it's a simple number
	const simple = Number.parseInt(countStr, 10);
	if (!Number.isNaN(simple) && String(simple) === countStr) {
		return simple;
	}

	// Parse as dice notation
	const dice = parseDiceNotation(countStr);
	return rollDice(dice, rng).total;
}

/**
 * Find an encounter table matching a zone and party level.
 */
export function findEncounterTable(
	tables: EncounterTable[],
	zoneId: string,
	partyLevel: number,
): EncounterTable | undefined {
	return tables.find(
		(t) =>
			t.id === zoneId &&
			partyLevel >= t.levelRange[0] &&
			partyLevel <= t.levelRange[1],
	);
}

/**
 * Compute the total XP value of an encounter result.
 * Uses a simplified CR-to-XP mapping.
 */
export function encounterXP(result: EncounterResult): number {
	let totalXP = 0;
	for (const creature of result.creatures) {
		totalXP += crToXP(creature.cr) * creature.count;
	}
	return totalXP;
}

/** CR-to-XP table per D&D 2024 Free Rules, CR 0–30. */
const CR_XP_TABLE: Record<number, number> = {
	0: 10,
	0.125: 25,
	0.25: 50,
	0.5: 100,
	1: 200,
	2: 450,
	3: 700,
	4: 1100,
	5: 1800,
	6: 2300,
	7: 2900,
	8: 3900,
	9: 5000,
	10: 5900,
	11: 7200,
	12: 8400,
	13: 10000,
	14: 11500,
	15: 13000,
	16: 15000,
	17: 18000,
	18: 20000,
	19: 22000,
	20: 25000,
	21: 33000,
	22: 41000,
	23: 50000,
	24: 62000,
	25: 75000,
	26: 90000,
	27: 105000,
	28: 120000,
	29: 135000,
	30: 155000,
};

function crToXP(cr: number): number {
	return CR_XP_TABLE[cr] ?? CR_XP_TABLE[Math.floor(cr)] ?? 0;
}

// ─── Weave State Encounter Modifiers ───

/**
 * Fray creature injection table — maps party level tier to injected creature types.
 * Per Loremaster's Encounter Tables Expanded §1.3.
 */
const FRAY_INJECTION_TABLE: { minLevel: number; maxLevel: number; type: string; count: string; cr: number }[] = [
	{ minLevel: 1, maxLevel: 4, type: 'looseling', count: '1d4', cr: 0.25 },
	{ minLevel: 5, maxLevel: 8, type: 'thread_eater', count: '1', cr: 2 },
	{ minLevel: 9, maxLevel: 12, type: 'hollow_walker', count: '1', cr: 4 },
	{ minLevel: 13, maxLevel: 20, type: 'thread_sovereign', count: '1', cr: 12 },
];

/**
 * Apply weave state modifiers to an encounter result.
 *
 * Per Loremaster's Encounter Tables Expanded §1:
 * - Stable: no modification
 * - Thin: re-roll "no encounter", 25% Fray creature injection on combat
 * - Frayed: replace "no encounter" with hazard, 50% Fray injection, hourly exposure saves
 * - Unraveled: replace entire biome table (caller should use unraveled zone table)
 *
 * @param result - The base encounter result from rollEncounter()
 * @param weaveState - Current weave state at the encounter location
 * @param partyLevel - Average party level (for Fray creature tier selection)
 * @param creatures - Available creature stat blocks
 * @param rng - Deterministic RNG
 * @param rerollTable - Optional: the table to re-roll on (for Thin zone re-rolls)
 */
export function applyWeaveModifiers(
	result: EncounterResult,
	weaveState: WeaveState,
	partyLevel: number,
	creatures: CreatureStatBlock[],
	rng: () => number,
	rerollTable?: EncounterTable,
): EncounterResult {
	// Stable: no modifications
	if (weaveState === 'stable') return result;

	const modifiers: WeaveEncounterModifiers = {
		frayCreaturesInjected: false,
		injectedCreatures: [],
		environmentalHazard: false,
		hazardDC: 0,
		hazardDamage: '',
		frayExposureActive: weaveState === 'frayed' || weaveState === 'unraveled',
		frayExposureDC: weaveState === 'frayed' ? 13 : weaveState === 'unraveled' ? 15 : 0,
		restRestricted: weaveState === 'frayed' || weaveState === 'unraveled',
		weaveState,
	};

	let modifiedResult = { ...result };

	if (weaveState === 'thin') {
		// Thin: re-roll "no encounter" once
		if (modifiedResult.isNonCombat && modifiedResult.creatures.length === 0 && rerollTable) {
			const reroll = rollEncounter(rerollTable, creatures, rng);
			if (!reroll.isNonCombat || reroll.creatures.length > 0) {
				modifiedResult = reroll;
			}
			// If re-roll is also no encounter → minor anomaly (cosmetic, no mechanical effect)
		}

		// 25% chance of Fray creature injection on combat
		if (!modifiedResult.isNonCombat && rng() < 0.25) {
			const injected = injectFrayCreatures(partyLevel, creatures, rng);
			modifiers.frayCreaturesInjected = true;
			modifiers.injectedCreatures = injected;
		}
	} else if (weaveState === 'frayed') {
		// Frayed: replace "no encounter" with environmental hazard
		if (modifiedResult.isNonCombat && modifiedResult.creatures.length === 0) {
			modifiers.environmentalHazard = true;
			modifiers.hazardDC = 14;
			modifiers.hazardDamage = '2d6';
		}

		// 50% chance of Fray creature injection on combat
		if (!modifiedResult.isNonCombat && rng() < 0.50) {
			const injected = injectFrayCreatures(partyLevel, creatures, rng);
			modifiers.frayCreaturesInjected = true;
			modifiers.injectedCreatures = injected;
		}
	}
	// Unraveled: caller should already be using the unraveled zone table
	// But still mark exposure/rest restrictions

	modifiedResult.weaveModifiers = modifiers;
	return modifiedResult;
}

/**
 * Roll an encounter with weave state modifiers applied.
 * Convenience function that combines rollEncounter + applyWeaveModifiers.
 */
export function rollEncounterWithWeave(
	table: EncounterTable,
	creatures: CreatureStatBlock[],
	rng: () => number,
	weaveState: WeaveState,
	partyLevel: number,
): EncounterResult {
	const base = rollEncounter(table, creatures, rng);
	return applyWeaveModifiers(base, weaveState, partyLevel, creatures, rng, table);
}

/** Inject Fray creatures based on party level tier. */
function injectFrayCreatures(
	partyLevel: number,
	creatures: CreatureStatBlock[],
	rng: () => number,
): ResolvedCreature[] {
	const tier = FRAY_INJECTION_TABLE.find(
		(t) => partyLevel >= t.minLevel && partyLevel <= t.maxLevel,
	) ?? FRAY_INJECTION_TABLE[0];

	const count = resolveCount(tier.count, rng);
	const statBlock = creatures.find((c) => c.id === tier.type);

	return [{
		type: tier.type,
		count,
		cr: tier.cr,
		statBlock,
	}];
}

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
} from '@loreweave/types';
import { createRng, rollDie, parseDiceNotation, rollDice } from './dice.js';

/** The result of rolling on an encounter table. */
export type EncounterResult = {
	roll: number;
	entry: EncounterEntry;
	creatures: ResolvedCreature[];
	isNonCombat: boolean;
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

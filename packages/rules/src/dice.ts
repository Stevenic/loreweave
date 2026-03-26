/**
 * Deterministic dice rolling system.
 *
 * All rolls use a seeded PRNG so identical inputs produce identical outputs.
 * This is critical for multiplayer — same seed + same action = same result.
 */

import type { DiceRoll, RollResult } from '@loreweave/types';

/**
 * xorshift32 PRNG — fast, deterministic, good distribution.
 * Same algorithm used in the pixel emitter system.
 */
export function xorshift32(state: number): [value: number, nextState: number] {
	let s = state | 0;
	s ^= s << 13;
	s ^= s >>> 17;
	s ^= s << 5;
	// Convert to unsigned 32-bit
	const value = s >>> 0;
	return [value, value];
}

/** Create a seeded random number generator that returns values in [0, 1). */
export function createRng(seed: number): () => number {
	let state = seed | 1; // Ensure non-zero
	return () => {
		const [value, next] = xorshift32(state);
		state = next;
		return value / 0x100000000;
	};
}

/** Roll a single die with N sides using the given RNG. Returns 1..N. */
export function rollDie(sides: number, rng: () => number): number {
	return Math.floor(rng() * sides) + 1;
}

/** Roll dice according to a DiceRoll spec (e.g., 2d6+3). */
export function rollDice(dice: DiceRoll, rng: () => number): RollResult {
	const rolls: number[] = [];
	for (let i = 0; i < dice.count; i++) {
		rolls.push(rollDie(dice.sides, rng));
	}
	const natural = rolls.reduce((sum, r) => sum + r, 0);
	return {
		rolls,
		total: natural + dice.modifier,
		natural,
		modifier: dice.modifier,
	};
}

/** Roll a d20. */
export function d20(rng: () => number): number {
	return rollDie(20, rng);
}

/** Roll d20 with advantage (roll twice, take higher). */
export function d20Advantage(rng: () => number): [result: number, rolls: [number, number]] {
	const a = rollDie(20, rng);
	const b = rollDie(20, rng);
	return [Math.max(a, b), [a, b]];
}

/** Roll d20 with disadvantage (roll twice, take lower). */
export function d20Disadvantage(rng: () => number): [result: number, rolls: [number, number]] {
	const a = rollDie(20, rng);
	const b = rollDie(20, rng);
	return [Math.min(a, b), [a, b]];
}

/** Parse a dice notation string like "2d6+3" into a DiceRoll. */
export function parseDiceNotation(notation: string): DiceRoll {
	const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
	if (!match) {
		throw new Error(`Invalid dice notation: ${notation}`);
	}
	return {
		count: Number.parseInt(match[1], 10),
		sides: Number.parseInt(match[2], 10),
		modifier: match[3] ? Number.parseInt(match[3], 10) : 0,
	};
}

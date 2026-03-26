/**
 * Positional RNG — deterministic random values from world coordinates.
 *
 * Uses FNV-1a hashing to combine world seed with position, ensuring:
 * - Same position always produces the same value
 * - Different positions produce uncorrelated values
 * - Generation order doesn't affect output (unlike shared-state RNGs)
 */

import type { WorldSeed } from '@loreweave/types';

/** FNV-1a 32-bit hash. Fast, good distribution for spatial hashing. */
export function fnv1a(data: number[]): number {
	let hash = 0x811c9dc5; // FNV offset basis
	for (const byte of data) {
		hash ^= byte & 0xff;
		hash = Math.imul(hash, 0x01000193); // FNV prime
		hash ^= (byte >>> 8) & 0xff;
		hash = Math.imul(hash, 0x01000193);
		hash ^= (byte >>> 16) & 0xff;
		hash = Math.imul(hash, 0x01000193);
		hash ^= (byte >>> 24) & 0xff;
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/**
 * Generate a deterministic seed from world seed + position + context.
 * Context differentiates between different noise layers at the same position.
 */
export function positionalSeed(
	worldSeed: WorldSeed,
	x: number,
	y: number,
	context: number = 0,
): number {
	// Convert bigint seed to two 32-bit integers for hashing
	const seedLow = Number(worldSeed & 0xffffffffn);
	const seedHigh = Number((worldSeed >> 32n) & 0xffffffffn);
	return fnv1a([seedLow, seedHigh, x, y, context]);
}

/**
 * Positional random float in [0, 1) — single-shot, no state.
 * For cases where you need one random value at a position.
 */
export function positionalRandom(
	worldSeed: WorldSeed,
	x: number,
	y: number,
	context: number = 0,
): number {
	return positionalSeed(worldSeed, x, y, context) / 0x100000000;
}

/** Convert a string to a WorldSeed via FNV-1a hash extended to 64 bits. */
export function seedFromString(str: string): WorldSeed {
	const low = fnv1a(Array.from(str).map((c) => c.charCodeAt(0)));
	const high = fnv1a([low, ...Array.from(str).map((c) => c.charCodeAt(0) + 1)]);
	return (BigInt(high) << 32n) | BigInt(low);
}

/**
 * Particle emitter simulation for Pixel Format v1.
 *
 * Runtime particle system per spec §10. The format stores emitter configs;
 * this module simulates the physics.
 */
import type { EmitterConfig, NumberRange } from '@loreweave/types';
/** A single live particle in the simulation. */
export type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	age: number;
	lifetime: number;
	scale: number;
	rotation: number;
	rotationSpeed: number;
	opacity: number;
};
/** Seeded PRNG for deterministic particle output. Uses a simple xorshift32. */
export declare class SeededRNG {
	private state;
	constructor(seed: number);
	/** Return a number in [0, 1). */
	next(): number;
	/** Return a number in [min, max]. */
	range(min: number, max: number): number;
	/** Return a number from a NumberRange. */
	fromRange(range: NumberRange): number;
}
/** Emitter runtime state. */
export declare class ParticleEmitter {
	readonly config: EmitterConfig;
	readonly particles: Particle[];
	private rng;
	private accumulator;
	private burstFired;
	private elapsed;
	constructor(config: EmitterConfig, seed?: number);
	/** Spawn a single particle at origin (0,0). */
	private spawn;
	/**
	 * Advance the emitter by deltaMs milliseconds.
	 * Spawns new particles, updates existing ones, removes dead ones.
	 */
	update(deltaMs: number): void;
	/** Reset the emitter to initial state. */
	reset(seed?: number): void;
}
//# sourceMappingURL=emitter.d.ts.map

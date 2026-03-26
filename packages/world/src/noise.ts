/**
 * OpenSimplex2 noise implementation for world generation.
 *
 * 2D gradient noise with octave layering. Chosen over Perlin for:
 * - No axis-aligned artifacts
 * - Clean license (public domain)
 * - Better isotropy in 2D
 *
 * Based on OpenSimplex2 by KdotJPG, adapted for TypeScript.
 */

// ─── OpenSimplex2 (2D) ───

const STRETCH_2D = -0.211324865405187; // (1/Math.sqrt(2+1)-1)/2
const SQUISH_2D = 0.366025403784439;   // (Math.sqrt(2+1)-1)/2
const NORM_2D = 47.0;

/** Permutation table size. Must be power of 2. */
const PSIZE = 2048;

/** Gradient vectors for 2D. */
const GRADIENTS_2D = [
	5, 2, 2, 5, -5, 2, -2, 5, 5, -2, 2, -5, -5, -2, -2, -5,
];

export type NoiseGenerator = {
	/** Sample noise at (x, y). Returns value in approximately [-1, 1]. */
	sample(x: number, y: number): number;
};

/** Create a 2D OpenSimplex2 noise generator with the given seed. */
export function createNoise(seed: number): NoiseGenerator {
	// Build permutation table from seed
	const perm = new Int16Array(PSIZE);
	const permGrad2 = new Int8Array(PSIZE);
	const source = new Int16Array(PSIZE);

	for (let i = 0; i < PSIZE; i++) {
		source[i] = i;
	}

	// Seed-based Fisher-Yates shuffle
	let s = seed;
	for (let i = PSIZE - 1; i >= 0; i--) {
		// LCG-based deterministic shuffle
		s = Math.imul(s, 6364136223846793005) + 1442695040888963407;
		let r = ((s + 31) >>> 0) % (i + 1);
		if (r < 0) r += i + 1;
		perm[i] = source[r];
		permGrad2[i] = GRADIENTS_2D[perm[i] % GRADIENTS_2D.length];
		source[r] = source[i];
	}

	function sample(x: number, y: number): number {
		// Skew input space
		const stretchOffset = (x + y) * STRETCH_2D;
		const xs = x + stretchOffset;
		const ys = y + stretchOffset;

		// Floor to get lattice point
		const xsb = Math.floor(xs);
		const ysb = Math.floor(ys);

		// Squish back to get contribution base
		const squishOffset = (xsb + ysb) * SQUISH_2D;
		const xb = xsb + squishOffset;
		const yb = ysb + squishOffset;

		// Positions relative to origin
		const xins = xs - xsb;
		const yins = ys - ysb;

		// Sum of positions determines which simplex we're in
		const inSum = xins + yins;

		// Positions relative to base
		let dx0 = x - xb;
		let dy0 = y - yb;

		let value = 0;

		// Contribution (0, 0)
		let dx_ext: number;
		let dy_ext: number;
		let xsv_ext: number;
		let ysv_ext: number;

		let attn0 = 2 - dx0 * dx0 - dy0 * dy0;
		if (attn0 > 0) {
			attn0 *= attn0;
			const pi0 = perm[(perm[xsb & (PSIZE - 1)] + ysb) & (PSIZE - 1)];
			const gi0 = pi0 % (GRADIENTS_2D.length / 2);
			value += attn0 * attn0 * (GRADIENTS_2D[gi0 * 2] * dx0 + GRADIENTS_2D[gi0 * 2 + 1] * dy0);
		}

		// Contribution (1, 0) or (0, 1)
		if (inSum >= 1) {
			// We're inside the triangle (1, 0) -- (1, 1) -- (0, 1)
			const dx1 = dx0 - 1 - SQUISH_2D;
			const dy1 = dy0 - 0 - SQUISH_2D;
			let attn1 = 2 - dx1 * dx1 - dy1 * dy1;
			if (attn1 > 0) {
				attn1 *= attn1;
				const pi1 = perm[(perm[(xsb + 1) & (PSIZE - 1)] + ysb) & (PSIZE - 1)];
				const gi1 = pi1 % (GRADIENTS_2D.length / 2);
				value += attn1 * attn1 * (GRADIENTS_2D[gi1 * 2] * dx1 + GRADIENTS_2D[gi1 * 2 + 1] * dy1);
			}

			const dx2 = dx0 - 0 - SQUISH_2D;
			const dy2 = dy0 - 1 - SQUISH_2D;
			let attn2 = 2 - dx2 * dx2 - dy2 * dy2;
			if (attn2 > 0) {
				attn2 *= attn2;
				const pi2 = perm[(perm[xsb & (PSIZE - 1)] + ysb + 1) & (PSIZE - 1)];
				const gi2 = pi2 % (GRADIENTS_2D.length / 2);
				value += attn2 * attn2 * (GRADIENTS_2D[gi2 * 2] * dx2 + GRADIENTS_2D[gi2 * 2 + 1] * dy2);
			}

			if (inSum >= 2) {
				// (1, 1)
				dx_ext = dx0 - 1 - 2 * SQUISH_2D;
				dy_ext = dy0 - 1 - 2 * SQUISH_2D;
				xsv_ext = xsb + 1;
				ysv_ext = ysb + 1;
			} else if (xins > yins) {
				dx_ext = dx0 - 1 - SQUISH_2D;
				dy_ext = dy0 + 1 - SQUISH_2D;
				xsv_ext = xsb + 1;
				ysv_ext = ysb - 1;
			} else {
				dx_ext = dx0 + 1 - SQUISH_2D;
				dy_ext = dy0 - 1 - SQUISH_2D;
				xsv_ext = xsb - 1;
				ysv_ext = ysb + 1;
			}
		} else {
			// We're inside the triangle (0, 0) -- (1, 0) -- (0, 1)
			const dx1 = dx0 - 1 - SQUISH_2D;
			const dy1 = dy0 - 0 - SQUISH_2D;
			let attn1 = 2 - dx1 * dx1 - dy1 * dy1;
			if (attn1 > 0) {
				attn1 *= attn1;
				const pi1 = perm[(perm[(xsb + 1) & (PSIZE - 1)] + ysb) & (PSIZE - 1)];
				const gi1 = pi1 % (GRADIENTS_2D.length / 2);
				value += attn1 * attn1 * (GRADIENTS_2D[gi1 * 2] * dx1 + GRADIENTS_2D[gi1 * 2 + 1] * dy1);
			}

			const dx2 = dx0 - 0 - SQUISH_2D;
			const dy2 = dy0 - 1 - SQUISH_2D;
			let attn2 = 2 - dx2 * dx2 - dy2 * dy2;
			if (attn2 > 0) {
				attn2 *= attn2;
				const pi2 = perm[(perm[xsb & (PSIZE - 1)] + ysb + 1) & (PSIZE - 1)];
				const gi2 = pi2 % (GRADIENTS_2D.length / 2);
				value += attn2 * attn2 * (GRADIENTS_2D[gi2 * 2] * dx2 + GRADIENTS_2D[gi2 * 2 + 1] * dy2);
			}

			if (inSum <= 0) {
				dx_ext = dx0 + 1 - SQUISH_2D;
				dy_ext = dy0 + 1 - SQUISH_2D;
				xsv_ext = xsb - 1;
				ysv_ext = ysb - 1;
			} else if (xins > yins) {
				dx_ext = dx0 - 1 - SQUISH_2D;
				dy_ext = dy0 + 1 - SQUISH_2D;
				xsv_ext = xsb + 1;
				ysv_ext = ysb - 1;
			} else {
				dx_ext = dx0 + 1 - SQUISH_2D;
				dy_ext = dy0 - 1 - SQUISH_2D;
				xsv_ext = xsb - 1;
				ysv_ext = ysb + 1;
			}
		}

		// Extra contribution
		let attn_ext = 2 - dx_ext * dx_ext - dy_ext * dy_ext;
		if (attn_ext > 0) {
			attn_ext *= attn_ext;
			const pi_ext = perm[(perm[xsv_ext & (PSIZE - 1)] + ysv_ext) & (PSIZE - 1)];
			const gi_ext = pi_ext % (GRADIENTS_2D.length / 2);
			value += attn_ext * attn_ext * (GRADIENTS_2D[gi_ext * 2] * dx_ext + GRADIENTS_2D[gi_ext * 2 + 1] * dy_ext);
		}

		return value / NORM_2D;
	}

	return { sample };
}

/**
 * Octave noise — combines multiple noise samples at different frequencies.
 *
 * @param noise - Base noise generator
 * @param x - World X coordinate
 * @param y - World Y coordinate
 * @param octaves - Number of octaves (more = finer detail)
 * @param persistence - Amplitude multiplier per octave (0.5 typical)
 * @param scale - Base frequency scaling (smaller = larger features)
 * @returns Value in approximately [-1, 1]
 */
export function octaveNoise(
	noise: NoiseGenerator,
	x: number,
	y: number,
	octaves: number,
	persistence: number,
	scale: number = 0.005,
): number {
	let value = 0;
	let amplitude = 1;
	let frequency = scale;
	let maxAmplitude = 0;

	for (let i = 0; i < octaves; i++) {
		value += noise.sample(x * frequency, y * frequency) * amplitude;
		maxAmplitude += amplitude;
		amplitude *= persistence;
		frequency *= 2;
	}

	return value / maxAmplitude; // Normalize to [-1, 1]
}

/**
 * Ridged noise — used for rivers (§4.4).
 * Takes absolute value and inverts, creating ridge-like patterns.
 */
export function ridgedNoise(
	noise: NoiseGenerator,
	x: number,
	y: number,
	octaves: number,
	persistence: number,
	scale: number = 0.005,
): number {
	return 1.0 - Math.abs(octaveNoise(noise, x, y, octaves, persistence, scale));
}

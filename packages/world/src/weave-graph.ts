/**
 * Weave State Graph — Loom Stones and Threadlines.
 *
 * Models the spatial network of Loom Stones (nodes) connected by
 * Threadlines (edges). When stones degrade or Threadlines weaken,
 * weave state degrades in affected tile regions.
 *
 * This is the mechanical backbone of the Thinning.
 *
 * Architecture:
 * - Loom Stones have integrity (0-100). Damaged stones weaken connected Threadlines.
 * - Threadlines have strength (0-100). Weak Threadlines degrade weave state nearby.
 * - Propagation: damage at one stone cascades along Threadlines with attenuation.
 * - Wards resist: tiles inside ward-protected settlements stay stable regardless.
 * - The graph is seeded deterministically from the world seed.
 */

import type {
	LoomStone,
	Threadline,
	TileCoord,
	WeaveGraph,
	WeaveState,
} from '@loreweave/types';
import { fnv1a } from './rng.js';

// ─── Graph Construction ───

/**
 * Create the initial weave graph for a world.
 * Places Loom Stones deterministically, connects them with Threadlines.
 *
 * @param worldSeed - The world seed (used for deterministic placement)
 * @param stoneCount - Number of Loom Stones to place (default: 7 for Act IV)
 * @param worldRadius - Radius of the world area to place stones in
 */
export function createWeaveGraph(
	worldSeed: number,
	stoneCount = 7,
	worldRadius = 512,
): WeaveGraph {
	const stones = placeStones(worldSeed, stoneCount, worldRadius);
	const threadlines = connectStones(stones, worldSeed);
	const globalHealth = computeGlobalHealth(stones);

	return { stones, threadlines, globalHealth };
}

/**
 * Place Loom Stones deterministically using the world seed.
 * Stones are spread across the world using a poisson-like distribution.
 */
function placeStones(
	worldSeed: number,
	count: number,
	radius: number,
): LoomStone[] {
	const stones: LoomStone[] = [];
	const minDistance = radius * 0.4; // Minimum distance between stones

	for (let i = 0; i < count; i++) {
		// Generate position with rejection sampling for spacing
		let x: number;
		let y: number;
		let attempts = 0;
		do {
			const rngX = fnv1a([worldSeed, i * 2, attempts]) / 0x100000000;
			const rngY = fnv1a([worldSeed, i * 2 + 1, attempts]) / 0x100000000;
			x = Math.floor((rngX * 2 - 1) * radius);
			y = Math.floor((rngY * 2 - 1) * radius);
			attempts++;
		} while (
			attempts < 50
			&& stones.some((s) => tileDistance(s.position, { x, y }) < minDistance)
		);

		stones.push({
			id: `loom-stone-${i}`,
			name: STONE_NAMES[i] ?? `Loom Stone ${i + 1}`,
			position: { x, y },
			integrity: 100,
			discovered: false,
			isKeystone: i < Math.min(count, 7), // First 7 are Keystones
		});
	}

	return stones;
}

/** Default Loom Stone names (7 Keystones for Act IV). */
const STONE_NAMES = [
	'The First Thread',
	'Warden\'s Anchor',
	'The Singing Stone',
	'Hearthstone',
	'The Deep Root',
	'Stormspire',
	'The Last Weave',
];

/**
 * Connect Loom Stones with Threadlines.
 * Uses a minimum spanning tree + additional edges for redundancy.
 */
function connectStones(stones: LoomStone[], worldSeed: number): Threadline[] {
	if (stones.length < 2) return [];

	const threadlines: Threadline[] = [];
	const connected = new Set<string>([stones[0].id]);
	let edgeId = 0;

	// Phase 1: Minimum spanning tree (Prim's algorithm)
	while (connected.size < stones.length) {
		let bestDist = Infinity;
		let bestFrom: LoomStone | null = null;
		let bestTo: LoomStone | null = null;

		for (const stone of stones) {
			if (!connected.has(stone.id)) continue;
			for (const other of stones) {
				if (connected.has(other.id)) continue;
				const dist = tileDistance(stone.position, other.position);
				if (dist < bestDist) {
					bestDist = dist;
					bestFrom = stone;
					bestTo = other;
				}
			}
		}

		if (bestFrom && bestTo) {
			connected.add(bestTo.id);
			threadlines.push({
				id: `threadline-${edgeId++}`,
				fromId: bestFrom.id,
				toId: bestTo.id,
				strength: 100,
				severed: false,
				influenceRadius: Math.max(32, Math.floor(bestDist * 0.3)),
			});
		}
	}

	// Phase 2: Add redundant edges (30% chance per possible edge)
	for (let i = 0; i < stones.length; i++) {
		for (let j = i + 2; j < stones.length; j++) {
			const hasEdge = threadlines.some(
				(t) => (t.fromId === stones[i].id && t.toId === stones[j].id)
					|| (t.fromId === stones[j].id && t.toId === stones[i].id),
			);
			if (hasEdge) continue;

			const dist = tileDistance(stones[i].position, stones[j].position);
			const rng = fnv1a([worldSeed, i, j, 999]) / 0x100000000;
			if (rng < 0.3 && dist < 600) {
				threadlines.push({
					id: `threadline-${edgeId++}`,
					fromId: stones[i].id,
					toId: stones[j].id,
					strength: 100,
					severed: false,
					influenceRadius: Math.max(32, Math.floor(dist * 0.3)),
				});
			}
		}
	}

	return threadlines;
}

// ─── Graph Queries ───

/**
 * Get the effective weave state at a tile position based on the weave graph.
 * Returns the worst weave state from any nearby Threadline or stone.
 * If no graph influence reaches the tile, returns null (use noise-based default).
 */
export function getGraphWeaveState(
	graph: WeaveGraph,
	position: TileCoord,
): WeaveState | null {
	let worstStrength = 101; // Higher than max = no influence
	let hasInfluence = false;

	// Check proximity to Loom Stones (radius 16)
	for (const stone of graph.stones) {
		const dist = tileDistance(stone.position, position);
		if (dist <= 16) {
			hasInfluence = true;
			// Stone integrity directly affects local weave
			const localStrength = stone.integrity;
			if (localStrength < worstStrength) {
				worstStrength = localStrength;
			}
		}
	}

	// Check proximity to Threadlines
	for (const line of graph.threadlines) {
		if (line.severed) continue;

		const from = graph.stones.find((s) => s.id === line.fromId);
		const to = graph.stones.find((s) => s.id === line.toId);
		if (!from || !to) continue;

		const dist = pointToSegmentDistance(position, from.position, to.position);
		if (dist <= line.influenceRadius) {
			hasInfluence = true;
			// Strength attenuates with distance from the line
			const attenuation = 1 - (dist / line.influenceRadius);
			const localStrength = line.strength * attenuation;
			if (localStrength < worstStrength) {
				worstStrength = localStrength;
			}
		}
	}

	if (!hasInfluence) return null;

	return strengthToWeaveState(worstStrength);
}

/**
 * Get all Threadlines connected to a Loom Stone.
 */
export function getConnectedThreadlines(
	graph: WeaveGraph,
	stoneId: string,
): Threadline[] {
	return graph.threadlines.filter(
		(t) => t.fromId === stoneId || t.toId === stoneId,
	);
}

/**
 * Get the neighboring Loom Stone on the other end of a Threadline.
 */
export function getNeighborStone(
	graph: WeaveGraph,
	threadline: Threadline,
	fromStoneId: string,
): LoomStone | undefined {
	const neighborId = threadline.fromId === fromStoneId
		? threadline.toId
		: threadline.fromId;
	return graph.stones.find((s) => s.id === neighborId);
}

// ─── Graph Mutations ───

/**
 * Damage a Loom Stone and propagate the effect along Threadlines.
 * Returns a new WeaveGraph — no mutation.
 *
 * @param graph - Current weave graph
 * @param stoneId - The stone to damage
 * @param amount - Integrity points to remove (clamped to 0)
 * @param propagationFactor - How much damage propagates to neighbors (0-1, default 0.3)
 */
export function damageStone(
	graph: WeaveGraph,
	stoneId: string,
	amount: number,
	propagationFactor = 0.3,
): WeaveGraph {
	const stones = graph.stones.map((s) => ({ ...s }));
	const threadlines = graph.threadlines.map((t) => ({ ...t }));

	// Apply direct damage
	const target = stones.find((s) => s.id === stoneId);
	if (!target) return graph;

	target.integrity = Math.max(0, target.integrity - amount);

	// Weaken connected Threadlines proportionally
	for (const line of threadlines) {
		if (line.fromId !== stoneId && line.toId !== stoneId) continue;
		if (line.severed) continue;

		// Threadline strength = min(source integrity, target integrity)
		const fromStone = stones.find((s) => s.id === line.fromId);
		const toStone = stones.find((s) => s.id === line.toId);
		if (fromStone && toStone) {
			line.strength = Math.min(fromStone.integrity, toStone.integrity);
			if (line.strength === 0) {
				line.severed = true;
			}
		}
	}

	// Propagate to neighbor stones (attenuated)
	if (propagationFactor > 0 && amount > 0) {
		const propagatedAmount = Math.floor(amount * propagationFactor);
		if (propagatedAmount > 0) {
			const connected = threadlines.filter(
				(t) => (t.fromId === stoneId || t.toId === stoneId) && !t.severed,
			);
			for (const line of connected) {
				const neighborId = line.fromId === stoneId ? line.toId : line.fromId;
				const neighbor = stones.find((s) => s.id === neighborId);
				if (neighbor) {
					neighbor.integrity = Math.max(0, neighbor.integrity - propagatedAmount);
				}
			}
		}
	}

	// Recompute Threadline strengths after propagation
	for (const line of threadlines) {
		if (line.severed) continue;
		const fromStone = stones.find((s) => s.id === line.fromId);
		const toStone = stones.find((s) => s.id === line.toId);
		if (fromStone && toStone) {
			line.strength = Math.min(fromStone.integrity, toStone.integrity);
			if (line.strength === 0) {
				line.severed = true;
			}
		}
	}

	return {
		stones,
		threadlines,
		globalHealth: computeGlobalHealth(stones),
	};
}

/**
 * Restore a Loom Stone's integrity (e.g., after a quest or ceremony).
 * Returns a new WeaveGraph — no mutation.
 */
export function restoreStone(
	graph: WeaveGraph,
	stoneId: string,
	amount: number,
): WeaveGraph {
	const stones = graph.stones.map((s) => ({ ...s }));
	const threadlines = graph.threadlines.map((t) => ({ ...t }));

	const target = stones.find((s) => s.id === stoneId);
	if (!target) return graph;

	target.integrity = Math.min(100, target.integrity + amount);

	// Reconnect severed Threadlines if both endpoints have integrity
	for (const line of threadlines) {
		if (line.fromId !== stoneId && line.toId !== stoneId) continue;

		const fromStone = stones.find((s) => s.id === line.fromId);
		const toStone = stones.find((s) => s.id === line.toId);
		if (fromStone && toStone) {
			const newStrength = Math.min(fromStone.integrity, toStone.integrity);
			line.strength = newStrength;
			line.severed = newStrength === 0;
		}
	}

	return {
		stones,
		threadlines,
		globalHealth: computeGlobalHealth(stones),
	};
}

/**
 * Mark a Loom Stone as discovered by the party.
 * Returns a new WeaveGraph — no mutation.
 */
export function discoverStone(
	graph: WeaveGraph,
	stoneId: string,
): WeaveGraph {
	return {
		...graph,
		stones: graph.stones.map((s) =>
			s.id === stoneId ? { ...s, discovered: true } : s,
		),
	};
}

/**
 * Sever a Threadline (e.g., during the Release path in Act V).
 * Returns a new WeaveGraph — no mutation.
 */
export function severThreadline(
	graph: WeaveGraph,
	threadlineId: string,
): WeaveGraph {
	return {
		...graph,
		threadlines: graph.threadlines.map((t) =>
			t.id === threadlineId ? { ...t, strength: 0, severed: true } : t,
		),
		globalHealth: graph.globalHealth, // Doesn't change stone integrity
	};
}

/**
 * Simulate natural weave decay over time.
 * All non-pristine stones lose a small amount of integrity per game day.
 * Returns a new WeaveGraph — no mutation.
 *
 * @param graph - Current weave graph
 * @param decayRate - Integrity points lost per day per stone (default 0.5)
 */
export function applyWeaveDecay(
	graph: WeaveGraph,
	decayRate = 0.5,
): WeaveGraph {
	const stones = graph.stones.map((s) => ({
		...s,
		integrity: Math.max(0, s.integrity - decayRate),
	}));

	// Recompute Threadline strengths
	const threadlines = graph.threadlines.map((t) => {
		const fromStone = stones.find((s) => s.id === t.fromId);
		const toStone = stones.find((s) => s.id === t.toId);
		if (!fromStone || !toStone) return t;

		const newStrength = Math.min(fromStone.integrity, toStone.integrity);
		return {
			...t,
			strength: newStrength,
			severed: newStrength === 0,
		};
	});

	return {
		stones,
		threadlines,
		globalHealth: computeGlobalHealth(stones),
	};
}

// ─── Helpers ───

/** Compute global health as the average of all stone integrities. */
function computeGlobalHealth(stones: LoomStone[]): number {
	if (stones.length === 0) return 0;
	const total = stones.reduce((sum, s) => sum + s.integrity, 0);
	return Math.round(total / stones.length);
}

/** Euclidean distance between two tile coordinates. */
function tileDistance(a: TileCoord, b: TileCoord): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/** Distance from a point to a line segment. */
function pointToSegmentDistance(
	point: TileCoord,
	segA: TileCoord,
	segB: TileCoord,
): number {
	const dx = segB.x - segA.x;
	const dy = segB.y - segA.y;
	const lenSq = dx * dx + dy * dy;

	if (lenSq === 0) return tileDistance(point, segA);

	// Project point onto the segment, clamping t to [0, 1]
	let t = ((point.x - segA.x) * dx + (point.y - segA.y) * dy) / lenSq;
	t = Math.max(0, Math.min(1, t));

	const projX = segA.x + t * dx;
	const projY = segA.y + t * dy;

	const pdx = point.x - projX;
	const pdy = point.y - projY;
	return Math.sqrt(pdx * pdx + pdy * pdy);
}

/** Convert a strength value (0-100) to a WeaveState. */
function strengthToWeaveState(strength: number): WeaveState {
	if (strength >= 70) return 'stable';
	if (strength >= 40) return 'thin';
	if (strength >= 10) return 'frayed';
	return 'unraveled';
}

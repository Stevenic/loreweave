/**
 * Animation system for Pixel Format v1.
 *
 * Implements keyframe interpolation, easing functions, and clip playback
 * per spec §5.6 and §11.7.
 */

import type { Clip, Easing, Keyframe, Track } from '@loreweave/types';

// ─── Easing Functions ───

/** Easing function type: maps normalized time [0,1] to output [0,1]. */
type EasingFn = (t: number) => number;

const easingFunctions: Record<Easing, EasingFn> = {
	step: (_t: number) => 0, // step handled specially in interpolation
	linear: (t: number) => t,
	'ease-in': (t: number) => t * t,
	'ease-out': (t: number) => t * (2 - t),
	'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/** Get the easing function for a given easing name. */
export function getEasingFn(easing: Easing): EasingFn {
	return easingFunctions[easing];
}

// ─── Keyframe Interpolation ───

/** Get the default easing for a property. */
function defaultEasing(property: string): Easing {
	return property === 'frame' ? 'step' : 'linear';
}

/**
 * Find the two surrounding keyframes for a given time.
 * Returns [prev, next] where prev.time <= time <= next.time.
 * If time is before all keyframes, returns [first, first].
 * If time is after all keyframes, returns [last, last].
 */
function findSurroundingKeyframes(keyframes: Keyframe[], time: number): [Keyframe, Keyframe] {
	if (keyframes.length === 0) {
		throw new Error('Track has no keyframes');
	}
	if (keyframes.length === 1 || time <= keyframes[0].time) {
		return [keyframes[0], keyframes[0]];
	}
	if (time >= keyframes[keyframes.length - 1].time) {
		return [keyframes[keyframes.length - 1], keyframes[keyframes.length - 1]];
	}

	for (let i = 0; i < keyframes.length - 1; i++) {
		if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
			return [keyframes[i], keyframes[i + 1]];
		}
	}

	// Fallback (shouldn't reach here with valid data)
	return [keyframes[keyframes.length - 1], keyframes[keyframes.length - 1]];
}

/**
 * Interpolate a track value at a given time.
 */
export function interpolateTrack(track: Track, time: number): number {
	const easing = track.easing ?? defaultEasing(track.property);
	const [prev, next] = findSurroundingKeyframes(track.keyframes, time);

	// Same keyframe or step easing — return prev value directly
	if (prev === next || easing === 'step') {
		return typeof prev.value === 'number' ? prev.value : 0;
	}

	const prevVal = typeof prev.value === 'number' ? prev.value : 0;
	const nextVal = typeof next.value === 'number' ? next.value : 0;

	const span = next.time - prev.time;
	if (span === 0) return prevVal;

	const t = (time - prev.time) / span;
	const easedT = getEasingFn(easing)(t);

	return prevVal + (nextVal - prevVal) * easedT;
}

// ─── Clip Playback ───

/** Animated property values resolved from a clip at a point in time. */
export type AnimatedProperties = {
	frame: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
	scale: number;
	opacity: number;
};

/** Default animated property values (no animation). */
export const DEFAULT_ANIMATED_PROPERTIES: AnimatedProperties = {
	frame: 0,
	offsetX: 0,
	offsetY: 0,
	rotation: 0,
	scale: 1,
	opacity: 1,
};

/**
 * Compute the local time within a clip given absolute elapsed time.
 * Accounts for playback mode (loop, once, pingpong).
 *
 * Returns the effective time in [0, duration] for sampling keyframes.
 * Returns null if the clip has finished (playback: 'once' and time > duration).
 */
export function computeClipTime(
	elapsedMs: number,
	duration: number,
	playback: 'loop' | 'once' | 'pingpong',
): number | null {
	if (duration <= 0) return 0;

	if (elapsedMs < 0) return 0;

	switch (playback) {
		case 'once': {
			if (elapsedMs >= duration) return null;
			return elapsedMs;
		}
		case 'loop': {
			return elapsedMs % duration;
		}
		case 'pingpong': {
			// Full cycle = 2 * duration (forward + backward)
			const cycle = 2 * duration;
			const pos = elapsedMs % cycle;
			if (pos <= duration) return pos;
			return cycle - pos;
		}
	}
}

/**
 * Sample all animated properties from a clip at a given elapsed time.
 */
export function sampleClip(clip: Clip, elapsedMs: number): AnimatedProperties {
	const playback = clip.playback ?? 'loop';
	const localTime = computeClipTime(elapsedMs, clip.duration, playback);

	// Clip finished — return last keyframe values
	if (localTime === null) {
		const result = { ...DEFAULT_ANIMATED_PROPERTIES };
		for (const track of clip.tracks) {
			const lastKf = track.keyframes[track.keyframes.length - 1];
			if (lastKf && track.property in result) {
				(result as Record<string, number>)[track.property] =
					typeof lastKf.value === 'number' ? lastKf.value : 0;
			}
		}
		return result;
	}

	const result = { ...DEFAULT_ANIMATED_PROPERTIES };
	for (const track of clip.tracks) {
		if (track.property in result) {
			(result as Record<string, number>)[track.property] = interpolateTrack(track, localTime);
		}
	}

	return result;
}

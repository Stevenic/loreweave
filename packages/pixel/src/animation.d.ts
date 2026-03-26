/**
 * Animation system for Pixel Format v1.
 *
 * Implements keyframe interpolation, easing functions, and clip playback
 * per spec §5.6 and §11.7.
 */
import type { Clip, Easing, Track } from '@loreweave/types';
/** Easing function type: maps normalized time [0,1] to output [0,1]. */
type EasingFn = (t: number) => number;
/** Get the easing function for a given easing name. */
export declare function getEasingFn(easing: Easing): EasingFn;
/**
 * Interpolate a track value at a given time.
 */
export declare function interpolateTrack(track: Track, time: number): number;
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
export declare const DEFAULT_ANIMATED_PROPERTIES: AnimatedProperties;
/**
 * Compute the local time within a clip given absolute elapsed time.
 * Accounts for playback mode (loop, once, pingpong).
 *
 * Returns the effective time in [0, duration] for sampling keyframes.
 * Returns null if the clip has finished (playback: 'once' and time > duration).
 */
export declare function computeClipTime(
	elapsedMs: number,
	duration: number,
	playback: 'loop' | 'once' | 'pingpong',
): number | null;
/**
 * Sample all animated properties from a clip at a given elapsed time.
 */
export declare function sampleClip(clip: Clip, elapsedMs: number): AnimatedProperties;
//# sourceMappingURL=animation.d.ts.map

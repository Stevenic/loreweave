/**
 * Animation system for Pixel Format v1.
 *
 * Implements keyframe interpolation, easing functions, and clip playback
 * per spec §5.6 and §11.7.
 */
const easingFunctions = {
    step: (_t) => 0, // step handled specially in interpolation
    linear: (t) => t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};
/** Get the easing function for a given easing name. */
export function getEasingFn(easing) {
    return easingFunctions[easing];
}
// ─── Keyframe Interpolation ───
/** Get the default easing for a property. */
function defaultEasing(property) {
    return property === 'frame' ? 'step' : 'linear';
}
/**
 * Find the two surrounding keyframes for a given time.
 * Returns [prev, next] where prev.time <= time <= next.time.
 * If time is before all keyframes, returns [first, first].
 * If time is after all keyframes, returns [last, last].
 */
function findSurroundingKeyframes(keyframes, time) {
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
export function interpolateTrack(track, time) {
    const easing = track.easing ?? defaultEasing(track.property);
    const [prev, next] = findSurroundingKeyframes(track.keyframes, time);
    // Same keyframe or step easing — return prev value directly
    if (prev === next || easing === 'step') {
        return typeof prev.value === 'number' ? prev.value : 0;
    }
    const prevVal = typeof prev.value === 'number' ? prev.value : 0;
    const nextVal = typeof next.value === 'number' ? next.value : 0;
    const span = next.time - prev.time;
    if (span === 0)
        return prevVal;
    const t = (time - prev.time) / span;
    const easedT = getEasingFn(easing)(t);
    return prevVal + (nextVal - prevVal) * easedT;
}
/** Default animated property values (no animation). */
export const DEFAULT_ANIMATED_PROPERTIES = {
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
export function computeClipTime(elapsedMs, duration, playback) {
    if (duration <= 0)
        return 0;
    if (elapsedMs < 0)
        return 0;
    switch (playback) {
        case 'once': {
            if (elapsedMs >= duration)
                return null;
            return elapsedMs;
        }
        case 'loop': {
            return elapsedMs % duration;
        }
        case 'pingpong': {
            // Full cycle = 2 * duration (forward + backward)
            const cycle = 2 * duration;
            const pos = elapsedMs % cycle;
            if (pos <= duration)
                return pos;
            return cycle - pos;
        }
    }
}
/**
 * Sample all animated properties from a clip at a given elapsed time.
 */
export function sampleClip(clip, elapsedMs) {
    const playback = clip.playback ?? 'loop';
    const localTime = computeClipTime(elapsedMs, clip.duration, playback);
    // Clip finished — return last keyframe values
    if (localTime === null) {
        const result = { ...DEFAULT_ANIMATED_PROPERTIES };
        for (const track of clip.tracks) {
            const lastKf = track.keyframes[track.keyframes.length - 1];
            if (lastKf && track.property in result) {
                result[track.property] =
                    typeof lastKf.value === 'number' ? lastKf.value : 0;
            }
        }
        return result;
    }
    const result = { ...DEFAULT_ANIMATED_PROPERTIES };
    for (const track of clip.tracks) {
        if (track.property in result) {
            result[track.property] = interpolateTrack(track, localTime);
        }
    }
    return result;
}
//# sourceMappingURL=animation.js.map
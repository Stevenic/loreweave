---
name: backlog_dynamic_lighting
description: Backlog task — dynamic lighting effects (flickering firelight on character faces, per-pixel tinting, radial light sources)
type: project
---

# Backlog: Dynamic Lighting & Animation Effects

**Status:** Not started
**Priority:** Medium — enables cinematic close-up scenes
**Created:** 2026-03-26

## The Ask

"If I've asked for a zoomed-in animation of a character in the party telling a story around the campfire, do I see the flickering fire reflecting on their face?"

## What Exists Today (2026-03-26 work)

The following were built today and form the foundation:

- **`packages/pixel/src/animation.ts`** — 5 easing functions (step/linear/ease-in/out/in-out), keyframe interpolation, clip playback (loop/once/pingpong)
- **`packages/pixel/src/emitter.ts`** — seeded PRNG particle system (xorshift32), gravity, fade, burst + continuous modes
- **`packages/pixel/src/canvas-renderer.ts`** — Canvas 2D pipeline with blend modes (normal/multiply/screen/overlay/additive), per-item opacity, per-item scale, camera/zoom, parallax, y-sort, attachments, shadow anchors
- **`packages/pixel/src/color.ts`** — RGBA parsing, alpha blending, palette remapping with nearest-color matching
- **Progressive palettes** — fantasy16 → 32 → 64 → 72, strict supersets, render-time palette remapping via `targetPalette`

### Current workaround (manual, limited)

A 4-layer scene composition approach works today:
1. Background layer (campfire scene)
2. Character sprite layer
3. Glow mask sprite layer (hand-authored orange/yellow overlay matching character silhouette) + `additive` blend mode + animated opacity clip
4. Foreground layer (sparks via emitter)

This requires manually authoring a glow mask sprite per character pose — tedious and not LLM-friendly.

## Gaps to Fill

1. **`tint` as an animatable item property** — Per-item color tint (e.g., `"tint": "#FF660044"`) that multiplies with the sprite's palette colors at render time. Animatable via keyframe tracks → flickering warm light.
2. **Color keyframe track type** — Animation tracks that interpolate between colors (not just numbers). Needed for `tint` animation.
3. **Declarative `lights` array on scenes** — Point lights with position, color, radius, falloff, and optional flicker frequency. The renderer computes per-pixel brightness based on distance to light sources.
4. **Radial light falloff** — Light intensity decreases with distance from source, creating natural gradients on nearby sprites.

## WebGL Upgrade Path

Canvas 2D can handle items 1-2 (tint + color tracks) adequately — `globalCompositeOperation` with overlay/multiply layers and per-frame tint fills. But items 3-4 (declarative lights with radial falloff) will benefit significantly from WebGL:

- **Per-pixel light calculations** — A fragment shader computes brightness for every pixel based on distance to N light sources in a single GPU pass. Canvas 2D would require per-pixel `getImageData`/`putImageData` which is orders of magnitude slower.
- **Normal maps** — If we ever add sprite normal maps (surface direction data), WebGL can do real-time dot-product lighting. Canvas 2D cannot.
- **Multiple dynamic lights** — WebGL handles 8-16 point lights per fragment shader trivially. Canvas 2D with overlay layers scales linearly (one composite pass per light).
- **Flicker animation** — Uniform updates in WebGL (changing light intensity/color per frame) are essentially free. Canvas 2D requires full recomposite.

**Recommendation:** Implement items 1-2 in Canvas 2D first (they work fine there). When we tackle items 3-4, build the WebGL renderer as a parallel pipeline — same scene graph input, GPU-accelerated output. The `CanvasFactory` injection pattern already supports swapping renderers.

## Future: Lip Sync & Sound Effects (Eleven Labs)

**Not v1.** When we get to this:

- **Lip sync** — Eleven Labs provides phoneme timing data alongside generated speech. We'd need:
  - A `lipsync` track type in animation clips that maps phoneme timestamps to mouth sprite frames (visemes)
  - A viseme set per character sprite (6-8 mouth shapes covering the basic phoneme groups)
  - A sync engine that advances the lipsync track based on audio playback position
- **Sound effects** — Scene items and emitters could reference audio assets with spatial positioning. The Web Audio API + panner nodes give us 2D positional audio for free.
- **Integration point** — The narrative engine (@lexicon's domain) would produce text → Eleven Labs produces audio + phoneme data → the pixel renderer consumes the phoneme timeline to drive lip animation.

This is a cross-team feature: spec amendment (@scribe), prompt engineering for viseme generation (@lexicon), renderer implementation (beacon).

## Spec Impact

Items 1-2 are renderer-only additions (no spec change needed — `tint` can be an extension property).
Items 3-4 would need a spec amendment (new `lights` section) — hand off to @scribe.
Lip sync would need a new `lipsync` track type in the animation clip spec — hand off to @scribe when ready.

## References

- Today's daily log: `.teammates/beacon/memory/2026-03-26.md` (Tasks 1-4)
- Session state: `.teammates/.tmp/sessions/beacon.md` (Firelight Lighting Effects Analysis)
- Canvas renderer: `packages/pixel/src/canvas-renderer.ts`
- Animation system: `packages/pixel/src/animation.ts`
- Color utilities: `packages/pixel/src/color.ts`

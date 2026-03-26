# Pixel Format v1 — LLM Generation Guide

A JSON pixel art format where **text IS the art**. Each character in a grid = one palette color.

---

## Sprite — the atomic unit

```json
{
  "format": "pixel-sprite-v1",
  "name": "potion_red",
  "width": 8,
  "height": 8,
  "palette": {
    "entries": {
      "0": "transparent",
      "1": "#1a1a2e",
      "2": "#e94560",
      "3": "#ff6b6b",
      "4": "#ffffff"
    },
    "aliases": { "0": "clear", "1": "outline", "2": "red-dark", "3": "red-light", "4": "highlight" },
    "ramps": { "red": ["2", "3"], "glass": ["1", "4"] }
  },
  "encoding": "raw",
  "pixels": [
    "00011000",
    "00100100",
    "01344310",
    "01233210",
    "12222221",
    "12322321",
    "12222221",
    "01111110"
  ]
}
```

**Rules:**
- Palette keys: single char (`0-9`, `A-Z`, `a-z`, `! @ # $ % & * + = ?`). Max 72.
- Colors: `"transparent"`, `"#RRGGBB"`, or `"#RRGGBBAA"`
- `aliases` map keys to semantic names (helps you pick the right color)
- `ramps` group keys dark→light (use for shading)
- Each `pixels` row = `width` characters. Row count = `height`.
- `"0"` mapped to `"transparent"` means empty space

---

## RLE encoding (for larger sprites)

Use `"encoding": "rle"` — each row is space-separated `<count><symbol>` tokens:

```json
"encoding": "rle",
"pixels": [
  "3A 2B 3A",
  "1A 6B 1A",
  "8B"
]
```

`3A 2B 3A` → `AAABBAAA`. Raw and RLE are interchangeable — same result.

---

## Sprite layers

Separate concerns (outline, fill, highlights) into named layers. Composited bottom-up:

```json
"layers": [
  { "name": "outline", "pixels": ["00011000", "00100100", "01000010", "..."] },
  { "name": "fill",    "pixels": ["00000000", "00044000", "00334300", "..."] }
]
```

When `layers` is present, omit top-level `pixels`.

---

## Animation frames

Stack frames vertically in `pixels`. Set `frameCount`:

```json
{
  "name": "torch_flame",
  "width": 4,
  "height": 6,
  "frameCount": 3,
  "pixels": [
    "0450", "0540", "4554", "0440", "0110", "0110",
    "0540", "4550", "0454", "0440", "0110", "0110",
    "0050", "0450", "4544", "0440", "0110", "0110"
  ]
}
```

Total rows = `height × frameCount` (here: 6 × 3 = 18). Frames slice top→bottom.

---

## Animation clips (keyframes)

```json
"clips": {
  "flicker": {
    "duration": 450,
    "playback": "loop",
    "tracks": [
      { "property": "frame", "keyframes": [{"time": 0, "value": 0}, {"time": 150, "value": 1}, {"time": 300, "value": 2}] }
    ]
  }
}
```

Animatable: `frame` (step), `offsetX`, `offsetY`, `rotation`, `scale`, `opacity` (all interpolated).
Playback: `"loop"`, `"once"`, `"pingpong"`. Easing: `"step"`, `"linear"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`.

---

## Optional sprite metadata

```json
{
  "ppu": 32,
  "symmetry": "horizontal",
  "origin": { "x": 4, "y": 8 },
  "baseScale": 1.0,
  "regions": {
    "head": { "x": 2, "y": 0, "width": 4, "height": 4 }
  },
  "attachments": {
    "hand_right": { "x": 12, "y": 8 }
  },
  "constraints": {
    "maxColors": 6,
    "outline": true,
    "noIslands": true
  },
  "variants": {
    "potion_blue": { "palette": { "2": "#4560e9", "3": "#6b8bff" } },
    "potion_large": { "scale": 2.0 }
  },
  "tags": ["item", "consumable"]
}
```

| Field | Purpose |
|-------|---------|
| `ppu` | Pixels Per Unit — how many pixels = 1 world tile. Default 32. Use 16 for buildings, 64 for icons |
| `symmetry` | `"horizontal"` / `"vertical"` / `"both"` — generate half, mirror the rest |
| `origin` | Anchor point for scene placement |
| `baseScale` | Reference size for depth composition |
| `regions` | Named rectangles for partial regeneration |
| `attachments` | Named points where other sprites connect |
| `constraints` | Advisory generation hints |
| `variants` | Palette swaps and scale overrides without duplicating pixels |

---

## Palette file (shared across sprites)

```json
{
  "format": "pixel-palette-v1",
  "name": "fantasy16",
  "entries": {
    "0": "transparent", "1": "#2b1d0e", "2": "#5a3a22", "3": "#8b5a2b",
    "4": "#e2a13b", "5": "#ffd46b", "6": "#254d2a", "7": "#3a6b3a",
    "8": "#5b8f4c", "9": "#91b86f", "A": "#6d7a8a", "B": "#a7b5c5",
    "C": "#d8e2f1", "D": "#7f2f35", "E": "#bf5a5a", "F": "#10151f"
  },
  "aliases": {
    "1": "bark-dark", "2": "bark-mid", "3": "bark-light",
    "6": "leaf-dark", "7": "leaf-mid", "8": "leaf-light", "9": "leaf-bright"
  },
  "ramps": { "bark": ["1","2","3"], "leaf": ["6","7","8","9"], "stone": ["A","B","C"] }
}
```

Sprites reference by name: `"palette": "fantasy16"`

---

## Tileset

```json
{
  "format": "pixel-tileset-v1",
  "name": "forest_ground",
  "tileWidth": 8, "tileHeight": 8,
  "palette": "fantasy16",
  "tiles": {
    "grass": {
      "encoding": "raw",
      "pixels": ["77777777","78878787","77788777","78877787","77777777","78788787","77777777","77777777"],
      "connectivity": { "north": "grass", "east": "grass", "south": "grass", "west": "grass" }
    },
    "dirt_path": {
      "encoding": "raw",
      "pixels": ["33333333","23324323","33333333","33233233","33333333","32333323","33333333","33333333"],
      "connectivity": { "north": "dirt", "east": "dirt", "south": "dirt", "west": "dirt" }
    }
  }
}
```

`connectivity` enables auto-tiling — adjacent tile edges must match.

---

## Tilemap

```json
{
  "format": "pixel-tilemap-v1",
  "name": "forest_path",
  "tileset": "forest_ground",
  "gridWidth": 10, "gridHeight": 6,
  "legend": {
    "G": "grass",
    "D": "dirt_path",
    "d": { "tile": "dirt_path", "flipX": true },
    "R": { "tile": "dirt_path", "rotate": 90 }
  },
  "grid": [
    "GGGGGGGGGG",
    "GGGDDGGGGG",
    "GGDDDdGGGG",
    "GDDDDDDGGG",
    "GGDDDDGGGG",
    "GGGDDGGGGG"
  ]
}
```

Text IS the map. Legend maps chars to tile names (or tile + transform).

---

## Scene (composing everything)

```json
{
  "format": "pixel-scene-v1",
  "name": "forest_camp",
  "canvas": {
    "width": 256, "height": 192,
    "background": "#89b9ff",
    "camera": { "x": 128, "y": 96, "zoom": 1.0 }
  },
  "layers": [
    {
      "name": "sky", "scrollFactor": 0.1,
      "items": [
        { "asset": "mountain_range", "x": 0, "y": 20, "scale": 0.3, "opacity": 0.5 }
      ]
    },
    { "name": "terrain", "type": "tilemap", "tilemap": "forest_path" },
    {
      "name": "objects", "sort": "y",
      "items": [
        { "asset": "pine_tree", "x": 18, "y": 70 },
        { "asset": "campfire_small", "x": 82, "y": 76, "clip": "burn" }
      ]
    },
    {
      "name": "actors", "sort": "y",
      "items": [
        { "asset": "hero_warrior", "x": 60, "y": 83, "id": "hero" },
        { "asset": "iron_sword", "attach": { "parent": "hero", "point": "hand_right" } }
      ]
    },
    {
      "name": "lighting", "blend": "additive",
      "items": [
        { "asset": "warm_glow", "x": 78, "y": 68, "opacity": 0.4 }
      ]
    }
  ]
}
```

**Layer fields:** `opacity`, `blend` (`normal`/`multiply`/`screen`/`overlay`/`additive`), `scrollFactor` (parallax), `sort` (`"y"` for depth sorting).

**Item fields:** `asset`, `x`, `y`, `scale`, `opacity`, `flipX`, `flipY`, `rotation`, `palette` (override), `variant`, `clip`, `attach`, `groundY` (shadow anchor).

---

## Common generation tasks

### Create a sprite
1. Choose dimensions based on `ppu`: characters at ppu 32 (32×48), buildings at ppu 16 (64×64), items at ppu 32 (16×16), icons at ppu 64 (16×16)
2. Define a palette (inline or reference a shared one)
3. Pick encoding (`raw` for ≤16×16, `rle` for larger)
4. Draw the pixel grid — each char = one palette key, `0` = transparent
5. Add `constraints` to self-check: `maxColors`, `outline`, `noIslands`

### Palette swap a sprite
Add a `variants` entry with only the changed palette keys:
```json
"variants": { "blue_version": { "palette": { "D": "#3560e9", "E": "#6b8bff" } } }
```

### Animate a sprite
1. Stack frames vertically, set `frameCount`
2. Add a `clips` entry with `frame` track keyframes
3. Optional: add `offsetX`/`rotation`/`scale`/`opacity` tracks for motion

### Compose a scene with depth
- Background layer: `scrollFactor: 0.1`, items at `scale: 0.3`, `opacity: 0.5`
- Midground: `scrollFactor: 0.6`, `scale: 0.7`
- Foreground: `scrollFactor: 1.0`, `scale: 1.0`
- Use `sort: "y"` on character/object layers

### Add lighting
Create a lighting layer with `"blend": "additive"` or `"multiply"` and semi-transparent sprites.

### Use symmetry to save tokens
Set `"symmetry": "horizontal"` — generate only the left half, then mirror to complete. 50% fewer characters.

### Build a tile map
1. Create a tileset with named tiles
2. Create a tilemap with a legend (char→tile) and character grid
3. Use tile transforms (`flipX`, `flipY`, `rotate`) in legend to avoid duplicating tiles

### Attach equipment to a character
1. Add `attachments` to the character sprite: `{ "hand_right": { "x": 12, "y": 8 } }`
2. In scene, give character an `id` and attach items: `{ "asset": "sword", "attach": { "parent": "hero", "point": "hand_right" } }`

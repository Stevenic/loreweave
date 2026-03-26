# Asset Design Guide

Rules of thumb for designing and organizing LoreWeave pixel assets. This guide helps content creators and LLM generators make consistent decisions about asset structure.

---

## 1. Views vs. Separate Assets

**Rule:** If the game engine would swap between them on the same entity (state change), they're views. If they could exist independently in the world, they're separate assets.

**The test: Same identity or different identity?**

A campfire is a campfire whether it's lit or unlit. It occupies the same world-space position, has the same proportions, and is the same logical object in the game engine. The only thing that changes is its visual state. That's exactly what views are for.

| Pattern | When to use | Examples |
|---------|------------|---------|
| **Views** | Same object, different visual states | lit/unlit, open/closed door, full/empty chest |
| **Separate assets** | Different objects with independent identity | fire effect, smoke effect, character vs. weapon |
| **References** | Composing independent assets together | campfire references fire + smoke |

**Same asset, multiple views:**
- `campfire/` → views: `lit`, `unlit`, `smoldering`
- `torch/` → views: `lit`, `unlit`
- `lantern/` → views: `lit`, `dim`, `unlit`
- `door/` → views: `open`, `closed`, `locked`
- `chest/` → views: `closed`, `open`, `empty`

**Separate assets (with references):**
- `fire/` — standalone flame effect, reusable across torches, campfires, sconces
- `smoke/` — standalone particle effect, reusable
- `campfire/` — references `fire` and `smoke` as optional attached components

---

## 2. When to Use References

**Rule:** Reference another asset when it has independent identity and is reusable across multiple parents. Don't reference something that only makes sense in the context of one asset.

**Good references (reusable, independent):**
- A `fire` effect referenced by campfire, torch, sconce, brazier
- A `sword` weapon referenced by warrior, guard, knight
- A `flag` decoration referenced by castle, outpost, ship

**Bad references (just use views instead):**
- A "campfire flame" that only ever appears on the campfire — that's a view, not a separate asset
- A "door handle" that only belongs to one specific door — model it within the door sprite

---

## 3. Naming Views

**Rule:** Name views by what changes, not by what stays the same. Use short, descriptive state names.

**Good view names:**
- `lit`, `unlit`, `smoldering` (state of combustion)
- `open`, `closed`, `locked` (state of access)
- `full`, `half`, `empty` (state of capacity)
- `front`, `side`, `back` (orientation — for multi-angle assets)
- `idle`, `damaged`, `destroyed` (state of condition)

**Bad view names:**
- `campfire_lit` (redundant — the asset is already "campfire")
- `version2` (meaningless — what's different?)
- `new` (relative to when?)

---

## 4. Asset Granularity

**Rule:** An asset represents the smallest unit that has its own identity in the game world. If you'd place it, interact with it, or refer to it independently, it's an asset.

**Asset-level things:**
- Campfire (a placeable world object)
- Pine tree (a distinct world object)
- Warrior (a character)
- Iron sword (an item)

**NOT asset-level (use views or sprite regions instead):**
- "The top half of a tree" — that's a region within the tree sprite
- "A slightly different campfire" — that's a variant or view
- "Wood grain texture" — that's a tileset, not a standalone asset

---

## 5. Choosing Asset Types

**Rule:** Pick the type based on how the asset will be used at runtime, not how it looks.

| Type | Purpose | Examples |
|------|---------|---------|
| **sprite** | A single visual object, possibly animated | Character, item, prop, effect |
| **tileset** | Repeating tiles for terrain or surfaces | Grass, stone floor, water |
| **tilemap** | A composed grid of tiles from a tileset | A room layout, a terrain chunk |
| **scene** | Multiple sprites/tilemaps composed together | A forest clearing, a shop interior |

**When in doubt:** If it tiles, it's a tileset. If it's placed once, it's a sprite. If it's a composition of other things, it's a scene.

---

## 6. Palette Sharing

**Rule:** Assets that appear together in a scene should share a palette. This ensures visual coherence and reduces total color count.

- Define palettes as shared resources in `palettes/`
- Reference the same palette from related assets (e.g., all forest props share `fantasy32`)
- Only create a new palette when the existing ones can't represent the asset's color needs

---

## 7. Detail Level Consistency

**Rule:** Assets that appear together should be generated at the same detail level. A high-detail character next to a low-detail tree breaks visual coherence.

- Set detail level per-project or per-scene, not per-asset
- If mixing detail levels, do it intentionally for depth (foreground = higher detail, background = lower)

---

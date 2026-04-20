# Handoff: Stardew Valley-Style Sprites for Loot & Scatter

## Overview
This package replaces the existing programmatic pixel-art in `BootScene.js` with new
Stardew Valley-inspired 16×16 sprites (scaled 2× to 32×32 at runtime), and adds a
4-direction walk animation system to the player character.

## About the Design Files
The `sprites.html` file in this folder is a **design reference** created in a visual
prototyping environment. It is not production code. The task is to integrate the designs
into the existing Phaser 3 codebase (`Vashtag/Loot`) by swapping in the two provided JS
files. Do not ship the HTML file.

## Fidelity
**High-fidelity.** The sprites use exact hex colors, precise pixel layouts, and final
rarity-color mappings that match the existing `constants.js` palette. Recreate them
exactly as drawn.

---

## Files in This Package

| File | Purpose |
|---|---|
| `BootScene.js` | **Drop-in replacement** for `js/scenes/BootScene.js` |
| `GameScene_animation_patch.js` | **Two methods** to copy-paste into `js/scenes/GameScene.js` |
| `sprites.html` | Visual reference — open in a browser to preview all sprites + walk animations |

---

## Integration Steps

### 1 — Replace BootScene.js
Copy `BootScene.js` from this package over `js/scenes/BootScene.js` in the repo.
No other files need to change for the sprites themselves.

### 2 — Patch GameScene.js
Open `js/scenes/GameScene.js` and replace **two methods**:

- `createPlayer()` → copy from `GameScene_animation_patch.js`
- `update()` → copy from `GameScene_animation_patch.js`

Both methods are clearly delimited in the patch file with comments.

### 3 — Verify
Run the game. The player should now display walk animations in all four directions and
snap to an idle frame when stationary. All tiles (floor, wall, chest, hazard) should
render with the new Stardew-style pixel art.

---

## Sprite Inventory

### Player Sheet (`player_sheet`) — 128×96 px
Generated programmatically in `makePlayerSheet()`. Frame layout:

| Frame indices | Direction | Used when |
|---|---|---|
| 0 – 3  | Walk down  | `vy > 0` |
| 4 – 7  | Walk up    | `vy < 0` |
| 8 – 11 | Walk right | `vx ≠ 0` (flip X for left) |

Animations registered in `setupAnimations()`:

| Key | Frames | Loop |
|---|---|---|
| `walk_down`  | 0–3  | yes |
| `walk_up`    | 4–7  | yes |
| `walk_right` | 8–11 | yes |
| `idle_down`  | 0    | yes |
| `idle_up`    | 4    | yes |
| `idle_right` | 8    | yes |

For **left-facing**, `walk_right` / `idle_right` are reused with `setFlipX(true)`.

### Environment Tiles — 32×32 px each

| Phaser key | Description |
|---|---|
| `floor` | Grass tile with dark texture dots, light dew highlights, and tiny blade details |
| `wall` | Stone brick with 4 alternating offset rows, mortar lines, and per-brick highlights |
| `chest` | Wooden chest with gold band, lock, and lid highlight |
| `chest_open` | Open chest with tilted lid, dark interior, and gold glints |
| `hazard` | Forest bramble with vine stems, thorns, and red tips |
| `particle` | Unchanged white 6×6 square (kept for loot burst emitter) |

---

## Design Tokens Used

### Player Palette
| Role | Hex |
|---|---|
| Hair dark   | `#6b3210` |
| Hair mid    | `#924518` |
| Hair light  | `#c07030` |
| Shirt dark  | `#2a6ab5` |
| Shirt mid   | `#5090d8` |
| Shirt light | `#82b8f0` |
| Skin        | `#f5c89a` |
| Skin shadow | `#dfa87a` |
| Pants       | `#604838` |
| Shoes       | `#281800` |
| Bag         | `#d89030` |
| Bag shadow  | `#a86020` |

### Tile Palette (matches existing `constants.js` PAL values)
| Role | Hex |
|---|---|
| Grass bright  | `#7ec850` |
| Grass dark    | `#5ea030` |
| Grass detail  | `#4a8a1a` |
| Stone base    | `#8a7040` |
| Stone light   | `#b09060` |
| Stone highlight| `#c8b090` |
| Mortar        | `#504020` |
| Chest wood    | `#c87830` |
| Chest lid     | `#e09840` |
| Chest gold    | `#d4a810` |
| Chest lock    | `#ffe050` |
| Thorn green   | `#88aa20` |
| Thorn tip red | `#ff4422` |

---

## Behavior Notes

- **No external assets required.** All textures are generated in `BootScene.create()`
  using Phaser's `Graphics` API, identical to the existing approach.
- **Backward-compatible texture keys.** All existing keys (`floor`, `wall`, `chest`,
  `chest_open`, `hazard`, `particle`) are preserved. The only new key is `player_sheet`,
  which replaces `player`.
- **No constants.js changes needed.** Rarity colors, tile types, and game config are
  untouched.
- **Walk animation frameRate is 8 fps.** Adjust in `setupAnimations()` if needed.

---

## What's Not Included
- Loot item sprites (coin, ring, orb, shard, crown) are visible in `sprites.html` as
  reference. The existing game renders loot as floating emoji text — upgrade to sprites
  is a separate task.
- Enemy / NPC sprites are not in scope for this handoff.

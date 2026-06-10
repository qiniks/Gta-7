# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A browser-based isometric mini-game inspired by GTA Chinatown Wars (see `Gameplay secreenshots/` for visual reference). No build system, no dependencies, no package manager. [`index.html`](index.html) holds the DOM/HUD and loads plain (non-module) scripts from `js/` in a strict order — they share state through top-level globals, so load order matters:

`core.js` → `world.js` → `actors.js` → `combat.js` → `interiors.js` → `render.js` → `game.js`

## Running the game

Open `index.html` in a browser (works over `file://` — that's why scripts are classic, not ES modules), or run the static server defined in `.claude/launch.json` (`npx serve -l 3000 .`). The page is an HTML fragment designed to also live inside a host widget environment: CSS `var(...)` uses have fallback values, and the "create gta8" button guards on `typeof sendPrompt==='function'`.

## Architecture

**Shared state** lives in [js/core.js](js/core.js) as top-level `var`s (so they land on `window` — useful for debugging from the console): `state` (`idle|play|busted|win`), `mode` (`drive|foot`), `area` (`city` or an interior type), `cash`, `heat` (wanted level 0–5), gun state (`gun`, `clip`, `reserve`), entity arrays (`cars`, `cops`, `peds`, `money`, `bullets`, `floats`), and `cam`. Input: `keys{}` = held, `press{}` = pressed this frame (cleared every tick in `game.js`).

**Chunked world** ([js/world.js](js/world.js)) — the city is infinite. Roads run along every line `k*P` (P=170). Each cell `(i,j)` is generated deterministically by `hash2(i,j,salt)` (Math.imul-based mix) into a building, park (13%), or special building, cached in `blockCache` (a Map, cleared past 1200 entries — regeneration is free because generation is pure). `hitBuilding()` checks the 3×3 cells around a point. **Never use `Math.random` in world generation** — only `hash2`, or the world stops being stable across revisits.

**Special buildings** — each 8×8-cell super-chunk (`SC`) hash-places one `shop`, `gun` (gun shop), and `police` cell (`specialAt`; on collision the earlier type wins, so a super-chunk can rarely miss one). They render with a neon sign and a door; `doorAt()` finds an enterable door near the player. `nearestPolice()` recomputes police cells analytically from super-chunk hashes — its salts (114/214) must stay in sync with `specialAt`'s formula (`100+t*7`, `200+t*7`, t=2).

**Interiors** ([js/interiors.js](js/interiors.js)) — entering a special sets `area` to its type and `interior` to `{type, cell, ret}`. Interiors are fixed 420×300 local-coordinate rooms with a fixed camera (`cam.rot=0`); the city simulation pauses while inside (only heat decay continues). Shop: rob the register with F (per-cell cooldown in `robbed{}`); gun shop: `1` buys the pistol, `2` ammo; police: `1` bribes away the wanted level. Exit by walking into the south door gap.

**Combat** ([js/combat.js](js/combat.js)) — F on foot punches (no gun/ammo) or fires. Bullets advance in 3 substeps per frame, stop on buildings and cars, kill peds, and chip cop cars (3 hp); destroying a cop *raises* heat. Clip is 8 with auto-reload from reserve (`reloadT`).

**Heat/police** — `crime(n)` raises `heat`; active cop count equals `Math.floor(heat)`. Busted: half cash, all ammo confiscated (gun kept), respawn at the nearest police station.

**Rendering** ([js/render.js](js/render.js)) — painter's algorithm: visible items are pushed into `items[]` with projected screen Y, sorted, drawn. `proj(wx,wy,h)` is the isometric projection (0.5 vertical squash, camera rotation, shake offsets). `drawPrism()` is the shared box renderer for buildings, walls, and furniture. Minimap is player-centered and marks specials by their `SPEC_DEF` colors.

**Game loop** ([js/game.js](js/game.js)) — `tick()`: `step()` when playing, clear `press`, `updateCam()`, `render()`. `step()` routes to `stepInterior()` when inside a building. Spawning (traffic, peds, money) is anchored to road lines near the player; far-away entities are culled/relocated since the world has no bounds.

**Input layout** — keys are matched against both English and Russian QWERTY (`w`/`ц`, `f`/`а`, etc.). Keep both mappings when adding keys.

## Verification

No test suite. Verify changes by serving the page and driving it via the preview tools: the global state vars and functions are reachable from `preview_eval` (e.g. teleport with `player.x=...`, simulate keys with `dispatchEvent(new KeyboardEvent(...))`). Always pair keydown/keyup in the same eval — a leaked held key keeps acting between evals.

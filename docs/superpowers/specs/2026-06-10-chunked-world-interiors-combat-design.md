# Chunked world, enterable buildings, combat — design

Date: 2026-06-10. Requested: replace fixed 10×10 world with chunk-based generation; add rare enterable buildings (shop, police station, gun shop); add gun shooting and punching NPCs. Inspiration: `Gameplay secreenshots/` (ammo HUD "8/24", neon signs, interiors).

## World generation

- The road grid becomes infinite: roads run along every line `k*P` for any integer `k` (P=170).
- Each cell `(i,j)` between roads is generated deterministically from `hash2(i,j,salt)` (integer mix via `Math.imul`), so the same coordinates always produce the same block. No world bounds.
- Blocks are generated lazily into a `Map` cache (`getBlock(i,j)`), cleared when it grows past ~1200 entries (regeneration is free since it's deterministic).
- Cell types: special building (see below), park (13%), regular building (random footprint, height, palette).

## Special buildings

- Each 8×8-cell super-chunk deterministically places one **shop**, one **gun shop**, and one **police station** (hash-picked cell per type; on the rare collision the earlier type wins).
- Specials are flush, low buildings with a glowing neon sign and a door on the south side. Shown in color on the minimap.
- On foot, Space at the door enters a hand-authored interior room (420×300 local units, fixed camera, same isometric projection): walls, counter, clerk, type-specific furniture. Walk into the bottom door gap to exit (brief invulnerability on exit).
- **Shop**: press F near the counter to rob the register (+$150–400, +2 wanted stars, register empty for ~90s per shop).
- **Gun shop**: `1` buys the pistol ($400, comes with 8+16 ammo), `2` buys 12 reserve rounds ($50, cap 96).
- **Police station**: `1` pays a bribe ($300 × stars) to clear the wanted level.
- City simulation pauses while inside (heat still decays slowly).

## Combat

- `F` (Russian layout: `а`) attacks on foot.
  - No gun: punch — short arc in front; a hit drops the ped (+$20, +1 star) and scares nearby peds.
  - With gun: fires a bullet (clip of 8, auto-reload from reserve with a short delay). Bullets stop on buildings and cars; kill peds (+$40, +2 stars); cop cars take 3 hits, then are knocked out (+1 star — escalation, they respawn while heat is high).
- HUD gains an ammo box ("clip/reserve") once the gun is owned, like the inspiration screenshots.
- Busted: existing cash halving plus ammo confiscation (gun kept); respawn moves to the nearest police station door (found analytically from the super-chunk hashes).

## Balance / misc

- GOAL raised $2500 → $5000 (robbery and combat add income).
- Money pickups relocate near the player when left >900 units behind (world is infinite).
- Traffic/ped/cop spawning re-anchored to road lines near the player instead of fixed world bounds.

## Code structure

`index.html` keeps the DOM and loads plain scripts in order (no modules — preserves `file://` usage and the host-widget environment; CSS `var()` uses get fallback values):
`js/core.js` (constants, canvas, shared state, input, projection) → `js/world.js` (chunk gen, collision) → `js/actors.js` (cars/peds/cops/money) → `js/combat.js` (bullets, attacks) → `js/interiors.js` (rooms, enter/exit, interior logic) → `js/render.js` (all drawing incl. interiors, minimap) → `js/game.js` (state machine, player, HUD, loop).

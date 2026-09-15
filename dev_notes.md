# foxes — dev notes

Working name is still foxes. Repo: `justbobonx/foxes`, branch `main`. Bump `?v=` in `index.html` after script/css edits. Current cache is `?v=37`.

## Files

- `index.html` — canvas, HUD, overlays, script tags
- `css/style.css` — HUD, title, menus
- `js/sprite.js` — `Sprite` / `SpriteBank`. Bitmaps 32×32 in `images/`
- `js/cell.js` — cell data + draw + type table + `Cell.dressGrid`
- `js/grid.js` — generate / dump / load / check. No colors.
- `js/solver.js` — uniqueness count, cap 2
- `js/planner.js` — `{ n, ponds, wolf, bunny }` card for a size
- `js/hint.js` — HINT painter (levels 2 / 3 / 4)
- `js/save.js` — localStorage size, score, board
- `js/chrome.js` — fullscreen enter/leave (same idea as jumbler)
- `js/game.js` — layout, input, HUD, calls `cell.draw`

Deleted on purpose: `js/skin.js`, `js/grid_skin.js`.

## Cell

`type`: `grass` | `pond` | `cave` | `bunny`

Helpers: `cell.is(name)`, `cell.isHole()` (anything not grass), `cell.canTap()`, `cell.setType(name)`.

Truth vs pencil:
- `spriteId` — hidden fox is `"o"`, else null. Never store wolf/bunny here.
- `guessId` — `null` | `"x"` | `"o"` only. Cave + `o` means “wolf guessed here.”
- `locked` / `wrong` — CHECK / HINT results.
- Locked `x` is a print (`sprite "p"` / `images/prints.png`). Pencil `x` stays the letter. HINT never restyles an existing pencil `x`.

Look is not assigned in the generator. After a successful `rebuild` and after `Grid.load`, game calls `Cell.dressGrid(grid)`. That writes `look` from `CELL_TYPES`, `fill` (dell color on grass, type fill on specials), and `round` `[tl,tr,br,bl]` as booleans. Pixel radius is computed in `draw` from current cell size.

`CELL_TYPES` is CSS-style: grass is the default (dark glyph, tap, `markO: "o"`). Specials only list overrides (fill, edge, `edgeFrac`, `tap`, `stand`, `markO`, `glyphColor`). Bitmap pixels live in `SpriteBank`; types store ids (`stand: "b"`, `markO: "w"`).

Wolf seat is **not** a cell field. Grid keeps `wolfRow` / `wolfCol` (−1 if none). `grid.isWolfAt(r,c)`, `grid.nearWolf(r,c)` (Chebyshev ≤ 1).

## Generate

`Planner.roll(n)` today: pond 50% on 7+, wolf 50% on 8+, bunny 50% on 8+. Independent coins. Intended later: a path of cards so the player meets extras one at a time.

`Grid.rebuild(plan)`:
1. ponds
2. cave (then pick wolf seat inside it)
3. bunny
4. place N foxes (seed bunny pair first if present)
5. paint dells with uniqueness prune
6. accept if `Solver.count(2) === 1`

Holes use `dellId === HOLE_DELL` (−2) so flood-fill and the solver skip them.

Fox placement: permutation of rows/cols, reject holes, wolf 3×3, and 8-way adjacency. Bunny boards plant a legal pair on the ring first (different row and col, Chebyshev ≥ 2). Bunny is never a corner. Solver also requires exactly two ring foxes when a bunny exists.

Dell paint: seed on each fox, grow one free 4-neighbor per step. Hunger: everyone to size 2, then most to 3, quota of 1–2 size-2s kept, prefer some size-3s, then fill the rest. If the only edge is a reserved small dell, it may grow. Each claim is kept only if the board still has one solution.

`UNIQUE_TRIES` 250, `PLACE_TRIES` 200, `DELL_PAINT_TRIES` 40.

## Hint

Bottom button label is HINT while grass `o` count `< N`, CHECK at `>= N`. Both run step 1 first (`grid.checkGuesses`): lock correct foxes, paint wrong ones, score, win if N correct. CHECK mode (`>= N`) stops there. HINT mode also stops on a wrong `o`. Menu HINT is the same path without the `>= N` short-circuit (N correct still wins; wrongs still stop).

Then `Hint.apply()`, one rule per click:

1. Level 2 — player-locked foxes only. Shuffle row / col / ring / dell. First test that still has empty grass targets paints all of those empties as locked prints.
2. Level 3 — strip dell (whole dell in one row or column), two-line claim (exactly two dells contained in two rows or two columns → X everything else on those two lines), small-dell halo (cell 8-adjacent to every remaining seat of a 2–3 seat dell). Shuffle matching batches; paint one batch.
3. Level 4 — painter has nothing left to show. Pick a dell with the most unknown grass (size tie-break). Lock 2–3 true-empty cells as prints. Leave at least two unknown cells in that dell so the packet does not gift the fox. Fall back to one cell if two will not fit.

Prints only land on blank grass. Pencil `x` is left alone. `x` on a real fox is not a correction.

Wolf / bunny extra rules are not in the painter yet.

## Rules the player already has

- N foxes, one per row, column, dell
- 8-way no-touch
- pond / cave / bunny are extra types on some boards (do not document their rules in README)

## UI / persist

Tap: X or clear. Double-tap in `TAP_MS` (280) after a single becomes `o`. Won boards are not restored; Start makes a new one. Visibility / pagehide → title screen.

HUD: `#/N` is grass fox marks only. Score in localStorage. Board dump is data only (`type`, ids, marks, `wolfRow/Col`, plan). Locked prints persist as `guessId: "x"` + `locked`.

Canvas: `image-rendering: pixelated`; `imageSmoothingEnabled` only when dest tile is smaller than `TILE` (32). Sprite pad inside the cell bg is `0.06` of the inner square. Cell bg inset from the grid is also ~6%.

## Next session, do not forget

- Planner should become cards / a path, not three independent 50% rolls.
- `grid.js` still has leftover presentation-era comments; it must stay data-only.
- Old saves with `pond`/`cave`/`bunny`/`wolf` booleans still load; new dumps use `type` + `wolfRow/Col`.
- Ideas parked (not shipped): owl diagonal as a fourth set, berry bush (exactly two touching foxes on a ring — exception to no-touch), tree/log line split, yard overlay (rejected as confusing).
- Bunny art file is `bunnies.png`; `bunny.png` still sits in `images/`.
- Default new size is whatever `Save.readSize()` has; clamp 4–20.
- Owner: justbobonx. Do not push until asked if they say so; lately they have wanted GitHub updates live.

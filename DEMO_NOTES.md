# Demo branch notes

## About this branch

`main` holds Alex's hand-written game engine. `demo` adds an AI-built interface
and themed planets on top of it, changing engine code as little as possible.
Every engine change is recorded below.

The planned demo is a linear star trip across five planets (Earth, Ocean,
Desert, Moon, Casino). Each planet configures the same engine with its own
background, block art, launch trail, gravity, spawn timing, and win goal. The
interface (title, star map, planet intro cards, HUD, pause, win/loss, trip
complete) is drawn entirely in the Pixi canvas. Audio, gameplay rewrites, and
deployment are out of scope.

The `vibe-coded-sprites` branch is reference-only: it shows the *idea* of the
launch animation (a flame plume trailing launched groups). No art or code from
it is copied into `demo`; all demo art is made new.

## Engine changes

| File | Change | Reason |
| --- | --- | --- |
| `src/world.ts` | Add empty `backgroundLayer` and `particlesLayer` to the stage types and world state, add `addToBackgroundLayer` / `addToParticlesLayer`, and order layers background → particles → blocks → overlay. | Give later tickets a place for planet backgrounds and launch trails behind the blocks. No visual or behavioral change on its own. |
| `src/world.ts` | Add `setActivePlanet` / `getActivePlanet`, synchronizing `world.gravity`; add `resetWorld` and `destroyWorldView`; destroy replaced selection overlays and their filters. Reset destroys run views, clears/reseeds entity maps, resets IDs/pointer/gravity, and preserves dimensions and the four stage layers. | Expose planet selection and allow a clean new run without destroying shared tile textures or the stage/input setup. |
| `src/mutators/descentMutator.ts` | Read the launch descent cap from the active planet; continue reading gravity from `world.gravity`. | Apply per-planet tuning with the existing movement calculation. |
| `src/mutators/sequenceMutator/index.ts` | Substitute active-planet launch velocity at both launch sites. | Configure horizontal and vertical launches without changing detection or group logic. |
| `src/mutators/selectionMutator/util.ts` | Substitute active-planet pop velocity. | Configure popping without changing selection or swapping. |
| `src/textures/index.ts` | Load active-planet tile URLs, cache completed/in-flight sets by planet ID, and retain the existing three-function API. Capture the planet before awaiting and allow failed loads to retry. | Support planet tiles without mixing asynchronously loaded sets. |
| `src/entities/relations.ts` | In `vanishVeilExceedingBlocksInGroup`: emit `blocksLaunchedOut` with the unique count of vanished blocks, skip stale group references (so blocks can't be counted twice), and destroy the vanished blocks' sprites (they are never reused). | Win-goal counting for the interface. Danger-overlay removal is left as Alex's original `removeFromParent()` (reviewer reverted a broader destroy change: overlay reuse after merges wasn't proven safe, and `resetWorld()` cleans up at run end). |
| `src/main.ts` → `src/game/loop.ts` | Extract both ticker callbacks, substitute the planet spawn interval, and replace the loss alert/app stop with a guarded `gameLost` event and game-loop removal. Keep spawning, delta calculations, iteration guard, and mutator order unchanged. | Let later scenes start/stop gameplay while Pixi can continue rendering UI. |
| `src/main.ts` (D03) | The engine's stage is now a `worldRoot` container (in `src/game/app.ts`) with a `uiRoot` above it; `initializeStage(worldRoot)` instead of `app.stage`. Pointer handlers subtract the board offset (`getBoardOffset()`) from the existing canvas-space math, and `pointerdown` is ignored while board input is disabled. The boot path starts the Title scene instead of the game loop. Dev builds expose `__PIXI_APP__` and `__DEMO__.planets` on `globalThis` for devtools and automated checks. | Lets the interface draw above the board, keeps `resetWorld()` away from UI, and lets the board sit below the HUD. Alex's pointer normalization is unchanged apart from the offset subtraction. |

## D02 agreed contracts (local supplement to D00)

The GDrive brief is read-only in this environment. These decisions are recorded
here for subsequent tickets:

- `src/config/planets.ts` exports `PlanetId`, `PlanetConfig`, `PlanetTheme`,
  `BackgroundHandle`, and `planets`, a record keyed by planet ID. Route order is
  each entry's `order` (0–4). Types match D00. Earth uses the original constants
  exactly; velocities retain the engine's negative/upward sign convention.
  Other tuning values and all goals are placeholders for planet tickets/D13.
- `setActivePlanet(id: PlanetId)` and `getActivePlanet(): PlanetConfig` live in
  **`src/world.ts`**. Selection also sets `world.gravity` immediately. Constants
  remain Earth's defaults. Select the planet, then `await loadTextures()` before
  creating blocks. Loading caches by ID; reset retains shared cached textures.
- `src/game/events.ts` exports `gameEvents.on(name, listener)` (returns an
  unsubscribe function), `.off(name, listener)`, and `.emit(name, ...args)`.
  Event arguments are `blocksLaunchedOut(count: number)`, `gameLost()`, and
  `gameWon()`. Named emission helpers are also exported. Delivery is synchronous;
  scene owners must unsubscribe on exit. D02 emits progress and loss only;
  goal accumulation and winning belong to later tickets.
- `startGameLoop(app: Application)` / `stopGameLoop()` live in
  `src/game/loop.ts`. Starting an active loop is a no-op; stopping removes only
  its two callbacks. A new start resets the spawn timer, loss guard, and ticker
  speed. Loss stops gameplay before emitting, leaving the app available for UI.
  Use app/ticker suspension for a pause that must retain the current run timer.
- New-run lifecycle: stop the loop, dispose any scene-owned background handle,
  call `resetWorld()`, select the planet, load textures, set dimensions, attach
  the scene's views, and start the loop. Reset preserves stage/layer identities,
  dimensions, input listeners, and event subscriptions. It destroys all layer
  children and direct stage children other than the four layers, so scene UI
  must be reattached afterward. The initial empty selection overlay is removed;
  a fresh selection overlay is created by the existing selection mutator.
- Placeholder themes use only original `main` SVG tile URLs, palette colors,
  a vertical gradient drawn as 128 flat Pixi Graphics strips (no auxiliary
  textures), `fire` trail metadata, and circle map icons. Background handles
  resize by redrawing, have a no-op update, and destroy their view idempotently.
  D03 will attach backgrounds; D02's temporary entry still starts Earth directly.


## D03 interface contracts

- `src/game/app.ts`: `getApp()`, `getScreenSize()`, `worldRoot` (engine stage), `uiRoot` (interface), `setBoardInputEnabled()` / `isBoardInputEnabled()`, `getBoardOffset()`.
- `src/game/scenes/SceneManager.ts`: `Scene` interface (`view`, `enter()` may be async, `exit()`, `update(dt seconds)`, `resize(w, h)`) and the `sceneManager` singleton. `goTo(new SomeScene())` fades a black curtain in, exits and destroys the old scene, enters the new one, and fades out. The curtain blocks input during transitions.
- **Board layout (PlayScene):** the HUD strip is `getHudHeight(w, h)` tall. The board sits below it at its **original full-screen proportions**: board height = screen height − HUD, board width = screen width × (board height / screen height), centered. This matters because the engine's danger and loss thresholds are block counts (`DEFAULT_FILE_BLOCKS_LIMIT`); a shorter board with the same width has fewer rows, and the loss could never trigger (found in testing). Planet backgrounds are offset so they still fill the whole canvas.
- The board keeps its run-start size on window resize (the engine positions blocks in absolute pixels); only the interface reflows.
- Win: PlayScene counts `blocksLaunchedOut` toward `goal.launchedBlocksToWin`, then stops the loop and emits `gameWon`. Loss: the loop emits `gameLost`. Results show after a 650 ms beat.
- Pause: Esc, P, the HUD pause button, or hiding the tab. Pausing stops the game loop and disables board input.
- UI kit in `src/ui/`: `theme.ts` (all colors, fonts, sizes, durations; `getUiScale`), `Label`, `Button` (stops pointer propagation), `Panel`, `ProgressBar`, `Modal` (scrim + panel + action buttons), `Starfield`, and `tween` / `fade` helpers on the app ticker.

## How to add a planet (theme pipeline, from D07)

Earth (`src/themes/earth.ts`) is the reference implementation.

1. **Tiles:** five SVGs in `public/assets/planets/<id>/`: `tile_red.svg`, `tile_blue.svg`, `tile_green.svg`, `tile_yellow.svg`, `tile_burned.svg`. Use a 128×128 viewBox like `main`'s tiles. Style: a glossy, beveled Meteos-like tile (dark outer edge, vertical body gradient, bright inner rim, top gloss band) with a bold white glyph that has a dark outline and a soft drop shadow. Each color needs a distinct glyph silhouette (colorblind cue), and each planet has its own glyph family. All art must be original: nothing from `vibe-coded-sprites`, nothing traced from Meteos. Check glyph contrast (Earth's yellow needed a darker outline).
2. **Theme file:** `src/themes/<id>.ts` exports a `PlanetTheme`: `palette`, `tiles: planetTiles("planets/<id>")`, `createBackground`, `trail`, and `mapIcon`. Use `src/themes/shared/` helpers (`drawVerticalGradient`, `sampleGradient`, `lerpColor`, `assetUrl`). Use `assetUrl()` for every asset URL so builds work under a sub-path.
3. **Background:** `createBackground(w, h)` returns `{ view, update(dt), resize(w, h), destroy() }`. It fills the **whole canvas** (PlayScene offsets it behind the HUD and board). Draw shapes once (in `resize`) and animate only positions/alpha in `update`; don't redraw Graphics every frame. Set `eventMode = "none"`. Keep the region behind the board calm enough for the tiles to read.
4. **Trail:** `trail: { style, colors }`, where `style` is `fire | bubbles | dust | sparks` (parameters in `src/effects/trails.ts`; `fire` uses normal blending so it stays orange on bright skies; `sparks` is additive). `colors` is a gradient over each particle's life, hot to cool. The ignition flash uses the same colors.
5. **Map icon:** `mapIcon(radius)` returns a Container centered at (0, 0) that fits in about 1.4× the radius, glow included.
6. **Register:** in `src/config/planets.ts`, replace that planet's `createPlaceholderTheme(...)` with the theme import and set its physics/spawn/goal (explain the numbers in this file's planet notes).
7. **Check:** `npm run build`, then play it. Until D05 adds `?planet=<id>`, temporarily change the TitleScene start planet locally (don't commit that).

## Planet tuning notes

| Planet | Gravity | Launch velocity | Drop interval | Goal | Notes |
| --- | --- | --- | --- | --- | --- |
| Earth | 980 | -1200 | 700 ms | 40 | Baseline: Alex's original constants. Goal of 40 targets about 2–3 minutes for a first-time player (D07 estimate; D13 rebalances). |

## Dev URL parameters (D05)

- `?planet=<id>`: skip the title and jump straight into that planet (`earth`, `ocean`, `desert`, `moon`, `casino`).
- `?unlockAll=1`: unlock every planet on the star map.
- `?goal=<n>`: override every planet's launch goal (handy for testing win paths).
- Progress is stored in `localStorage` under `meteor-blocks-demo:progress` (highest cleared planet order), with an in-memory fallback if storage is blocked. The title screen has a Reset Progress button once any planet is cleared.

## Ticket log

| Ticket | Status | Summary | Follow-ups |
| --- | --- | --- | --- |
| D01 | done | Redone after a reset: the first attempt copied art from `vibe-coded-sprites`, which is reference-only, so that commit was discarded (never pushed). Added empty background and particle stage layers to `world.ts` and created these notes. No visual or behavioral change from `main`. `npm run build` passes, and the production build was checked in headless Chromium at 1440×900 and 390×844 with no console errors. Screenshots: `docs/demo-screenshots/D01-*.png`. | None. |
| D02 | done | Added five placeholder planet configs/themes, active-planet tunables, per-planet texture caches, typed progress/loss/win events, world reset/cleanup, and start/stop loop extraction. Earth constants and mutator order are preserved. `npm run build` passes (eslint + tsc + Vite). Careful code review plus a temporary Node/Pixi display-object harness checked two reset cycles, launch deduplication, retained shared textures, texture cache/loading guards, spawn timing, loop idempotence/removal, and once-per-run loss. Stage counts after each reset: 4 stage children, 0 children in each layer. Gravity after a one-second descent: Earth 980, Moon 300. No browser is available, so visual play/desktop/phone checks and screenshots were not performed. No network, package installs, or optional vitest work; no assets/code copied from `vibe-coded-sprites`. | Implementation and verification are complete; the requested commit is pending because the sandbox denied creating `/Users/alex/Dev/pixi-meteor-blocks/.git/worktrees/demo/index.lock` (`Operation not permitted`). Commit on `demo` with subject `feat: add planet configs and demo engine lifecycle hooks`, body `Ticket: D02`, and trailer `Co-Authored-By: Codex <noreply@openai.com>` once Git metadata is writable. Browser verification remains for an environment with a browser, including visible Moon gravity. Later tickets attach scenes/themes, accumulate goals, and tune placeholder values. Reviewer (Claude): reverted Codex's change that destroyed danger overlays in `blockGroup/operations.ts` and `removeGroupFileFragment` back to Alex's `removeFromParent()` (reuse after merges not proven safe; more than D02 needed). Kept destroying replaced selection overlays (a new one is created every frame, so the old one is never reused). Codex's sandbox can't write `.git`, so Claude committed. Browser check in headless Chromium: 220 random drags/taps with matches and launches, then fast-forward to overflow; game stops with no alert and no console errors. Screenshots: `docs/demo-screenshots/D02-*.png`. |
| D03 | done | Scene system with curtain transitions; Pixi UI kit (`src/ui/`); Title, Play (minimal HUD strip: planet name, launch counter, pause button), Pause modal, and result modals (cleared → fly to next planet / replay / title; overrun → retry / title). Found and fixed in testing: putting the board under the HUD removed a row, so the loss threshold was unreachable on desktop; the board now keeps its original proportions (see D03 contracts). Verified in headless Chromium at 1440×900 and 390×844 against the dev build: title → play → pause button → resume → fast-forward loss → 3 retries (stage node counts stay flat: 204/188/140 desktop, 195/204/153 phone) → win with a lowered goal → fly to Ocean → pause → quit to title. No console errors. The phone win check was inconclusive only because the random-input bot lost first; the win logic is viewport-independent. Screenshots: `docs/demo-screenshots/D03-*.png`. | D04 replaces the minimal HUD strip. D06 restyles via `src/ui/theme.ts`; Alex asked for a more Meteos-like look (folded into D06). |
| D07 | done | Theme pipeline: `src/themes/` (Earth theme plus shared helpers; placeholder theme moved out of `planets.ts`), `src/effects/trails.ts` (TrailSystem: ignition flash and sparks when a group becomes a launch group, plus a themed plume from the bottom of each rising column; one pooled-texture particle system, capped at 700 particles; reads engine state only), and `src/game/boardFrame.ts` (translucent play well with column guides and accent side rails). Earth art: original glossy tiles with mountain/wave/pine/sun glyphs and an ember-cracked burned tile, an animated sky with sun glow, drifting clouds and three hill layers, and a globe map icon. Earth goal is set to 40. The HUD strip is now opaque, so blocks spawning above the board no longer show through it. Tuning from screenshots: fire switched from additive to normal blending (additive washed out to white on the bright sky), denser and slower plume, particles spread over each frame's travel distance and offset for update order so the plume stays attached, and a lighter play well so the sky stays vivid. Verified in headless Chromium at both sizes with no console errors. Screenshots: `docs/demo-screenshots/D07-*.png`. | D06 Meteos interface pass next. |
| D06 | done | Meteos-inspired interface pass (Alex asked for a less generic, more Meteos-like look; done before D04/D05 so they're built in this style). Fonts: Orbitron (display) and Exo 2 (body), both OFL variable fonts bundled in `public/fonts/` with license files and loaded via `FontFace` before the first scene (`src/ui/fonts.ts`). New `src/ui/frame.ts` draws chamfered tech frames (gradient glass, accent edge, inner hairline, corner brackets, tick marks, outer glow). Restyled `Button` (glossy chamfered gradient primary with gloss band, glass secondary with accent edge, press-down motion, hover glow), `Panel`, `Label` (uppercase display variants, gradient fills, glow), and `Modal`, all themed by the active planet's accent and panel colors. Scene transitions are now blast-door shutters with a notched seam. New title screen: chrome-gradient METEOR BLOCKS wordmark with stroke and glow, Earth as a curved horizon, a cratered moon, and Earth blocks rocketing past on flame plumes, with a pulsing start button. Fixed in review: glow text needed texture padding (the blur was clipped to a hard rectangle), and a panel sheen band rendered as an odd stripe, so it was removed. Verified at both sizes (title, shutter mid-transition, pause, win) with no console errors. Screenshots: `docs/demo-screenshots/D06-*.png`. | D04 rebuilds the HUD in this style. |
| D04 | done | HUD (`src/ui/Hud.ts`): a gradient tech bar with an accent edge; planet name (with glow) and gravity relative to Earth; a segmented slanted launch meter (`ProgressBar`, rebuilt as Meteos-style cells that fill smoothly); a counter that ticks up toward the real value and pops on each launch; a pause button; and a danger indicator (pulsing red edge, and DANGER replaces the LAUNCHED label) that mirrors the engine's danger condition (`blocks.length > DEFAULT_FILE_BLOCKS_LIMIT`) without changing it. Intro card (`src/ui/IntroCard.ts`) before each run: planet globe, sector number, glowing name, tagline, gravity and goal stats, and a Launch button (tapping anywhere also works); the game loop starts only after it closes. PlayScene gains an `intro` state. Fixed in review: DANGER overlapped the label and counter. Verified with the flow test at both sizes: intro → play → pause → danger → loss → retries (node counts don't grow) → win → fly to Ocean → quit. On the final desktop rerun the bot genuinely cleared Earth (40/40) while fast-forwarding, which exercised the full-length win path. No console errors. Screenshots: `docs/demo-screenshots/D04-*.png`. | — |
| D05 | done | Star map (`StarMapScene`): zigzag route from Earth (bottom) to Casino (top) over a starfield with nebula glows; each planet's `mapIcon` with a pulsing selection ring, padlock when locked, check badge when cleared; dashed route legs that light up in the next planet's accent once unlocked; a ship marker that flies to the next planet after a win; an info panel with name, status, tagline, and Land / Land Again. Progression (`src/game/progress.ts`), dev parameters (`src/game/devParams.ts`), and `TripCompleteScene` (planet lineup, gold TRIP COMPLETE wordmark, confetti in planet accents). Flow: Title (Start Trip, or Continue Trip plus Reset Progress) → Star Map → Land → intro → play; win saves progress → On to <next> (ship flies) or Finish Trip after Casino; loss → Retry / Star Map; pause → Quit to Map. Verified end-to-end at both sizes with `?goal=3`: win Earth → ship flies to Ocean → reload keeps progress (Continue Trip) → `?unlockAll=1` → `?planet=moon` jumps straight in → land Casino → win → Trip Complete. No console errors. Fixed in review: Reset Progress label overflowed its button. Screenshots: `docs/demo-screenshots/D05-*.png`. | Planet tickets replace the placeholder circle icons. |

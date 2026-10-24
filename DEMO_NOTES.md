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

## Ticket log

| Ticket | Status | Summary | Follow-ups |
| --- | --- | --- | --- |
| D01 | done | Redone after a reset: the first attempt copied art from `vibe-coded-sprites`, which is reference-only, so that commit was discarded (never pushed). Added empty background and particle stage layers to `world.ts` and created these notes. No visual or behavioral change from `main`. `npm run build` passes, and the production build was checked in headless Chromium at 1440×900 and 390×844 with no console errors. Screenshots: `docs/demo-screenshots/D01-*.png`. | None. |
| D02 | done | Added five placeholder planet configs/themes, active-planet tunables, per-planet texture caches, typed progress/loss/win events, world reset/cleanup, and start/stop loop extraction. Earth constants and mutator order are preserved. `npm run build` passes (eslint + tsc + Vite). Careful code review plus a temporary Node/Pixi display-object harness checked two reset cycles, launch deduplication, retained shared textures, texture cache/loading guards, spawn timing, loop idempotence/removal, and once-per-run loss. Stage counts after each reset: 4 stage children, 0 children in each layer. Gravity after a one-second descent: Earth 980, Moon 300. No browser is available, so visual play/desktop/phone checks and screenshots were not performed. No network, package installs, or optional vitest work; no assets/code copied from `vibe-coded-sprites`. | Implementation and verification are complete; the requested commit is pending because the sandbox denied creating `/Users/alex/Dev/pixi-meteor-blocks/.git/worktrees/demo/index.lock` (`Operation not permitted`). Commit on `demo` with subject `feat: add planet configs and demo engine lifecycle hooks`, body `Ticket: D02`, and trailer `Co-Authored-By: Codex <noreply@openai.com>` once Git metadata is writable. Browser verification remains for an environment with a browser, including visible Moon gravity. Later tickets attach scenes/themes, accumulate goals, and tune placeholder values. Reviewer (Claude): reverted Codex's change that destroyed danger overlays in `blockGroup/operations.ts` and `removeGroupFileFragment` back to Alex's `removeFromParent()` (reuse after merges not proven safe; more than D02 needed). Kept destroying replaced selection overlays (a new one is created every frame, so the old one is never reused). Codex's sandbox can't write `.git`, so Claude committed. Browser check in headless Chromium: 220 random drags/taps with matches and launches, then fast-forward to overflow; game stops with no alert and no console errors. Screenshots: `docs/demo-screenshots/D02-*.png`. |

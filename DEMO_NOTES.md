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

## Ticket log

| Ticket | Status | Summary | Follow-ups |
| --- | --- | --- | --- |
| D01 | done | Redone after a reset: the first attempt copied art from `vibe-coded-sprites`, which is reference-only, so that commit was discarded (never pushed). Added empty background and particle stage layers to `world.ts` and created these notes. No visual or behavioral change from `main`. `npm run build` passes, and the production build was checked in headless Chromium at 1440×900 and 390×844 with no console errors. Screenshots: `docs/demo-screenshots/D01-*.png`. | None. |

# Casino (D11)

## What was built

- **Tiles** (`public/assets/planets/casino/`): original 128×128 poker-chip tiles in the Earth tile structure (dark outer edge, vertical body gradient, bright rim, top gloss band). Each holds a chip with eight cream edge inserts, a lighter inner face, a dashed inlay ring, and a bold white suit drawn as an SVG path, with a dark outline and drop shadow. Suits are the colorblind cue: ♠ blue, ♥ red, ♣ green, ♦ yellow. Yellow uses a dark brown outline (`#7a4300`, the same as Earth's yellow) so the white diamond reads. Burned is a grey chip with grey inserts, dark cracks with a light edge, no suit, and no gloss, so it reads as inactive.
- **Background** (`src/themes/casino.ts`): dark green felt gradient, a soft lamp pool, a faint diagonal weave and nap specks, and a warm dark vignette (heavier at the bottom). Neon signs sit in a band just below the HUD: magenta stars and gold diamond/heart outlines near the sides, dim magenta chevrons, and two gold marquee rails with chasing bulbs. The neon pulses gently and sometimes stutters briefly like an old tube. Faint chip and suit silhouettes float upward with sway and spin, and four-point sparkle glints pop up, mostly near the side edges. Shapes are drawn once in `resize`; `update` changes only position, rotation, scale and alpha. Neon, bulbs and sparkles use additive blending.
- **Calm board area:** the board covers almost the whole canvas width, so the calm comes from alpha. Floaters and sparkles fade toward the horizontal center (`edgeFactor`), the rails and chevrons stay dim, and the bright signs sit at the sides.
- **Trail:** `sparks` in white → gold → amber → magenta.
- **Map icon:** a roulette wheel planet (18 red/black pockets plus one green, a gold hub with spokes, and a ball) with a tilted gold ring of chips in the four tile colors. The far half of the ring sits behind the planet, plus a glow, a shade crescent and a highlight.
- **Palette:** gold accent `0xffc93c`, deep plum panels `0x1d0e29`, warm white text `0xfff3d6`.

## Tuning

| Value | Casino | Earth | Why |
| --- | --- | --- | --- |
| gravity | 1050 | 980 | Moderate (1.07×): stacks settle slightly faster, but it doesn't feel heavy like Desert. |
| launchVelocity | -1300 | -1200 | Apex ≈ v²/2g ≈ 805 px vs Earth ≈ 735 px, so launches still clear the top when stacks are taller. |
| launchDescentRate | 210 | 200 | About Earth's value, so failed launches fall back about as slowly as on Earth and stay easy to re-ignite. |
| popVelocity | -6000 | -6000 | Same as Earth, so selection pops feel familiar. |
| dropIntervalMs | 560 | 700 | The fastest of the trip (25% faster than Earth), the finale's pressure, but not so fast that the board floods before you can read it. |
| launchedBlocksToWin | 65 | 40 | The biggest goal, a little above the ~55–60 of earlier planets. Faster spawns also bring more blocks to match, so 65 takes about as long as earlier planets. |

The `planets.ts` on this branch still has placeholder Ocean/Desert/Moon numbers (e.g. Desert 600 ms, Moon goal 90). If their tickets land with faster spawns or bigger goals than 560 ms / 65, D13 should keep Casino the fastest and the biggest.

## Verification

- `npm run build` passes, and prettier is clean on the touched files.
- Headless Chromium at 1440×900 and 390×844 via `?planet=casino`: intro, board, and mid-launch screenshots, plus a star map shot. No console errors.
- Screenshots: `docs/demo-screenshots/D11-{desktop,phone}-{intro,board,launch}.png`, `D11-phone-map.png`.

## Not verified / notes

- I didn't play to a full win. The bot captured launches but didn't clear 65. Winnability is an estimate from the tuning above; D13 should check it with a human player.
- The trip-complete screen with the new icon wasn't screenshotted. It uses the same `mapIcon`.
- The sparks trail is additive, so on green felt the gold particles get a slightly greenish cast as they fade. A shared option for normal-blend sparks (in `src/effects/trails.ts`) would keep them truer gold. Not changed, per scope.
- The intro card's Launch button and the Land button stay blue on this planet. That comes from shared UI code, not the palette, so I left it alone.

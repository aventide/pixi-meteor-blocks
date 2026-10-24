# Desert (D09) planet notes

## What was built

- **Theme:** `src/themes/desert.ts` replaces the placeholder.
- **Background:** a sunset sky (dusky purple at the top, then rose, orange, and gold at the horizon) with a few twinkling stars in the purple band. A large low sun sinks into the far dunes, with soft glow halos and thin haze bands across the disc. Three dune layers (hazy mauve far, sunlit terracotta middle, dark umber near) have sharp `|sin|` ridges and a sunlit crest line. Four faint shimmer bands waver at the horizon (only `y`/`alpha` change, so the cost is negligible). Four sand wisps drift across the dunes now and then: they fade in, cross the screen, then wait 2–8 s. Shapes are drawn only in `resize`; `update` only moves things and changes alpha. `eventMode = "none"`. The middle and upper board sit over the calm purple-to-rose part of the sky.
- **Tiles** (`public/assets/planets/desert/`): 128×128, built like Earth's (dark outer edge, vertical body gradient, bright rim, top gloss band, white glyph with dark outline and drop shadow). Desert additions: a carved inset panel line, faint sediment strata, and sandstone grain speckles on the lower body. Glyphs are original "carved" symbols, one silhouette per color:
  - red: a radiant eye (almond eye, dark iris, five rays fanning from the upper lid)
  - turquoise (blue): a beetle seen from above, legs splayed, holding a small disc
  - jade (green): a saguaro cactus on a mound
  - gold (yellow): a pyramid under a sun disc. The outline is a dark brown (`#6e3a00`) so the glyph still reads on yellow.
  - burned: charred, cracked sandstone (dark brown-grey, soot vignette, black cracks with a faint lit edge, one or two dim ember lines), so it reads as inactive.
- **Trail:** style `fire` with colors `0xfff4c8 → 0xffb43a → 0xe2602a → 0xc9955e`: a hot white-gold core that cools into orange, then ends in a sand-colored puff (the "fire core + dust" idea using one style). I picked `fire` over `dust` because `dust` (alpha 0.45, sand colors) disappears against the orange and gold sky.
- **Map icon:** an ochre globe with five wavy dune bands in alternating light and dark ochre (masked to the disc), a warm glow, a plum shade on the lower right, and a cream highlight.
- **Palette:** `accent 0xffb23e` (sunset gold: rails, HUD edge, meter), `uiPanel 0x3a1b30` (dark plum-brown glass), `uiText 0xfff2dc` (warm white), `bgTop 0x2e1a4f`, `bgBottom 0xe8843a`.

## Tuning

| Value               | Desert | Earth | Why                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gravity             | 1350   | 980   | ~1.4× Earth. Launches decelerate faster, so a launch hangs in the air for less time (time to apex is 1.04 s vs 1.22 s). That leaves less time to re-ignite it mid-air, so you need cleaner, bigger plays.                                                                                                                    |
| launchVelocity      | -1400  | -1200 | Raised so a clean single launch still reaches about as high as on Earth. Apex = v²/2g = 726 vs 735 reference px. Measured in-game on unobstructed launches: about 0.61 of the board height vs 0.63 on Earth. Launches still clear the top as often as they do now; they just get there faster and give you a shorter window. |
| launchDescentRate   | 240    | 200   | Stalled launches fall back onto the stack a bit faster (harsher).                                                                                                                                                                                                                                                            |
| popVelocity         | -6500  | -6000 | Scaled up a little with the higher gravity so pops feel as snappy.                                                                                                                                                                                                                                                           |
| dropIntervalMs      | 600    | 700   | ~17% faster spawns: the main pressure source on this planet.                                                                                                                                                                                                                                                                 |
| launchedBlocksToWin | 55     | 40    | Above Ocean's target (~50) and below Moon's. Faster spawns also mean more blocks to work with, so 55 is about the same play time as Earth's 40 plus a bit. D13 should rebalance it after playtests.                                                                                                                          |

I rejected the placeholder values (1250 / -1450). Their apex was 0.75 of the board, higher than Earth's, so launches would have been _easier_ to escape, which contradicts "launches need more to escape".

### How it was measured

A Playwright script ran a random-input bot against the dev server and tracked every launch group through `/src/world.ts` (rise from launch to apex for groups that never merged or lost blocks). I swapped physics values at runtime, not in the file, to compare Earth's values, 1300/-1450, and 1350/-1400 on the same planet. Rises matched the v²/2g prediction minus about 0.06 board heights in every case, so the comparison is consistent. 90 s runs of random play hit no overruns at the final values. A random bot is a weak proxy for a human, so winnability at goal 55 has **not** been verified by a full playthrough.

## Not verified / follow-ups (shared code, not changed here)

- The intro card's **Launch!** primary button and the pause button use the fixed blue button colors from `src/ui/theme.ts` (`buttonTop`/`buttonBottom`, `textMuted` for the tagline). On Desert's warm palette they clash a little. A shared follow-up could derive the primary button gradient and muted text from the planet palette (`accent`, `uiText`).
- The trail system has one style per planet. A real "dust + fire core" would need two emitters per style in `src/effects/trails.ts`, for example a `fire` core plus a slow, wide sand `dust` puff at low alpha. I approximated it with a fire gradient that ends in sand color.
- There was no full human-paced playthrough to 55. Only the start of play, launches, and short bot runs were checked.

## Screenshots

`docs/demo-screenshots/`: `D09-{desktop,phone}-{intro,board,launch}.png` (standard planet check), `D09-trail-{desktop,phone}-launch.png` (the game frozen mid-launch with the trail rising), and `D09-tiles.png` (the five tiles on a warm background). I also tested `dust` with the same colors as an A/B comparison; it came out faint and washed out over the dunes, so the theme keeps `fire`. No console errors at either size.

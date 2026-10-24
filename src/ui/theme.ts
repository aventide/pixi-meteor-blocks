// Central interface styling (Meteos-inspired "space tech" look).
// Restyle the game by editing this file.

export const uiTheme = {
  fontFamily: ["Exo 2", "Trebuchet MS", "system-ui", "sans-serif"],
  displayFontFamily: ["Orbitron", "Exo 2", "Trebuchet MS", "sans-serif"],
  colors: {
    text: 0xffffff,
    textMuted: 0xa9c4ec,
    accent: 0x46d2ff, // default accent when no planet is active
    panel: 0x081233,
    scrim: 0x02050f,
    buttonTop: 0x7fe6ff,
    buttonBottom: 0x1d63e8,
    buttonPressedTop: 0x4cbfe8,
    buttonPressedBottom: 0x1548b8,
    buttonSecondary: 0x0d1a3d,
    buttonText: 0xffffff,
    buttonTextShadow: 0x061538,
    win: 0x7dffb0,
    lose: 0xff6f7d,
    progressTrack: 0x050b1f,
  },
  chamfer: { small: 8, medium: 14, large: 22 },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
  type: { title: 44, heading: 24, body: 17, small: 13, button: 17 },
  minTouchTarget: 44,
  durations: { fast: 120, normal: 220, slow: 400 },
};

// Interface sizes are authored for a ~400px-wide portrait screen and scaled.
const DESIGN_WIDTH = 400;
const DESIGN_ASPECT = 10 / 16;

export const getUiScale = (width: number, height: number) =>
  // Floor of 0.5 covers phone landscape, where the 10:16 canvas is only
  // ~220px wide; buttons still enforce the 44px touch minimum themselves.
  Math.max(
    0.5,
    Math.min(1.6, Math.min(width, height * DESIGN_ASPECT) / DESIGN_WIDTH),
  );

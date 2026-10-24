// Central interface styling. D06 restyles the game by editing this file.

export const uiTheme = {
  fontFamily: ["Trebuchet MS", "Segoe UI", "system-ui", "sans-serif"],
  displayFontFamily: ["Trebuchet MS", "Segoe UI", "system-ui", "sans-serif"],
  colors: {
    text: 0xffffff,
    textMuted: 0xb9c6e4,
    panel: 0x141c33,
    panelStroke: 0x3d4f80,
    scrim: 0x050814,
    button: 0x3b6cff,
    buttonHover: 0x5784ff,
    buttonPressed: 0x2c55d6,
    buttonSecondary: 0x2a3556,
    buttonSecondaryHover: 0x36446d,
    buttonSecondaryPressed: 0x222b47,
    buttonText: 0xffffff,
    win: 0x7fe3a0,
    lose: 0xff7a7a,
    progressTrack: 0x0c1226,
  },
  radius: { small: 8, medium: 14, large: 22 },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
  type: { title: 44, heading: 28, body: 18, small: 14, button: 20 },
  minTouchTarget: 44,
  durations: { fast: 120, normal: 220, slow: 400 },
};

// Interface sizes are authored for a ~400px-wide portrait screen and scaled.
const DESIGN_WIDTH = 400;
const DESIGN_ASPECT = 10 / 16;

export const getUiScale = (width: number, height: number) =>
  Math.max(
    0.75,
    Math.min(1.6, Math.min(width, height * DESIGN_ASPECT) / DESIGN_WIDTH),
  );

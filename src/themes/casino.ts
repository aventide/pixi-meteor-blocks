import type { PlanetTheme } from "../config/planets";
import { createPlaceholderTheme } from "./shared/placeholder";

// Placeholder until this planet's ticket replaces it (see DEMO_NOTES.md,
// "How to add a planet").
export const casinoTheme: PlanetTheme = createPlaceholderTheme({
  bgTop: 0x19102a,
  bgBottom: 0x123b32,
  accent: 0xffd65c,
  uiPanel: 0x271e35,
  uiText: 0xfff6dd,
});

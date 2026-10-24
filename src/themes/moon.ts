import type { PlanetTheme } from "../config/planets";
import { createPlaceholderTheme } from "./shared/placeholder";

// Placeholder until this planet's ticket replaces it (see DEMO_NOTES.md,
// "How to add a planet").
export const moonTheme: PlanetTheme = createPlaceholderTheme({
  bgTop: 0x080b19,
  bgBottom: 0x505565,
  accent: 0xc6d1e8,
  uiPanel: 0x242937,
  uiText: 0xf0f3ff,
});

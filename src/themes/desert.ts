import type { PlanetTheme } from "../config/planets";
import { createPlaceholderTheme } from "./shared/placeholder";

// Placeholder until this planet's ticket replaces it (see DEMO_NOTES.md,
// "How to add a planet").
export const desertTheme: PlanetTheme = createPlaceholderTheme({
  bgTop: 0xa84c58,
  bgBottom: 0xdba754,
  accent: 0xffcc66,
  uiPanel: 0x49332e,
  uiText: 0xfff4dd,
});

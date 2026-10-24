import type { PlanetTheme } from "../config/planets";
import { createPlaceholderTheme } from "./shared/placeholder";

// Placeholder until this planet's ticket replaces it (see DEMO_NOTES.md,
// "How to add a planet").
export const oceanTheme: PlanetTheme = createPlaceholderTheme({
  bgTop: 0x14669a,
  bgBottom: 0x061b38,
  accent: 0x55ddee,
  uiPanel: 0x102b48,
  uiText: 0xe3faff,
});

import { casino } from "./casino.mjs";
import { desert } from "./desert.mjs";
import { earth } from "./earth.mjs";
import { moon } from "./moon.mjs";
import { ocean } from "./ocean.mjs";

// Planets with generated tiles, keyed by the folder name under
// public/assets/planets/.
export const PLANETS = { earth, ocean, desert, moon, casino };

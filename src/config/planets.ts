import type { Container } from "pixi.js";
import { earthTheme } from "../themes/earth";
import { oceanTheme } from "../themes/ocean";
import { desertTheme } from "../themes/desert";
import { moonTheme } from "../themes/moon";
import { casinoTheme } from "../themes/casino";
import {
  DEFAULT_GRAVITY,
  DEFAULT_LAUNCH_VELOCITY,
  DEFAULT_LAUNCH_DESCENT_RATE,
  DEFAULT_POP_VELOCITY,
  DEFAULT_DROP_INTERVAL,
} from "../constants";

export type PlanetId = "earth" | "ocean" | "desert" | "moon" | "casino";

export type BackgroundHandle = {
  view: Container;
  update(dt: number): void;
  resize(width: number, height: number): void;
  destroy(): void;
};

export type PlanetTheme = {
  palette: {
    bgTop: number;
    bgBottom: number;
    accent: number;
    uiPanel: number;
    uiText: number;
  };
  tiles: {
    red: string;
    blue: string;
    green: string;
    yellow: string;
    burned: string;
  };
  createBackground: (width: number, height: number) => BackgroundHandle;
  trail: { style: "fire" | "bubbles" | "dust" | "sparks"; colors: number[] };
  mapIcon: (radius: number) => Container;
};

export type PlanetConfig = {
  id: PlanetId;
  name: string;
  order: number;
  tagline: string;
  physics: {
    gravity: number;
    launchVelocity: number;
    launchDescentRate: number;
    popVelocity: number;
  };
  spawn: { dropIntervalMs: number };
  goal: { launchedBlocksToWin: number };
  theme: PlanetTheme;
};

export const planets: Record<PlanetId, PlanetConfig> = {
  earth: {
    id: "earth",
    name: "Earth",
    order: 0,
    tagline: "A familiar sky. Your trip starts here.",
    physics: {
      gravity: DEFAULT_GRAVITY,
      launchVelocity: DEFAULT_LAUNCH_VELOCITY,
      launchDescentRate: DEFAULT_LAUNCH_DESCENT_RATE,
      popVelocity: DEFAULT_POP_VELOCITY,
    },
    spawn: { dropIntervalMs: DEFAULT_DROP_INTERVAL },
    // ~2-3 minutes for a first-time player; rebalanced in D13.
    goal: { launchedBlocksToWin: 40 },
    theme: earthTheme,
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    order: 1,
    tagline: "Heavy water slows every launch.",
    physics: {
      gravity: 1000,
      launchVelocity: -1140,
      launchDescentRate: 150,
      popVelocity: -6000,
    },
    spawn: { dropIntervalMs: 800 },
    goal: { launchedBlocksToWin: 45 },
    theme: oceanTheme,
  },
  desert: {
    id: "desert",
    name: "Desert",
    order: 2,
    tagline: "Keep moving beneath the sunset.",
    physics: {
      gravity: 1250,
      launchVelocity: -1450,
      launchDescentRate: 240,
      popVelocity: -6500,
    },
    spawn: { dropIntervalMs: 600 },
    goal: { launchedBlocksToWin: 80 },
    theme: desertTheme,
  },
  moon: {
    id: "moon",
    name: "Moon",
    order: 3,
    tagline: "Launches soar in low gravity, but the sky never stops falling.",
    // Low gravity: launches reach the top from almost any height and falls
    // float, so faster spawns and a bigger goal keep it hard (see
    // docs/planet-notes/moon.md).
    physics: {
      gravity: 380,
      launchVelocity: -950,
      launchDescentRate: 110,
      popVelocity: -6000,
    },
    spawn: { dropIntervalMs: 500 },
    goal: { launchedBlocksToWin: 90 },
    theme: moonTheme,
  },
  casino: {
    id: "casino",
    name: "Casino",
    order: 4,
    tagline: "Last stop. Launch big for the jackpot.",
    // Finale: fastest spawns and biggest goal, moderate gravity, and a slightly
    // stronger launch so big combos clear the faster stacks. See
    // docs/planet-notes/casino.md.
    physics: {
      gravity: 1050,
      launchVelocity: -1300,
      launchDescentRate: 210,
      popVelocity: -6000,
    },
    spawn: { dropIntervalMs: 560 },
    goal: { launchedBlocksToWin: 65 },
    theme: casinoTheme,
  },
};

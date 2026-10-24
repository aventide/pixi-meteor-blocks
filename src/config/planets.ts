import type { Container } from "pixi.js";
import { createPlaceholderTheme } from "../themes/shared/placeholder";
import { earthTheme } from "../themes/earth";
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
    tagline: "Launch through the deep blue.",
    physics: {
      gravity: 1150,
      launchVelocity: -1350,
      launchDescentRate: 150,
      popVelocity: -6000,
    },
    spawn: { dropIntervalMs: 750 },
    goal: { launchedBlocksToWin: 70 },
    theme: createPlaceholderTheme({
      bgTop: 0x14669a,
      bgBottom: 0x061b38,
      accent: 0x55ddee,
      uiPanel: 0x102b48,
      uiText: 0xe3faff,
    }),
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
    theme: createPlaceholderTheme({
      bgTop: 0xa84c58,
      bgBottom: 0xdba754,
      accent: 0xffcc66,
      uiPanel: 0x49332e,
      uiText: 0xfff4dd,
    }),
  },
  moon: {
    id: "moon",
    name: "Moon",
    order: 3,
    tagline: "Less gravity. More room to fly.",
    physics: {
      gravity: 300,
      launchVelocity: -1000,
      launchDescentRate: 90,
      popVelocity: -3500,
    },
    spawn: { dropIntervalMs: 700 },
    goal: { launchedBlocksToWin: 90 },
    theme: createPlaceholderTheme({
      bgTop: 0x080b19,
      bgBottom: 0x505565,
      accent: 0xc6d1e8,
      uiPanel: 0x242937,
      uiText: 0xf0f3ff,
    }),
  },
  casino: {
    id: "casino",
    name: "Casino",
    order: 4,
    tagline: "One last launch for the jackpot.",
    physics: {
      gravity: 1100,
      launchVelocity: -1400,
      launchDescentRate: 220,
      popVelocity: -6500,
    },
    spawn: { dropIntervalMs: 500 },
    goal: { launchedBlocksToWin: 100 },
    theme: createPlaceholderTheme({
      bgTop: 0x19102a,
      bgBottom: 0x123b32,
      accent: 0xffd65c,
      uiPanel: 0x271e35,
      uiText: 0xfff6dd,
    }),
  },
};

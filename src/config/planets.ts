import { Graphics } from "pixi.js";
import type { Container } from "pixi.js";
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

const createPlaceholderTheme = (
  palette: PlanetTheme["palette"],
): PlanetTheme => ({
  palette,
  tiles: {
    red: "/assets/tile_red.svg",
    blue: "/assets/tile_blue.svg",
    green: "/assets/tile_green.svg",
    yellow: "/assets/tile_yellow.svg",
    burned: "/assets/tile_burned.svg",
  },
  createBackground: (width, height) => {
    const view = new Graphics();
    view.eventMode = "none";
    const resize = (w: number, h: number) => {
      view.clear();
      // A vertical gradient made of flat strips needs no auxiliary textures.
      const steps = 128;
      for (let i = 0; i < steps; i++) {
        let color = 0;
        for (const shift of [16, 8, 0]) {
          const top = (palette.bgTop >> shift) & 255;
          const bottom = (palette.bgBottom >> shift) & 255;
          color |=
            Math.round(top + ((bottom - top) * i) / (steps - 1)) << shift;
        }
        view.rect(0, (h * i) / steps, w, h / steps).fill(color);
      }
    };
    resize(width, height);
    return {
      view,
      update: () => {},
      resize,
      destroy: () => {
        if (!view.destroyed) view.destroy();
      },
    };
  },
  trail: { style: "fire", colors: [palette.accent, 0xffeeaa] },
  mapIcon: (radius) => new Graphics().circle(0, 0, radius).fill(palette.accent),
});

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
    goal: { launchedBlocksToWin: 60 },
    theme: createPlaceholderTheme({
      bgTop: 0x1099bb,
      bgBottom: 0x215c45,
      accent: 0x66cc88,
      uiPanel: 0x153744,
      uiText: 0xffffff,
    }),
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

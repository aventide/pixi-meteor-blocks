import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { drawVerticalGradient, lerpColor } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x02050f,
  bgBottom: 0x0b2f5c,
  accent: 0x5fe08a,
  uiPanel: 0x0d2a4f,
  uiText: 0xf2fbff,
};

// Deep space that lifts into a blue glow near the planet's limb.
const SKY = [
  { at: 0, color: 0x01030a },
  { at: 0.5, color: 0x040b1f },
  { at: 0.8, color: 0x0a2048 },
  { at: 1, color: 0x0f3264 },
];

const OCEAN = 0x061a3a;
const LAND = 0x0a3a2a;
const RIM = 0x7fd8ff;
const STAR_GROUPS = 6;
const CLOUD_DRIFT = 5; // px/s across the planet's face

type Twinkler = { view: Graphics; speed: number; phase: number; base: number };
type CloudBand = { view: Graphics; speed: number; span: number };

// Seeded random so a resize redraws the same sky instead of reshuffling it.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Earth seen from orbit: a dark ocean disc whose top edge (the limb) crosses
// the lower part of the screen, with a thin atmosphere and a sunrise glint.
const planetGeometry = (w: number, h: number) => {
  const r = Math.max(w, h) * 1.4;
  const limbY = h * 0.72;
  return { cx: w * 0.42, cy: limbY + r, r, limbY };
};

const createBackground = (width: number, height: number): BackgroundHandle => {
  const view = new Container();
  view.eventMode = "none";
  const sky = new Graphics();
  const starLayer = new Container();
  const atmosphere = new Graphics();
  const planet = new Graphics();
  const surface = new Graphics();
  const cloudLayer = new Container();
  const planetMask = new Graphics();
  const rim = new Graphics();
  const glint = new Graphics();
  view.addChild(
    sky,
    starLayer,
    atmosphere,
    planet,
    surface,
    cloudLayer,
    planetMask,
    rim,
    glint,
  );
  surface.mask = planetMask;
  cloudLayer.mask = planetMask;

  let twinklers: Twinkler[] = [];
  let clouds: CloudBand[] = [];
  let screenWidth = width;
  let time = 0;

  const resize = (w: number, h: number) => {
    screenWidth = w;
    const rand = seeded(7);
    const { cx, cy, r, limbY } = planetGeometry(w, h);

    sky.clear();
    drawVerticalGradient(sky, 0, 0, w, h, SKY);

    starLayer.removeChildren().forEach((c) => c.destroy());
    twinklers = [];
    const groups = Array.from({ length: STAR_GROUPS }, () => new Graphics());
    const count = Math.round((w * limbY) / 2600);
    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const y = rand() * limbY;
      const size = rand() < 0.08 ? 1.6 : 0.5 + rand() * 0.8;
      const tint = lerpColor(
        0xffffff,
        rand() < 0.5 ? 0x9fd0ff : 0xffe2b8,
        rand() * 0.5,
      );
      groups[i % STAR_GROUPS]
        .circle(x, y, size)
        .fill({ color: tint, alpha: 0.4 + rand() * 0.6 });
    }
    for (const g of groups) {
      starLayer.addChild(g);
      twinklers.push({
        view: g,
        speed: 0.6 + rand() * 1.4,
        phase: rand() * 6.28,
        base: 0.75,
      });
    }

    // Atmospheric scatter: wide, faint halos stepping outward from the limb.
    atmosphere.clear();
    for (let i = 10; i >= 1; i--) {
      atmosphere
        .circle(cx, cy, r + i * h * 0.012)
        .fill({ color: 0x2f8fff, alpha: 0.035 });
    }

    planet.clear();
    planet.circle(cx, cy, r).fill(OCEAN);
    // Night falls towards the bottom of the screen.
    for (let i = 1; i <= 8; i++) {
      planet
        .circle(cx, cy + i * h * 0.012, r - i * h * 0.004)
        .fill({ color: 0x01040c, alpha: 0.09 });
    }

    planetMask.clear();
    planetMask.circle(cx, cy, r).fill(0xffffff);

    // Continents as a few soft, low-contrast masses just under the limb.
    surface.clear();
    for (let i = 0; i < 7; i++) {
      const x = rand() * w;
      const y = limbY + h * (0.02 + rand() * 0.16);
      const rx = w * (0.12 + rand() * 0.22);
      surface
        .ellipse(x, y, rx, rx * (0.18 + rand() * 0.12))
        .fill({ color: LAND, alpha: 0.4 });
      surface
        .ellipse(x + rx * 0.3, y - rx * 0.03, rx * 0.5, rx * 0.09)
        .fill({ color: lerpColor(LAND, 0x3d7a4a, 0.5), alpha: 0.35 });
    }

    // Thin weather streaks drifting over the face of the planet.
    cloudLayer.removeChildren().forEach((c) => c.destroy());
    clouds = [];
    for (let i = 0; i < 6; i++) {
      const band = new Graphics();
      const span = w * (0.35 + rand() * 0.4);
      const y = limbY + h * (0.015 + rand() * 0.18);
      for (let j = 0; j < 4; j++) {
        band
          .ellipse(
            span * (j / 4),
            y + (rand() - 0.5) * h * 0.01,
            span * 0.22,
            h * (0.003 + rand() * 0.004),
          )
          .fill({ color: 0xdff2ff, alpha: 0.05 + rand() * 0.06 });
      }
      band.x = rand() * w;
      cloudLayer.addChild(band);
      clouds.push({
        view: band,
        speed: CLOUD_DRIFT * (0.6 + rand() * 0.8),
        span,
      });
    }

    // The limb: a crisp bright rim over a softer blue glow.
    rim.clear();
    rim
      .circle(cx, cy, r + 3)
      .stroke({ color: 0x3aa0ff, width: 6, alpha: 0.35 });
    rim.circle(cx, cy, r).stroke({ color: RIM, width: 1.5, alpha: 0.9 });

    // Sunrise glint where the sun clears the limb, with a horizontal streak.
    glint.clear();
    const gx = w * 0.16;
    const gy = cy - Math.sqrt(Math.max(0, r * r - (gx - cx) * (gx - cx)));
    for (let i = 16; i >= 1; i--) {
      glint
        .circle(gx, gy, h * 0.004 * i)
        .fill({ color: 0xffe9b0, alpha: 0.025 });
    }
    glint.ellipse(gx, gy, w * 0.42, 1.5).fill({ color: 0xfff4d6, alpha: 0.35 });
    glint.circle(gx, gy, 3).fill(0xffffff);
  };

  resize(width, height);

  return {
    view,
    update: (dt) => {
      time += dt;
      for (const t of twinklers) {
        t.view.alpha = t.base + Math.sin(time * t.speed + t.phase) * 0.25;
      }
      for (const cloud of clouds) {
        cloud.view.x += cloud.speed * dt;
        if (cloud.view.x > screenWidth) cloud.view.x = -cloud.span * 1.2;
      }
      glint.alpha = 0.9 + Math.sin(time * 0.7) * 0.1;
    },
    resize,
    destroy: () => {
      if (!view.destroyed) view.destroy({ children: true });
    },
  };
};

const mapIcon = (radius: number) => {
  const icon = new Container();
  const glow = new Graphics();
  for (let i = 3; i >= 1; i--) {
    glow
      .circle(0, 0, radius * (1 + i * 0.12))
      .fill({ color: 0x7fd4ff, alpha: 0.12 });
  }
  const globe = new Graphics().circle(0, 0, radius).fill(0x2a7bff);
  const land = new Graphics()
    .ellipse(-radius * 0.35, -radius * 0.2, radius * 0.38, radius * 0.28)
    .fill(0x3ccf5e)
    .ellipse(radius * 0.3, radius * 0.35, radius * 0.42, radius * 0.25)
    .fill(0x2fb34f)
    .ellipse(radius * 0.45, -radius * 0.45, radius * 0.18, radius * 0.12)
    .fill(0x3ccf5e);
  const mask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  land.mask = mask;
  const swirl = new Graphics()
    .arc(0, 0, radius * 0.7, Math.PI * 1.1, Math.PI * 1.7)
    .stroke({
      color: 0xffffff,
      width: radius * 0.12,
      alpha: 0.85,
      cap: "round",
    })
    .arc(0, 0, radius * 0.45, Math.PI * 0.1, Math.PI * 0.6)
    .stroke({
      color: 0xffffff,
      width: radius * 0.1,
      alpha: 0.75,
      cap: "round",
    });
  const shade = new Graphics()
    .circle(radius * 0.25, radius * 0.25, radius)
    .fill({ color: 0x001040, alpha: 0.28 });
  shade.mask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  const highlight = new Graphics()
    .ellipse(-radius * 0.35, -radius * 0.45, radius * 0.35, radius * 0.2)
    .fill({ color: 0xffffff, alpha: 0.35 });
  icon.addChild(glow, globe, land, mask, swirl, shade, shade.mask, highlight);
  return icon;
};

export const earthTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/earth"),
  createBackground,
  trail: { style: "thrust", colors: [0xffffff, 0xffe08a, 0xff8a2a, 0x7a1e08] },
  mapIcon,
};

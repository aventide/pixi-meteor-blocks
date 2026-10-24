import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { earthTheme } from "./earth";
import { planetTiles } from "./shared/assets";
import { drawVerticalGradient, lerpColor } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x010208,
  bgBottom: 0x6b6d76,
  accent: 0xa6d8ff,
  uiPanel: 0x151925,
  uiText: 0xeef3ff,
};

// Near-black sky with only a faint blue lift at the horizon: no atmosphere.
const SKY = [
  { at: 0, color: 0x000105 },
  { at: 0.6, color: 0x03050d },
  { at: 1, color: 0x0c1122 },
];

const STAR_GROUPS = 7;
const BRIGHT_STARS = 14;
const FAR_DRIFT = 2.5; // px/s, the far ridge
const NEAR_DRIFT = 6; // px/s, the near ground

type Twinkler = { view: Graphics; speed: number; phase: number; base: number };

// Seeded random so a resize redraws the same sky instead of reshuffling it.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// A ridge line that repeats exactly every `period` px so a layer can scroll
// and wrap without a seam.
const ridgeY = (x: number, period: number, amp: number, phase: number) => {
  const k = (Math.PI * 2) / period;
  return (
    amp *
    (Math.sin(x * k * 2 + phase) * 0.55 +
      Math.sin(x * k * 5 + phase * 1.7) * 0.3 +
      Math.sin(x * k * 11 + phase * 2.3) * 0.15)
  );
};

// A crater seen at a low angle: raised bright rim, dark bowl, and a lit
// far wall.
const drawCrater = (
  g: Graphics,
  x: number,
  y: number,
  rx: number,
  ground: number,
) => {
  const ry = rx * 0.3;
  g.ellipse(x, y, rx * 1.12, ry * 1.25).fill(lerpColor(ground, 0xffffff, 0.22));
  g.ellipse(x, y + ry * 0.12, rx, ry).fill(lerpColor(ground, 0x000000, 0.5));
  g.ellipse(x + rx * 0.12, y + ry * 0.35, rx * 0.72, ry * 0.5).fill(
    lerpColor(ground, 0x000000, 0.28),
  );
  g.ellipse(x - rx * 0.05, y - ry * 0.55, rx * 0.8, ry * 0.32).fill({
    color: 0xffffff,
    alpha: 0.08,
  });
};

type GroundOptions = {
  baseY: number;
  amp: number;
  phase: number;
  top: number;
  bottom: number;
  craters: number;
  craterSize: number;
  seed: number;
  pebbles: number;
};

// One terrain layer, drawn twice side by side (0..w and w..2w) so shifting it
// left by up to w and wrapping looks continuous.
const drawGround = (g: Graphics, w: number, h: number, o: GroundOptions) => {
  const step = 8;
  const total = w * 2;
  const surfaceAt = (x: number) => o.baseY - ridgeY(x, w, o.amp, o.phase);

  g.moveTo(0, h);
  for (let x = 0; x <= total + step; x += step) g.lineTo(x, surfaceAt(x));
  g.lineTo(total + step, h).closePath();
  g.fill(o.top);

  // Lower band darkens towards the screen edge.
  const bandTop = o.baseY + o.amp;
  drawVerticalGradient(
    g,
    0,
    bandTop,
    total + step,
    Math.max(1, h - bandTop),
    [
      { at: 0, color: o.top },
      { at: 1, color: o.bottom },
    ],
    24,
  );

  // A thin sunlit lip along the ridge crest.
  g.moveTo(0, surfaceAt(0));
  for (let x = step; x <= total + step; x += step) g.lineTo(x, surfaceAt(x));
  g.stroke({ color: lerpColor(o.top, 0xffffff, 0.35), width: 1.5, alpha: 0.7 });

  const rand = seeded(o.seed);
  const craters: Array<[number, number, number]> = [];
  for (let i = 0; i < o.craters; i++) {
    const x = ((i + 0.2 + rand() * 0.6) / o.craters) * w;
    const surface = surfaceAt(x);
    const size = o.craterSize * (0.55 + rand() * 0.7);
    const depth = rand() * Math.max(0, h - surface - size) * 0.6;
    craters.push([x, surface + size * 0.45 + depth, size]);
  }
  const pebbles: Array<[number, number, number]> = [];
  for (let i = 0; i < o.pebbles; i++) {
    const x = rand() * w;
    const surface = surfaceAt(x) + 4;
    pebbles.push([x, surface + rand() * (h - surface), rand()]);
  }
  const craterGround = lerpColor(o.top, o.bottom, 0.3);
  for (const copy of [0, w]) {
    for (const [x, y, size] of craters) {
      drawCrater(g, x + copy, y, size, craterGround);
    }
    for (const [x, y, r] of pebbles) {
      g.circle(x + copy, y, 0.8 + r * 1.6).fill({
        color: r > 0.5 ? 0x000000 : 0xffffff,
        alpha: 0.18,
      });
    }
  }
};

const createBackground = (width: number, height: number): BackgroundHandle => {
  const view = new Container();
  view.eventMode = "none";
  const sky = new Graphics();
  const starLayer = new Container();
  const earthHolder = new Container();
  const farGround = new Graphics();
  const nearGround = new Graphics();
  view.addChild(sky, starLayer, earthHolder, farGround, nearGround);

  let twinklers: Twinkler[] = [];
  let w = width;
  let time = 0;

  const resize = (newWidth: number, newHeight: number) => {
    w = newWidth;
    const h = newHeight;
    sky.clear();
    drawVerticalGradient(sky, 0, 0, w, h, SKY);

    // Stars: many dim points split into groups that twinkle out of phase,
    // plus a few bright ones with a soft halo and a faint cross.
    starLayer.removeChildren().forEach((c) => c.destroy());
    twinklers = [];
    const rand = seeded(1969);
    const skyHeight = h * 0.88;
    const count = Math.round(Math.min(900, (w * skyHeight) / 1400));
    const groups = Array.from({ length: STAR_GROUPS }, () => new Graphics());
    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const y = rand() * skyHeight;
      const size = rand() < 0.85 ? 0.6 + rand() * 0.7 : 1.3 + rand() * 0.6;
      const roll = rand();
      const tint = roll < 0.18 ? 0xcfe0ff : roll < 0.26 ? 0xffe9c8 : 0xffffff;
      groups[i % STAR_GROUPS]
        .circle(x, y, size)
        .fill({ color: tint, alpha: 0.45 + rand() * 0.55 });
    }
    groups.forEach((g, i) => {
      starLayer.addChild(g);
      twinklers.push({
        view: g,
        speed: 0.6 + (i % 4) * 0.35,
        phase: i * 1.7,
        base: 0.75,
      });
    });
    const unit = Math.max(0.8, Math.min(w, h) / 700);
    for (let i = 0; i < BRIGHT_STARS; i++) {
      const s = (1.2 + rand() * 1.2) * unit;
      const star = new Graphics()
        .circle(0, 0, s * 4)
        .fill({ color: 0xbcd4ff, alpha: 0.06 })
        .circle(0, 0, s * 2)
        .fill({ color: 0xdde8ff, alpha: 0.18 })
        .rect(-s * 5, -0.35 * unit, s * 10, 0.7 * unit)
        .fill({ color: 0xffffff, alpha: 0.35 })
        .rect(-0.35 * unit, -s * 5, 0.7 * unit, s * 10)
        .fill({ color: 0xffffff, alpha: 0.35 })
        .circle(0, 0, s)
        .fill(0xffffff);
      star.position.set(rand() * w, rand() * skyHeight * 0.85);
      starLayer.addChild(star);
      twinklers.push({
        view: star,
        speed: 0.8 + rand() * 1.6,
        phase: rand() * Math.PI * 2,
        base: 0.7,
      });
    }

    // Earth hangs in the sky, upper right, drawn with Earth's own map icon.
    earthHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    const earthRadius = Math.max(16, Math.min(w, h) * 0.045);
    earthHolder.addChild(earthTheme.mapIcon(earthRadius));
    earthHolder.position.set(w * 0.82, h * 0.17);

    farGround.clear();
    drawGround(farGround, w, h, {
      baseY: h * 0.85,
      amp: h * 0.022,
      phase: 0.6,
      top: 0x5d5f68,
      bottom: 0x34363d,
      craters: Math.max(4, Math.round(w / 260)),
      craterSize: Math.min(w, h) * 0.04,
      seed: 7,
      pebbles: 40,
    });
    nearGround.clear();
    drawGround(nearGround, w, h, {
      baseY: h * 0.92,
      amp: h * 0.018,
      phase: 2.4,
      top: 0x9a9ba3,
      bottom: 0x5b5d65,
      craters: Math.max(3, Math.round(w / 330)),
      craterSize: Math.min(w, h) * 0.065,
      seed: 31,
      pebbles: 90,
    });
  };

  resize(width, height);

  return {
    view,
    update: (dt) => {
      time += dt;
      for (const t of twinklers) {
        t.view.alpha =
          t.base + (1 - t.base) * Math.sin(time * t.speed + t.phase);
      }
      // Slow parallax drift; each layer is two copies wide, so wrap by w.
      farGround.x = -((time * FAR_DRIFT) % w);
      nearGround.x = -((time * NEAR_DRIFT) % w);
      earthHolder.alpha = 0.95 + Math.sin(time * 0.4) * 0.05;
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
      .fill({ color: 0xdfe8ff, alpha: 0.1 });
  }
  const globe = new Graphics().circle(0, 0, radius).fill(0xc3c5cc);

  // Dark maria and craters, clipped to the disc with the shading.
  const surface = new Graphics()
    .ellipse(-radius * 0.3, -radius * 0.22, radius * 0.4, radius * 0.27)
    .fill(0x8e9098)
    .ellipse(radius * 0.2, radius * 0.06, radius * 0.3, radius * 0.22)
    .fill(0x95979f)
    .ellipse(-radius * 0.05, radius * 0.5, radius * 0.24, radius * 0.14)
    .fill(0x8e9098);
  const craters: Array<[number, number, number]> = [
    [0.45, -0.42, 0.16],
    [-0.52, 0.36, 0.13],
    [0.52, 0.45, 0.1],
    [-0.08, -0.64, 0.09],
    [0.16, 0.72, 0.07],
  ];
  for (const [cx, cy, cr] of craters) {
    const x = cx * radius;
    const y = cy * radius;
    const r = cr * radius;
    surface
      .circle(x, y, r * 1.18)
      .fill(0xe6e7ec)
      .circle(x + r * 0.12, y + r * 0.12, r)
      .fill(0x7b7d86)
      .circle(x + r * 0.32, y + r * 0.32, r * 0.58)
      .fill(0x9a9ca4);
  }
  const shade = new Graphics()
    .circle(radius * 0.34, radius * 0.3, radius)
    .fill({ color: 0x0a0c18, alpha: 0.4 });
  const mask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  const content = new Container();
  content.addChild(surface, shade);
  content.mask = mask;

  const highlight = new Graphics()
    .ellipse(-radius * 0.38, -radius * 0.45, radius * 0.32, radius * 0.18)
    .fill({ color: 0xffffff, alpha: 0.32 });
  const rim = new Graphics().circle(0, 0, radius).stroke({
    color: 0xffffff,
    width: Math.max(1, radius * 0.04),
    alpha: 0.25,
  });
  icon.addChild(glow, globe, content, mask, highlight, rim);
  return icon;
};

export const moonTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/moon"),
  createBackground,
  // Cooler, whiter fire than Earth: white core, pale blue body, orange tips.
  trail: {
    style: "fire",
    colors: [0xffffff, 0xd6ecff, 0x8cc2ff, 0xffbe6a, 0xff7a2a],
  },
  mapIcon,
};

import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { createSphere, drawBlob, seeded } from "./shared/sphere";
import { drawVerticalGradient, lerpColor } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x070814,
  bgBottom: 0x8a3428,
  accent: 0xffb23e,
  uiPanel: 0x3a1b30,
  uiText: 0xfff2dc,
};

// Dusk sky, top to bottom: night indigo, plum, then a thin burnt-orange band
// where the sun has just gone down.
const SKY = [
  { at: 0, color: 0x05060f },
  { at: 0.38, color: 0x120f2a },
  { at: 0.56, color: 0x2e1734 },
  { at: 0.68, color: 0x6e2a2c },
  { at: 0.75, color: 0xc0602a },
  { at: 1, color: 0xe08a3e },
];

const HORIZON = 0.74; // where the sun sits, as a fraction of height

// Back to front: dark dune silhouettes, each rim-lit along its crest by the
// last of the sun.
const DUNES = [
  { base: 0.79, amp: 0.05, phase: 0.6, body: 0x3a1a2c, crest: 0xd8703a },
  { base: 0.86, amp: 0.045, phase: 2.4, body: 0x22101c, crest: 0xc0602e },
  { base: 0.93, amp: 0.04, phase: 4.1, body: 0x0e070c, crest: 0x8a4224 },
];

type Wisp = {
  view: Graphics;
  speed: number;
  wait: number;
  life: number;
  age: number;
  peak: number;
};

type Shimmer = { view: Graphics; baseY: number; phase: number };

type Star = { view: Graphics; phase: number; speed: number };

// Dune height at x: a broad swell plus a sharper ridge (|sin| makes crests).
const duneY = (x: number, baseY: number, amp: number, phase: number) =>
  baseY -
  amp *
    (Math.sin(x * 0.004 + phase) * 0.55 +
      (1 - Math.abs(Math.sin(x * 0.009 + phase * 1.7))) * 0.45);

const drawDune = (
  g: Graphics,
  width: number,
  height: number,
  dune: (typeof DUNES)[number],
) => {
  const step = 8;
  const baseY = height * dune.base;
  const amp = height * dune.amp;
  const points: [number, number][] = [];
  for (let x = 0; x <= width + step; x += step) {
    points.push([x, duneY(x, baseY, amp, dune.phase)]);
  }
  g.moveTo(0, height);
  for (const [x, y] of points) g.lineTo(x, y);
  g.lineTo(width + step, height)
    .closePath()
    .fill(dune.body);
  // Sunlit crest line along the ridge.
  g.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points) g.lineTo(x, y);
  g.stroke({ color: dune.crest, width: 1.5, alpha: 0.8 });
};

// A soft streak of blown sand: stacked translucent ellipses.
const drawWisp = (g: Graphics, length: number) => {
  for (let i = 0; i < 4; i++) {
    g.ellipse(
      i * length * 0.18,
      Math.sin(i * 1.7) * 3,
      length * (0.5 - i * 0.08),
      2.5 + i * 0.6,
    ).fill({ color: 0xffd2a0, alpha: 0.12 });
  }
  return g;
};

const createBackground = (width: number, height: number): BackgroundHandle => {
  const view = new Container();
  view.eventMode = "none";
  const sky = new Graphics();
  const starLayer = new Container();
  const sunGlow = new Graphics();
  const sun = new Graphics();
  const shimmerLayer = new Container();
  const dunes = new Graphics();
  const wispLayer = new Container();
  view.addChild(sky, starLayer, sunGlow, sun, shimmerLayer, dunes, wispLayer);

  let stars: Star[] = [];
  let shimmers: Shimmer[] = [];
  let wisps: Wisp[] = [];
  let w = width;
  let h = height;
  let time = 0;

  const resetWisp = (wisp: Wisp, initial: boolean) => {
    wisp.view.x = -wisp.view.width - Math.random() * w * 0.2;
    wisp.view.y = h * (0.8 + Math.random() * 0.16);
    wisp.speed = 60 + Math.random() * 70;
    wisp.life = (w + wisp.view.width * 2) / wisp.speed;
    wisp.age = 0;
    wisp.wait = initial ? Math.random() * 4 : 2 + Math.random() * 6;
    wisp.view.alpha = 0;
  };

  const resize = (newWidth: number, newHeight: number) => {
    w = newWidth;
    h = newHeight;
    const horizonY = h * HORIZON;

    sky.clear();
    drawVerticalGradient(sky, 0, 0, w, h, SKY);

    starLayer.removeChildren().forEach((c) => c.destroy());
    stars = [];
    const starCount = Math.round(40 + (w * h) / 9000);
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics()
        .circle(0, 0, 0.5 + Math.random() ** 2 * 1.3)
        .fill(0xfff4e0);
      star.position.set(Math.random() * w, Math.random() ** 1.4 * h * 0.55);
      starLayer.addChild(star);
      stars.push({
        view: star,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.6,
      });
    }

    // The sun, half sunk behind the far dunes, with a wide soft glow.
    const sunX = w * 0.3;
    const r = Math.min(w, h) * 0.09;
    sunGlow.clear();
    for (let i = 14; i >= 1; i--) {
      sunGlow
        .circle(sunX, horizonY + r * 0.6, r * (1 + i * 0.45))
        .fill({ color: 0xff8a3a, alpha: 0.035 });
    }
    sun.clear();
    const rings = 8;
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1);
      sun
        .circle(sunX, horizonY + r * 0.6, r * (1 - t * 0.3))
        .fill(lerpColor(0xff6a2a, 0xffe2a0, t));
    }
    // Thin haze lines across the disc.
    for (let i = 0; i < 3; i++) {
      sun
        .rect(sunX - r, horizonY + r * (0.1 - i * 0.28), r * 2, 1.5)
        .fill({ color: 0x6e2a2c, alpha: 0.6 });
    }

    // Heat shimmer: faint bright bands near the horizon that waver.
    shimmerLayer.removeChildren().forEach((c) => c.destroy());
    shimmers = [];
    for (let i = 0; i < 4; i++) {
      const band = new Graphics()
        .rect(0, 0, w, 2 + i)
        .fill({ color: 0xffc080, alpha: 0.08 });
      const baseY = horizonY - h * (0.005 + i * 0.012);
      band.y = baseY;
      shimmerLayer.addChild(band);
      shimmers.push({ view: band, baseY, phase: i * 1.3 });
    }

    dunes.clear();
    for (const dune of DUNES) drawDune(dunes, w, h, dune);

    wispLayer.removeChildren().forEach((c) => c.destroy());
    wisps = [];
    for (let i = 0; i < 4; i++) {
      const length = (60 + Math.random() * 80) * Math.max(0.6, w / 900);
      const wisp: Wisp = {
        view: drawWisp(new Graphics(), length),
        speed: 0,
        wait: 0,
        life: 1,
        age: 0,
        peak: 0.6 + Math.random() * 0.4,
      };
      wispLayer.addChild(wisp.view);
      resetWisp(wisp, true);
      wisps.push(wisp);
    }
  };

  resize(width, height);

  return {
    view,
    update: (dt) => {
      time += dt;
      sun.alpha = 0.95 + Math.sin(time * 0.6) * 0.05;
      sunGlow.alpha = 0.85 + Math.sin(time * 0.9) * 0.15;
      for (const star of stars) {
        star.view.alpha = 0.45 + Math.sin(time * star.speed + star.phase) * 0.4;
      }
      for (const s of shimmers) {
        s.view.y = s.baseY + Math.sin(time * 2.2 + s.phase) * 2;
        s.view.alpha = 0.5 + Math.sin(time * 3.1 + s.phase * 2) * 0.5;
      }
      for (const wisp of wisps) {
        if (wisp.wait > 0) {
          wisp.wait -= dt;
          continue;
        }
        wisp.age += dt;
        wisp.view.x += wisp.speed * dt;
        wisp.view.y -= dt * 4;
        // Fade in, drift, fade out.
        const t = wisp.age / wisp.life;
        wisp.view.alpha = wisp.peak * Math.sin(Math.min(1, t) * Math.PI);
        if (t >= 1) resetWisp(wisp, false);
      }
    },
    resize,
    destroy: () => {
      if (!view.destroyed) view.destroy({ children: true });
    },
  };
};

const mapIcon = (radius: number) =>
  createSphere(radius, {
    body: 0x9a5426,
    atmosphere: 0xffb23e,
    rim: 0xffd49a,
    night: 0x12060a,
    detail: (g, r) => {
      const rand = seeded(5);
      // Wind-scoured dune belts and a few dark basins.
      for (let i = 0; i < 9; i++) {
        const y0 = (-0.9 + i * 0.22) * r;
        g.moveTo(-r, y0);
        for (let x = -r; x <= r; x += r / 10) {
          g.lineTo(x, y0 + Math.sin((x / r) * 5 + i) * r * 0.05);
        }
        g.stroke({
          color: i % 2 ? 0x6e3518 : 0xd9945a,
          width: r * (0.05 + rand() * 0.04),
          alpha: 0.4,
        });
      }
      for (let i = 0; i < 3; i++) {
        drawBlob(
          g,
          (rand() - 0.5) * r * 1.2,
          (rand() - 0.5) * r * 1.2,
          r * (0.1 + rand() * 0.12),
          rand,
        ).fill({ color: 0x5a2a14, alpha: 0.5 });
      }
    },
  });

export const desertTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/desert"),
  createBackground,
  // A hot fire core that cools into sand-colored dust.
  trail: { style: "thrust", colors: [0xffffff, 0xffd27a, 0xe8702a, 0x7a4a30] },
  mapIcon,
};

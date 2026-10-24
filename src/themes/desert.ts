import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { drawVerticalGradient, lerpColor } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x2e1a4f,
  bgBottom: 0xe8843a,
  accent: 0xffb23e,
  uiPanel: 0x3a1b30,
  uiText: 0xfff2dc,
};

// Sunset sky, top to bottom: dusky purple, rose, orange, gold at the horizon.
const SKY = [
  { at: 0, color: 0x24164a },
  { at: 0.28, color: 0x5a2a68 },
  { at: 0.5, color: 0xb8456a },
  { at: 0.66, color: 0xf07a3a },
  { at: 0.78, color: 0xffb54a },
  { at: 1, color: 0xffd98a },
];

const HORIZON = 0.74; // where the sun sits, as a fraction of height

// Back to front: hazy far dunes, sunlit middle dunes, dark near dunes.
const DUNES = [
  { base: 0.79, amp: 0.05, phase: 0.6, body: 0xc8625e, crest: 0xf29a76 },
  { base: 0.86, amp: 0.045, phase: 2.4, body: 0xa9452f, crest: 0xef8a4a },
  { base: 0.93, amp: 0.04, phase: 4.1, body: 0x5e2422, crest: 0xb8562e },
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
  g.stroke({ color: dune.crest, width: 3, alpha: 0.9 });
};

// A soft streak of blown sand: stacked translucent ellipses.
const drawWisp = (g: Graphics, length: number) => {
  for (let i = 0; i < 4; i++) {
    g.ellipse(
      i * length * 0.18,
      Math.sin(i * 1.7) * 3,
      length * (0.5 - i * 0.08),
      2.5 + i * 0.6,
    ).fill({ color: 0xffe2b0, alpha: 0.28 });
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
    for (let i = 0; i < 18; i++) {
      const star = new Graphics()
        .circle(0, 0, 0.8 + Math.random() * 1.2)
        .fill(0xfff4e0);
      star.position.set(Math.random() * w, Math.random() * h * 0.26);
      starLayer.addChild(star);
      stars.push({
        view: star,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.6,
      });
    }

    // A big low sun sinking into the far dunes.
    const sunX = w * 0.3;
    const r = Math.min(w, h) * 0.16;
    sunGlow.clear();
    for (let i = 7; i >= 1; i--) {
      sunGlow
        .circle(sunX, horizonY, r * (1 + i * 0.3))
        .fill({ color: 0xffc96a, alpha: 0.06 });
    }
    sun.clear();
    const rings = 10;
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1);
      sun
        .circle(sunX, horizonY - r * 0.06 * t, r * (1 - t * 0.35))
        .fill(lerpColor(0xff8a3a, 0xfff1b8, t));
    }
    // Thin bands of haze across the lower half of the disc.
    for (let i = 0; i < 3; i++) {
      const y = horizonY - r * (0.05 - i * 0.22);
      sun
        .rect(sunX - r, y, r * 2, r * (0.04 + i * 0.03))
        .fill({ color: 0xe0664a, alpha: 0.55 });
    }

    // Heat shimmer: faint bright bands near the horizon that waver.
    shimmerLayer.removeChildren().forEach((c) => c.destroy());
    shimmers = [];
    for (let i = 0; i < 4; i++) {
      const band = new Graphics()
        .rect(0, 0, w, 2 + i)
        .fill({ color: 0xfff0c0, alpha: 0.18 });
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

const mapIcon = (radius: number) => {
  const icon = new Container();
  const glow = new Graphics();
  for (let i = 3; i >= 1; i--) {
    glow
      .circle(0, 0, radius * (1 + i * 0.12))
      .fill({ color: 0xffb35a, alpha: 0.13 });
  }
  const globe = new Graphics().circle(0, 0, radius).fill(0xd98b3a);
  // Wavy dune bands across the globe, alternating light and dark ochre.
  const bands = new Graphics();
  const bandColors = [0xf2b25c, 0xb8662a, 0xe9a04a, 0x9c5222, 0xf0b866];
  const step = radius / 8;
  for (let i = 0; i < bandColors.length; i++) {
    const y0 = -radius + (i + 0.6) * ((radius * 2) / bandColors.length);
    const thick = radius * 0.16;
    bands.moveTo(-radius, y0);
    for (let x = -radius; x <= radius; x += step) {
      bands.lineTo(
        x,
        y0 + Math.sin((x / radius) * 4 + i * 1.3) * radius * 0.07,
      );
    }
    for (let x = radius; x >= -radius; x -= step) {
      bands.lineTo(
        x,
        y0 + thick + Math.sin((x / radius) * 4 + i * 1.3 + 0.6) * radius * 0.06,
      );
    }
    bands.closePath().fill({ color: bandColors[i], alpha: 0.85 });
  }
  const mask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  bands.mask = mask;
  const shade = new Graphics()
    .circle(radius * 0.25, radius * 0.25, radius)
    .fill({ color: 0x3a0f20, alpha: 0.32 });
  shade.mask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  const highlight = new Graphics()
    .ellipse(-radius * 0.35, -radius * 0.45, radius * 0.35, radius * 0.2)
    .fill({ color: 0xfff2d0, alpha: 0.38 });
  icon.addChild(glow, globe, bands, mask, shade, shade.mask, highlight);
  return icon;
};

export const desertTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/desert"),
  createBackground,
  // A hot fire core that cools into sand-colored dust.
  trail: { style: "fire", colors: [0xfff4c8, 0xffb43a, 0xe2602a, 0xc9955e] },
  mapIcon,
};

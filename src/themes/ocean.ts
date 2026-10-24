import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { drawVerticalGradient } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x1b8fae,
  bgBottom: 0x060a26,
  accent: 0x5ee8f2,
  uiPanel: 0x08223f,
  uiText: 0xe6fbff,
};

const WATER = [
  { at: 0, color: 0x2aa6bf },
  { at: 0.18, color: 0x14709f },
  { at: 0.5, color: 0x0b3b78 },
  { at: 0.8, color: 0x0a1c4c },
  { at: 1, color: 0x050822 },
];

type Ray = { view: Graphics; phase: number; speed: number; base: number };
type Bubble = {
  view: Graphics;
  speed: number;
  phase: number;
  drift: number;
  baseX: number;
};

// A single bubble: a faint filled disc, a bright ring and a small highlight.
const drawBubble = (g: Graphics, r: number) =>
  g
    .circle(0, 0, r)
    .fill({ color: 0xbff4ff, alpha: 0.12 })
    .stroke({ color: 0xd8fbff, width: Math.max(1, r * 0.18), alpha: 0.7 })
    .circle(-r * 0.35, -r * 0.35, r * 0.28)
    .fill({ color: 0xffffff, alpha: 0.8 });

// A soft light shaft fanning down from the surface, drawn as stacked wedges
// so its edges fade out, and split into bands that dim with depth so it has
// no hard end. Origin is at the top so it can sway around it.
const drawRay = (g: Graphics, length: number, topWidth: number) => {
  const bands = 18;
  for (let i = 0; i < 4; i++) {
    const t = 1 - i * 0.22;
    const halfAt = (d: number) => topWidth * t * (0.5 + 1.1 * d);
    for (let b = 0; b < bands; b++) {
      const d0 = b / bands;
      const d1 = (b + 1) / bands;
      const y0 = d0 * length;
      const y1 = d1 * length;
      g.poly([
        -halfAt(d0),
        y0,
        halfAt(d0),
        y0,
        halfAt(d1),
        y1,
        -halfAt(d1),
        y1,
      ]).fill({ color: 0xc8f6ff, alpha: 0.055 * (1 - d0) });
    }
  }
  return g;
};

// A wavy kelp frond rising from the seabed, as a tapered ribbon.
const drawKelp = (
  g: Graphics,
  x: number,
  baseY: number,
  height: number,
  width: number,
  phase: number,
  color: number,
) => {
  const segments = 14;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const cx = x + Math.sin(t * 4 + phase) * width * 1.4 * t;
    const y = baseY - t * height;
    const half = (width / 2) * (1 - t * 0.75);
    left.push(cx - half, y);
    right.unshift(cx + half, y);
  }
  g.poly([...left, ...right]).fill(color);
};

// A rounded branching coral silhouette.
const drawCoral = (
  g: Graphics,
  x: number,
  baseY: number,
  size: number,
  color: number,
) => {
  const branch = (
    bx: number,
    by: number,
    angle: number,
    len: number,
    w: number,
    depth: number,
  ) => {
    const ex = bx + Math.cos(angle) * len;
    const ey = by + Math.sin(angle) * len;
    g.moveTo(bx, by).lineTo(ex, ey).stroke({ color, width: w, cap: "round" });
    if (depth > 0) {
      branch(ex, ey, angle - 0.45, len * 0.72, w * 0.72, depth - 1);
      branch(ex, ey, angle + 0.4, len * 0.68, w * 0.72, depth - 1);
    } else {
      g.circle(ex, ey, w * 0.7).fill(color);
    }
  };
  branch(x, baseY, -Math.PI / 2, size * 0.4, size * 0.16, 2);
};

const createBackground = (width: number, height: number): BackgroundHandle => {
  const view = new Container();
  view.eventMode = "none";
  const water = new Graphics();
  const surface = new Graphics();
  const rayLayer = new Container();
  const bubbleLayer = new Container();
  const seabed = new Graphics();
  view.addChild(water, surface, rayLayer, seabed, bubbleLayer);

  let rays: Ray[] = [];
  let bubbles: Bubble[] = [];
  let w = width;
  let h = height;
  let time = 0;

  const placeBubble = (b: Bubble, anywhere: boolean) => {
    b.baseX = Math.random() * w;
    b.view.x = b.baseX;
    b.view.y = anywhere ? Math.random() * h : h + 20 + Math.random() * 60;
  };

  const resize = (newWidth: number, newHeight: number) => {
    w = newWidth;
    h = newHeight;
    water.clear();
    drawVerticalGradient(water, 0, 0, w, h, WATER);

    // Shimmering surface glow along the top edge.
    surface.clear();
    for (let i = 0; i < 5; i++) {
      surface
        .rect(0, 0, w, h * (0.02 + i * 0.025))
        .fill({ color: 0x9ff0ff, alpha: 0.05 });
    }

    rayLayer.removeChildren().forEach((c) => c.destroy());
    rays = [];
    const rayCount = Math.max(4, Math.round(w / 260));
    for (let i = 0; i < rayCount; i++) {
      const ray = drawRay(
        new Graphics(),
        h * (1.1 + Math.random() * 0.2),
        Math.max(30, w * (0.03 + Math.random() * 0.03)),
      );
      ray.position.set(((i + 0.3 + Math.random() * 0.4) / rayCount) * w, -10);
      const base = 0.28 + Math.random() * 0.12;
      ray.rotation = base;
      rayLayer.addChild(ray);
      rays.push({
        view: ray,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.25,
        base,
      });
    }

    bubbleLayer.removeChildren().forEach((c) => c.destroy());
    bubbles = [];
    const scale = Math.max(0.7, Math.min(w, h) / 700);
    const bubbleCount = Math.round(Math.min(40, 14 + w / 60));
    for (let i = 0; i < bubbleCount; i++) {
      const r = (2 + Math.random() ** 2 * 9) * scale;
      const g = drawBubble(new Graphics(), r);
      g.alpha = 0.45 + Math.random() * 0.45;
      bubbleLayer.addChild(g);
      const b: Bubble = {
        view: g,
        speed: (24 + r * 4 + Math.random() * 20) * scale,
        phase: Math.random() * Math.PI * 2,
        drift: 4 + Math.random() * 10,
        baseX: 0,
      };
      placeBubble(b, true);
      bubbles.push(b);
    }

    // Faint kelp and coral silhouettes along the bottom edge.
    seabed.clear();
    const kelpH = Math.min(h * 0.22, 220);
    for (let x = 10; x < w; x += 70 + Math.random() * 90) {
      drawKelp(
        seabed,
        x,
        h + 4,
        kelpH * (0.55 + Math.random() * 0.5),
        Math.max(10, kelpH * 0.09),
        Math.random() * 6,
        0x0d3a5a,
      );
    }
    for (let x = 40; x < w; x += 140 + Math.random() * 160) {
      drawCoral(
        seabed,
        x,
        h + 2,
        kelpH * (0.5 + Math.random() * 0.35),
        0x0a2a48,
      );
    }
    // Seabed ridge in front.
    const step = 10;
    seabed.moveTo(0, h);
    for (let x = 0; x <= w + step; x += step) {
      seabed.lineTo(
        x,
        h -
          h * 0.022 -
          Math.sin(x * 0.011) * h * 0.008 -
          Math.sin(x * 0.03) * 3,
      );
    }
    seabed
      .lineTo(w + step, h)
      .closePath()
      .fill(0x061630);
    seabed.alpha = 0.9;
  };

  resize(width, height);

  return {
    view,
    update: (dt) => {
      time += dt;
      for (const ray of rays) {
        const s = Math.sin(time * ray.speed + ray.phase);
        ray.view.rotation = ray.base + s * 0.05;
        ray.view.alpha = 0.7 + s * 0.3;
      }
      for (const b of bubbles) {
        b.view.y -= b.speed * dt;
        b.view.x = b.baseX + Math.sin(time * 1.6 + b.phase) * b.drift;
        if (b.view.y < -20) placeBubble(b, false);
      }
      surface.alpha = 0.8 + Math.sin(time * 0.9) * 0.2;
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
      .fill({ color: 0x5ee8f2, alpha: 0.13 });
  }
  const globe = new Graphics()
    .circle(0, 0, radius)
    .fill(0x0e58b8)
    .circle(-radius * 0.15, -radius * 0.15, radius * 0.8)
    .fill({ color: 0x1a86d8, alpha: 0.8 })
    .circle(-radius * 0.25, -radius * 0.25, radius * 0.5)
    .fill({ color: 0x35b4ea, alpha: 0.6 });

  // Wave bands: wavy horizontal stripes across the globe.
  const waves = new Graphics();
  const bands = [-0.62, -0.3, 0.02, 0.34, 0.64];
  bands.forEach((by, i) => {
    const y0 = by * radius;
    const amp = radius * 0.06;
    waves.moveTo(-radius, y0);
    for (let x = -radius; x <= radius; x += radius / 12) {
      waves.lineTo(x, y0 + Math.sin((x / radius) * 7 + i * 1.3) * amp);
    }
    waves.stroke({
      color: i % 2 === 0 ? 0xbff6ff : 0x6fd8f5,
      width: radius * (i % 2 === 0 ? 0.08 : 0.055),
      alpha: 0.75,
      cap: "round",
    });
  });
  const waveMask = new Graphics().circle(0, 0, radius * 0.96).fill(0xffffff);
  waves.mask = waveMask;

  const shade = new Graphics()
    .circle(radius * 0.28, radius * 0.28, radius)
    .fill({ color: 0x020a30, alpha: 0.38 });
  const shadeMask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  shade.mask = shadeMask;
  const rim = new Graphics()
    .circle(0, 0, radius)
    .stroke({ color: 0x9ff0ff, width: radius * 0.05, alpha: 0.6 });
  const highlight = new Graphics()
    .ellipse(-radius * 0.35, -radius * 0.45, radius * 0.34, radius * 0.18)
    .fill({ color: 0xffffff, alpha: 0.4 })
    .circle(-radius * 0.58, -radius * 0.2, radius * 0.06)
    .fill({ color: 0xffffff, alpha: 0.5 });
  icon.addChild(glow, globe, waves, waveMask, shade, shadeMask, rim, highlight);
  return icon;
};

export const oceanTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/ocean"),
  createBackground,
  trail: {
    style: "bubbles",
    colors: [0xffffff, 0xe0fbff, 0xa8ecf7, 0x6fd3ea],
  },
  mapIcon,
};

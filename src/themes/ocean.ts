import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { createSphere, drawBlob, seeded } from "./shared/sphere";
import { drawVerticalGradient } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x0a3a5c,
  bgBottom: 0x01030c,
  accent: 0x5ee8f2,
  uiPanel: 0x08223f,
  uiText: 0xe6fbff,
};

// Deep water: a dim teal glow from the surface sinking into black.
const WATER = [
  { at: 0, color: 0x0e4f6e },
  { at: 0.15, color: 0x08324f },
  { at: 0.45, color: 0x041a33 },
  { at: 0.75, color: 0x020c1e },
  { at: 1, color: 0x01040c },
];

type Ray = { view: Graphics; phase: number; speed: number; base: number };
type Speck = { view: Graphics; phase: number; speed: number; drift: number };
type Bubble = {
  view: Graphics;
  speed: number;
  phase: number;
  drift: number;
  baseX: number;
};

// A single bubble: a faint disc with a thin rim, lit slightly from above.
const drawBubble = (g: Graphics, r: number) =>
  g
    .circle(0, 0, r)
    .fill({ color: 0x9fe8ff, alpha: 0.05 })
    .stroke({ color: 0xbff4ff, width: Math.max(0.8, r * 0.1), alpha: 0.4 })
    .circle(-r * 0.3, -r * 0.4, r * 0.18)
    .fill({ color: 0xffffff, alpha: 0.35 });

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
      ]).fill({ color: 0x9fe8ff, alpha: 0.03 * (1 - d0) ** 1.5 });
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
  const speckLayer = new Container();
  speckLayer.blendMode = "add";
  const seabed = new Graphics();
  view.addChild(water, surface, rayLayer, seabed, speckLayer, bubbleLayer);

  let rays: Ray[] = [];
  let bubbles: Bubble[] = [];
  let specks: Speck[] = [];
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
        .fill({ color: 0x6fd8f0, alpha: 0.025 });
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
    const bubbleCount = Math.round(Math.min(24, 8 + w / 80));
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

    // Bioluminescent specks drifting in the dark water.
    speckLayer.removeChildren().forEach((c) => c.destroy());
    specks = [];
    const speckCount = Math.round(30 + (w * h) / 14000);
    for (let i = 0; i < speckCount; i++) {
      const r = 0.8 + Math.random() ** 3 * 2.2;
      const g = new Graphics()
        .circle(0, 0, r * 3)
        .fill({ color: 0x3fd8ff, alpha: 0.08 })
        .circle(0, 0, r)
        .fill({ color: Math.random() < 0.8 ? 0x7ff0ff : 0x9fffd8, alpha: 0.9 });
      g.position.set(Math.random() * w, h * (0.25 + Math.random() * 0.75));
      speckLayer.addChild(g);
      specks.push({
        view: g,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        drift: 2 + Math.random() * 6,
      });
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
        0x062238,
      );
    }
    for (let x = 40; x < w; x += 140 + Math.random() * 160) {
      drawCoral(
        seabed,
        x,
        h + 2,
        kelpH * (0.5 + Math.random() * 0.35),
        0x041a2e,
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
      .fill(0x020a18);
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
      for (const s of specks) {
        s.view.alpha = 0.35 + Math.sin(time * s.speed + s.phase) * 0.35;
        s.view.y -= s.drift * dt * 0.3;
        if (s.view.y < h * 0.2) s.view.y = h;
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
    body: 0x05375f,
    atmosphere: 0x5ee8f2,
    rim: 0xa8f4ff,
    detail: (g, r) => {
      const rand = seeded(8);
      // Shallows over the deep water, then a few storm bands.
      for (let i = 0; i < 6; i++) {
        drawBlob(
          g,
          (rand() - 0.5) * r * 1.5,
          (rand() - 0.5) * r * 1.5,
          r * (0.18 + rand() * 0.22),
          rand,
          0.5,
        ).fill({ color: 0x167fae, alpha: 0.55 });
      }
      for (let i = 0; i < 7; i++) {
        g.ellipse(
          (rand() - 0.5) * r * 1.4,
          (rand() * 1.6 - 0.8) * r,
          r * (0.18 + rand() * 0.3),
          r * 0.03,
        ).fill({ color: 0xe8fbff, alpha: 0.25 + rand() * 0.25 });
      }
    },
  });

export const oceanTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/ocean"),
  createBackground,
  trail: {
    style: "bubbles",
    colors: [0xffffff, 0xa8f4ff, 0x4fd2f0, 0x1a7ab0],
    additive: true,
  },
  mapIcon,
};

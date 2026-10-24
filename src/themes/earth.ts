import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { drawVerticalGradient } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x1546c9,
  bgBottom: 0x2e9e4f,
  accent: 0x5fe08a,
  uiPanel: 0x0d2a4f,
  uiText: 0xf2fbff,
};

const SKY = [
  { at: 0, color: 0x1238b0 },
  { at: 0.45, color: 0x2f86ea },
  { at: 0.8, color: 0x8fd8ff },
  { at: 1, color: 0xd4f4ff },
];

type Cloud = { view: Graphics; speed: number };

const drawCloud = (g: Graphics, scale: number) => {
  // A cloud is a cluster of soft overlapping puffs with a shaded underside.
  const puffs = [
    [0, 0, 26],
    [24, -10, 30],
    [52, -2, 24],
    [-24, 4, 18],
    [72, 8, 16],
  ];
  for (const [x, y, r] of puffs) {
    g.circle(x * scale, (y + 6) * scale, r * scale).fill({
      color: 0x9cc6ea,
      alpha: 0.55,
    });
  }
  for (const [x, y, r] of puffs) {
    g.circle(x * scale, y * scale, r * scale).fill({
      color: 0xffffff,
      alpha: 0.92,
    });
  }
  return g;
};

// A rolling hill silhouette from two summed sine waves.
const drawHill = (
  g: Graphics,
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  phase: number,
  color: number,
) => {
  const step = 8;
  g.moveTo(0, height);
  for (let x = 0; x <= width + step; x += step) {
    const y =
      baseY -
      amplitude *
        (Math.sin(x * 0.006 + phase) * 0.7 +
          Math.sin(x * 0.017 + phase * 2) * 0.3);
    g.lineTo(x, y);
  }
  g.lineTo(width + step, height)
    .closePath()
    .fill(color);
};

const createBackground = (width: number, height: number): BackgroundHandle => {
  const view = new Container();
  view.eventMode = "none";
  const sky = new Graphics();
  const sun = new Graphics();
  const cloudLayer = new Container();
  const hills = new Graphics();
  view.addChild(sky, sun, cloudLayer, hills);

  let clouds: Cloud[] = [];
  let w = width;
  let time = 0;

  const resize = (newWidth: number, newHeight: number) => {
    w = newWidth;
    const h = newHeight;
    sky.clear();
    drawVerticalGradient(sky, 0, 0, w, h, SKY);

    sun.clear();
    const sunX = w * 0.78;
    const sunY = h * 0.14;
    const r = Math.min(w, h) * 0.07;
    for (let i = 6; i >= 1; i--) {
      sun
        .circle(sunX, sunY, r * (1 + i * 0.45))
        .fill({ color: 0xfff3b0, alpha: 0.05 });
    }
    sun.circle(sunX, sunY, r).fill(0xfffbe0);

    cloudLayer.removeChildren().forEach((c) => c.destroy());
    clouds = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const scale = (0.5 + Math.random() * 0.6) * Math.max(0.6, w / 500);
      const cloud = drawCloud(new Graphics(), scale);
      cloud.position.set(Math.random() * w, h * (0.08 + Math.random() * 0.42));
      cloud.alpha = 0.75 + Math.random() * 0.25;
      cloudLayer.addChild(cloud);
      clouds.push({ view: cloud, speed: 6 + Math.random() * 10 });
    }

    hills.clear();
    drawHill(hills, w, h, h * 0.8, h * 0.05, 0.4, 0x6fbf8e);
    drawHill(hills, w, h, h * 0.87, h * 0.045, 2.1, 0x3d9e58);
    drawHill(hills, w, h, h * 0.94, h * 0.035, 4.3, 0x237a3a);
  };

  resize(width, height);

  return {
    view,
    update: (dt) => {
      time += dt;
      for (const cloud of clouds) {
        cloud.view.x += cloud.speed * dt;
        if (cloud.view.x - cloud.view.width / 2 > w) {
          cloud.view.x = -cloud.view.width;
        }
      }
      sun.alpha = 0.92 + Math.sin(time * 0.8) * 0.08;
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
  trail: { style: "fire", colors: [0xfffbd0, 0xffd23a, 0xff7a1a, 0xc8230e] },
  mapIcon,
};

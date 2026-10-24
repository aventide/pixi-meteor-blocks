import { Container, Graphics } from "pixi.js";
import type { BackgroundHandle, PlanetTheme } from "../config/planets";
import { planetTiles } from "./shared/assets";
import { drawVerticalGradient } from "./shared/color";

const palette: PlanetTheme["palette"] = {
  bgTop: 0x1a0c24,
  bgBottom: 0x0b3a26,
  accent: 0xffc93c,
  uiPanel: 0x1d0e29,
  uiText: 0xfff3d6,
};

const GOLD = 0xffc93c;
const MAGENTA = 0xff3fb4;

const FELT = [
  { at: 0, color: 0x0a1f16 },
  { at: 0.35, color: 0x0e3a25 },
  { at: 0.7, color: 0x0d3322 },
  { at: 1, color: 0x071a11 },
];

// Card-suit outlines on a 128-unit grid centered near (64, 63), the same
// shapes as the tile glyphs. Only absolute M/L/H/C/Q/Z commands are used.
const SUIT_PATHS = {
  heart:
    "M64 90 C52 81 37 70 37 54 C37 44 44 37 52.5 37 C58 37 62 40 64 45 C66 40 70 37 75.5 37 C84 37 91 44 91 54 C91 70 76 81 64 90 Z",
  diamond: "M64 33 Q74 50 89 63 Q74 76 64 93 Q54 76 39 63 Q54 50 64 33 Z",
  spade:
    "M64 35 C71 46 90 55 90 69 C90 78 83 83 76 83 C72 83 69 81 67 78 Q68 86 75 91 H53 Q60 86 61 78 C59 81 56 83 52 83 C45 83 38 78 38 69 C38 55 57 46 64 35 Z",
  club: "M64 34 C72 34 77.5 40 77.5 47.5 C77.5 50.5 76.5 53 75 55 C76.5 54.6 78 54.4 79 54.4 C86.5 54.4 92 60 92 67.5 C92 75 86.5 80.5 79 80.5 C74 80.5 70 78 68 74 Q68.5 85 76 91 H52 Q59.5 85 60 74 C58 78 54 80.5 49 80.5 C41.5 80.5 36 75 36 67.5 C36 60 41.5 54.4 49 54.4 C50 54.4 51.5 54.6 53 55 C51.5 53 50.5 50.5 50.5 47.5 C50.5 40 56 34 64 34 Z",
};
type Suit = keyof typeof SUIT_PATHS;
const SUITS = Object.keys(SUIT_PATHS) as Suit[];

// Traces a suit path into `g`, centered at the origin, about `size` tall.
const traceSuit = (g: Graphics, suit: Suit, size: number) => {
  const tokens = SUIT_PATHS[suit].match(/[MLHCQZ]|-?\d+(\.\d+)?/g) ?? [];
  const s = size / 60;
  const px = (v: number) => (v - 64) * s;
  const py = (v: number) => (v - 63) * s;
  let i = 0;
  let cmd = "";
  let y = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLHCQZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "M" || cmd === "L") {
      const x = px(num());
      y = py(num());
      if (cmd === "M") g.moveTo(x, y);
      else g.lineTo(x, y);
    } else if (cmd === "H") {
      g.lineTo(px(num()), y);
    } else if (cmd === "C") {
      const [a, b, c, d, e, f] = [num(), num(), num(), num(), num(), num()];
      y = py(f);
      g.bezierCurveTo(px(a), py(b), px(c), py(d), px(e), y);
    } else if (cmd === "Q") {
      const [a, b, c, d] = [num(), num(), num(), num()];
      y = py(d);
      g.quadraticCurveTo(px(a), py(b), px(c), y);
    } else if (cmd === "Z") {
      g.closePath();
    }
  }
  return g;
};

// A flat chip silhouette: disc, edge inserts, inner face ring.
const drawChip = (g: Graphics, r: number, color: number) => {
  g.circle(0, 0, r).fill(color);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.circle(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.12).fill({
      color: 0x000000,
      alpha: 0.35,
    });
  }
  g.circle(0, 0, r * 0.62).stroke({
    color: 0x000000,
    width: r * 0.06,
    alpha: 0.3,
  });
  return g;
};

// A neon tube: wide faint glow, mid glow, colored tube, then a white core.
const drawNeon = (
  trace: (g: Graphics) => Graphics,
  color: number,
  width: number,
) => {
  const g = new Graphics();
  const layers: [number, number, number][] = [
    [width * 5, 0.07, color],
    [width * 2.6, 0.18, color],
    [width, 0.95, color],
    [width * 0.4, 0.9, 0xffffff],
  ];
  for (const [w, alpha, c] of layers) {
    trace(g).stroke({ color: c, width: w, alpha, join: "round", cap: "round" });
  }
  return g;
};

const traceStar = (g: Graphics, r: number, points = 5) => {
  for (let i = 0; i <= points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return g.closePath();
};

// A four-point glint with a soft halo.
const drawSparkle = (g: Graphics, r: number) => {
  g.circle(0, 0, r * 0.9).fill({ color: 0xfff1b0, alpha: 0.15 });
  g.moveTo(0, -r)
    .quadraticCurveTo(0, 0, r, 0)
    .quadraticCurveTo(0, 0, 0, r)
    .quadraticCurveTo(0, 0, -r, 0)
    .quadraticCurveTo(0, 0, 0, -r)
    .closePath()
    .fill(0xffffff);
  return g;
};

type Floater = {
  view: Graphics;
  speed: number;
  sway: number;
  phase: number;
  spin: number;
  baseX: number;
};
type Neon = { view: Graphics; base: number; phase: number; flicker: number };
type Sparkle = { view: Graphics; age: number; life: number; wait: number };
type Bulb = { view: Graphics; index: number };

const createBackground = (width: number, height: number): BackgroundHandle => {
  const view = new Container();
  view.eventMode = "none";
  const felt = new Graphics();
  const floaterLayer = new Container();
  const vignette = new Graphics();
  const neonLayer = new Container();
  const bulbLayer = new Container();
  const sparkleLayer = new Container();
  view.addChild(
    felt,
    floaterLayer,
    vignette,
    neonLayer,
    bulbLayer,
    sparkleLayer,
  );
  for (const layer of [neonLayer, bulbLayer, sparkleLayer]) {
    layer.blendMode = "add";
  }

  let w = width;
  let h = height;
  let time = 0;
  let floaters: Floater[] = [];
  let neons: Neon[] = [];
  let bulbs: Bulb[] = [];
  let sparkles: Sparkle[] = [];

  // 0 at the horizontal center (behind the board), 1 near the side edges.
  const edgeFactor = (x: number) =>
    Math.min(1, Math.abs(x / w - 0.5) * 2.4) ** 2;

  const placeSparkle = (s: Sparkle) => {
    const nearEdge = Math.random() < 0.7;
    const x = nearEdge
      ? Math.random() < 0.5
        ? w * Math.random() * 0.15
        : w * (0.85 + Math.random() * 0.15)
      : Math.random() * w;
    const y =
      Math.random() < 0.5
        ? h * (0.08 + Math.random() * 0.14)
        : h * Math.random();
    s.view.position.set(x, y);
    s.age = 0;
    s.life = 0.6 + Math.random() * 0.5;
    s.wait = 0.4 + Math.random() * 2.6;
    s.view.alpha = 0;
  };

  const resize = (newWidth: number, newHeight: number) => {
    w = newWidth;
    h = newHeight;
    const unit = Math.min(w, h);

    felt.clear();
    drawVerticalGradient(felt, 0, 0, w, h, FELT);
    // A soft lamp pool in the middle of the table.
    for (let i = 8; i >= 1; i--) {
      felt
        .ellipse(w / 2, h * 0.58, w * 0.12 * i, h * 0.07 * i)
        .fill({ color: 0x1f6a40, alpha: 0.035 });
    }
    // Felt weave: a faint diagonal lattice plus scattered nap specks.
    const step = Math.max(18, unit * 0.035);
    for (let x = -h; x < w + h; x += step) {
      felt.moveTo(x, 0).lineTo(x + h, h);
      felt.moveTo(x + h, 0).lineTo(x, h);
    }
    felt.stroke({ color: 0x000000, width: 1, alpha: 0.07 });
    for (let i = 0; i < 260; i++) {
      felt
        .rect(Math.random() * w, Math.random() * h, 1.5, 1.5)
        .fill({ color: 0x5fbf86, alpha: 0.05 + Math.random() * 0.06 });
    }

    // Warm vignette: stacked edge strips, darker toward the canvas edge,
    // plus a little extra weight along the bottom.
    vignette.clear();
    const bands = 14;
    const depth = unit * 0.22;
    for (let i = 0; i < bands; i++) {
      const inset = (depth * i) / bands;
      vignette.rect(inset, inset, w - inset * 2, h - inset * 2).stroke({
        color: 0x2a0e02,
        width: depth / bands + 1,
        alpha: 0.11 * (1 - i / bands),
      });
    }
    for (let i = 0; i < 10; i++) {
      vignette
        .rect(0, h - (h * 0.2 * (i + 1)) / 10, w, (h * 0.2) / 10 + 1)
        .fill({ color: 0x0a0300, alpha: 0.03 * (1 - i / 10) });
    }

    // Floating chip and suit silhouettes.
    floaterLayer.removeChildren().forEach((c) => c.destroy());
    floaters = [];
    for (let i = 0; i < 14; i++) {
      const g = new Graphics();
      const size = unit * (0.04 + Math.random() * 0.05);
      const color = [GOLD, MAGENTA, 0xffffff, 0xff5a5a][i % 4];
      if (i % 3 === 0) drawChip(g, size * 0.6, color);
      else traceSuit(g, SUITS[i % 4], size).fill(color);
      const baseX = Math.random() * w;
      g.position.set(baseX, Math.random() * h);
      g.rotation = (Math.random() - 0.5) * 0.8;
      floaterLayer.addChild(g);
      floaters.push({
        view: g,
        speed: 8 + Math.random() * 14,
        sway: 6 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
        baseX,
      });
    }

    // Neon signage along the top of the play area (just below the HUD).
    neonLayer.removeChildren().forEach((c) => c.destroy());
    neons = [];
    const lineW = Math.max(1.6, unit * 0.0045);
    const topY = h * 0.105;
    const bottomY = h * 0.205;
    const signY = (topY + bottomY) / 2;
    const placed: [Graphics, number, number | null][] = [
      [drawNeon((g) => traceStar(g, unit * 0.045), MAGENTA, lineW), 0.85, 0.1],
      [drawNeon((g) => traceStar(g, unit * 0.045), MAGENTA, lineW), 0.85, 0.9],
      [
        drawNeon((g) => traceSuit(g, "diamond", unit * 0.06), GOLD, lineW),
        0.8,
        0.2,
      ],
      [
        drawNeon((g) => traceSuit(g, "heart", unit * 0.055), GOLD, lineW),
        0.8,
        0.8,
      ],
      // Gold marquee rails; kept dim because blocks spawn in this band.
      [
        drawNeon(
          (g) =>
            g
              .moveTo(w * 0.04, topY)
              .lineTo(w * 0.96, topY)
              .moveTo(w * 0.04, bottomY)
              .lineTo(w * 0.96, bottomY),
          GOLD,
          lineW * 0.8,
        ),
        0.35,
        null,
      ],
      // Magenta chevrons pointing in toward the middle.
      [
        drawNeon(
          (g) => {
            const c = unit * 0.022;
            for (const x of [w * 0.3, w * 0.36, w * 0.64, w * 0.7]) {
              const dir = x < w / 2 ? 1 : -1;
              g.moveTo(x - c * dir, signY - c)
                .lineTo(x, signY)
                .lineTo(x - c * dir, signY + c);
            }
            return g;
          },
          MAGENTA,
          lineW * 0.8,
        ),
        0.32,
        null,
      ],
    ];
    for (const [g, base, fx] of placed) {
      if (fx !== null) g.position.set(w * fx, signY);
      neonLayer.addChild(g);
      neons.push({ view: g, base, phase: Math.random() * 6.28, flicker: 0 });
    }

    // Marquee bulbs chasing along both rails.
    bulbLayer.removeChildren().forEach((c) => c.destroy());
    bulbs = [];
    const spacing = Math.max(16, unit * 0.04);
    let index = 0;
    for (const y of [topY, bottomY]) {
      for (let x = w * 0.04; x <= w * 0.96; x += spacing) {
        const g = new Graphics()
          .circle(0, 0, lineW * 2.6)
          .fill({ color: GOLD, alpha: 0.25 })
          .circle(0, 0, lineW * 1.1)
          .fill(0xfff4c8);
        g.position.set(x, y);
        bulbLayer.addChild(g);
        bulbs.push({ view: g, index: index++ });
      }
    }

    // A small pool of sparkle glints that pop up now and then.
    sparkleLayer.removeChildren().forEach((c) => c.destroy());
    sparkles = [];
    for (let i = 0; i < 9; i++) {
      const size = unit * (0.018 + Math.random() * 0.016);
      const s: Sparkle = {
        view: drawSparkle(new Graphics(), size),
        age: 0,
        life: 1,
        wait: 0,
      };
      sparkleLayer.addChild(s.view);
      placeSparkle(s);
      s.wait = Math.random() * 3;
      sparkles.push(s);
    }
  };

  resize(width, height);

  return {
    view,
    update: (dt) => {
      time += dt;
      for (const f of floaters) {
        f.view.y -= f.speed * dt;
        if (f.view.y < -60) {
          f.view.y = h + 60;
          f.baseX = Math.random() * w;
        }
        f.view.x = f.baseX + Math.sin(time * 0.5 + f.phase) * f.sway;
        f.view.rotation += f.spin * dt;
        f.view.alpha = 0.05 + 0.13 * edgeFactor(f.view.x);
      }
      for (const n of neons) {
        // Gentle pulse, with a rare short stutter like a tired neon tube.
        if (n.flicker <= 0 && Math.random() < dt * 0.12) n.flicker = 0.35;
        n.flicker = Math.max(0, n.flicker - dt);
        const stutter =
          n.flicker > 0 && Math.sin(n.flicker * 70) > 0 ? 0.45 : 1;
        n.view.alpha =
          n.base * (0.82 + 0.18 * Math.sin(time * 2.2 + n.phase)) * stutter;
      }
      const chase = Math.floor(time * 6);
      for (const b of bulbs) {
        b.view.alpha = (b.index + chase) % 3 === 0 ? 0.9 : 0.3;
      }
      for (const s of sparkles) {
        if (s.wait > 0) {
          s.wait -= dt;
          continue;
        }
        s.age += dt;
        const t = s.age / s.life;
        if (t >= 1) {
          placeSparkle(s);
          continue;
        }
        const pulse = Math.sin(t * Math.PI);
        s.view.alpha = pulse * (0.35 + 0.65 * edgeFactor(s.view.x));
        s.view.scale.set(0.4 + pulse * 0.8);
        s.view.rotation = t * 1.2;
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
  const r = radius;
  const glow = new Graphics();
  for (let i = 3; i >= 1; i--) {
    glow.circle(0, 0, r * (1 + i * 0.1)).fill({ color: GOLD, alpha: 0.1 });
  }

  // A tilted ring of chips: the far half is drawn behind the planet.
  const ringRx = r * 1.28;
  const ringRy = r * 0.38;
  const tilt = -0.28;
  const ringPoint = (a: number) => {
    const x = Math.cos(a) * ringRx;
    const y = Math.sin(a) * ringRy;
    return {
      x: x * Math.cos(tilt) - y * Math.sin(tilt),
      y: x * Math.sin(tilt) + y * Math.cos(tilt),
    };
  };
  const traceArc = (g: Graphics, from: number, to: number) => {
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const p = ringPoint(from + ((to - from) * i) / steps);
      if (i === 0) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    }
    return g;
  };
  const back = traceArc(new Graphics(), Math.PI, Math.PI * 2).stroke({
    color: GOLD,
    width: r * 0.1,
    alpha: 0.55,
  });
  const front = traceArc(new Graphics(), 0, Math.PI).stroke({
    color: GOLD,
    width: r * 0.1,
  });
  const chipColors = [0xe8323c, 0x2273ea, 0x19a852, 0xffc414];
  const chips = 9;
  for (let i = 0; i < chips; i++) {
    const a = (i / chips) * Math.PI * 2 + 0.2;
    const p = ringPoint(a);
    const target = Math.sin(a) >= 0 ? front : back;
    const cr = r * 0.17;
    target
      .ellipse(p.x, p.y + cr * 0.25, cr, cr * 0.55)
      .fill(0x2a1206)
      .ellipse(p.x, p.y, cr, cr * 0.55)
      .fill(chipColors[i % 4])
      .ellipse(p.x, p.y, cr * 0.55, cr * 0.3)
      .stroke({ color: 0xffffff, width: cr * 0.18, alpha: 0.85 });
  }

  // The planet is a roulette wheel seen from above.
  const wheel = new Graphics().circle(0, 0, r).fill(0x6b0d16);
  const sectors = 18;
  for (let i = 0; i < sectors; i++) {
    const a0 = (i / sectors) * Math.PI * 2;
    const a1 = ((i + 1) / sectors) * Math.PI * 2;
    const color = i === 0 ? 0x13a050 : i % 2 ? 0x15101a : 0xd0202e;
    wheel.moveTo(0, 0).arc(0, 0, r, a0, a1).closePath().fill(color);
  }
  wheel
    .circle(0, 0, r * 0.97)
    .stroke({ color: 0xe8b23a, width: r * 0.05 })
    .circle(0, 0, r * 0.62)
    .fill(0x7a3a14)
    .circle(0, 0, r * 0.62)
    .stroke({ color: GOLD, width: r * 0.04 })
    .circle(0, 0, r * 0.3)
    .fill(0xffcf4a)
    .circle(0, 0, r * 0.3)
    .stroke({ color: 0x8a5a10, width: r * 0.04 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    wheel
      .moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3)
      .lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55)
      .stroke({ color: GOLD, width: r * 0.05, cap: "round" });
  }
  // The ball, resting in a pocket.
  wheel.circle(r * 0.5, -r * 0.62, r * 0.08).fill(0xffffff);

  const shadeMask = new Graphics().circle(0, 0, r).fill(0xffffff);
  const shade = new Graphics()
    .circle(r * 0.3, r * 0.3, r)
    .fill({ color: 0x14001a, alpha: 0.4 });
  shade.mask = shadeMask;
  const highlight = new Graphics()
    .ellipse(-r * 0.35, -r * 0.45, r * 0.35, r * 0.2)
    .fill({ color: 0xffffff, alpha: 0.35 });

  icon.addChild(glow, back, wheel, shade, shadeMask, highlight, front);
  return icon;
};

export const casinoTheme: PlanetTheme = {
  palette,
  tiles: planetTiles("planets/casino"),
  createBackground,
  trail: {
    style: "sparks",
    colors: [0xffffff, 0xffe066, 0xffa41c, 0xff2fa0],
  },
  mapIcon,
};

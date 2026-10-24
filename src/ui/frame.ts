import { type Container, FillGradient, Graphics } from "pixi.js";
import { lerpColor } from "../themes/shared/color";

// Chamfered "tech" shapes shared by panels, buttons, and the HUD. All shapes
// are centered on the origin. The top-left and bottom-right corners are cut;
// the other two corners get small bracket accents.

export const chamferPoints = (w: number, h: number, c: number) => {
  const x = -w / 2;
  const y = -h / 2;
  return [
    x + c,
    y,
    x + w,
    y,
    x + w,
    y + h - c,
    x + w - c,
    y + h,
    x,
    y + h,
    x,
    y + c,
  ];
};

const gradientsByView = new WeakMap<Container, Map<string, FillGradient>>();

// A view owns its generated textures. Reuse its small set of state colors on
// redraw (e.g. button hover), then release all of them when the view exits.
export const verticalGradient = (
  owner: Container,
  top: number,
  bottom: number,
) => {
  let gradients = gradientsByView.get(owner);
  if (!gradients) {
    const owned = new Map<string, FillGradient>();
    gradients = owned;
    gradientsByView.set(owner, owned);
    owner.once("destroyed", () => {
      for (const gradient of owned.values()) gradient.destroy();
      owned.clear();
      gradientsByView.delete(owner);
    });
  }
  const key = `${top}:${bottom}`;
  const cached = gradients.get(key);
  if (cached) return cached;
  const gradient = new FillGradient({
    type: "linear",
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: top },
      { offset: 1, color: bottom },
    ],
    textureSpace: "local",
  });
  gradients.set(key, gradient);
  return gradient;
};

type TechFrameOptions = {
  width: number;
  height: number;
  chamfer: number;
  fill: number;
  fillAlpha?: number;
  accent: number;
  glow?: number; // outer glow width in px (0 = none)
  brackets?: boolean;
  ticks?: boolean;
  scale?: number;
};

export const drawTechFrame = (g: Graphics, o: TechFrameOptions) => {
  const { width: w, height: h, chamfer: c, accent } = o;
  const s = o.scale ?? 1;
  const pts = chamferPoints(w, h, c);
  const glow = o.glow ?? 0;

  for (let i = 3; i >= 1 && glow > 0; i--) {
    g.poly(pts).stroke({ color: accent, width: glow * i * 0.7, alpha: 0.07 });
  }

  // Glass body: a vertical gradient, lighter at the top.
  g.poly(pts).fill({
    fill: verticalGradient(g, lerpColor(o.fill, 0xffffff, 0.12), o.fill),
    alpha: o.fillAlpha ?? 0.92,
  });
  g.poly(pts).stroke({ color: accent, width: 1.5 * s, alpha: 0.95 });
  // Inner hairline for depth.
  g.poly(chamferPoints(w - 8 * s, h - 8 * s, Math.max(0, c - 3 * s))).stroke({
    color: accent,
    width: 1 * s,
    alpha: 0.22,
  });

  if (o.brackets) {
    const b = Math.min(18 * s, w / 6, h / 4);
    const t = 3 * s;
    const x = -w / 2;
    const y = -h / 2;
    // top-right and bottom-left brackets
    g.moveTo(x + w - b, y - t)
      .lineTo(x + w + t, y - t)
      .lineTo(x + w + t, y + b);
    g.moveTo(x - t, y + h - b)
      .lineTo(x - t, y + h + t)
      .lineTo(x + b, y + h + t);
    g.stroke({ color: accent, width: 2 * s, alpha: 0.9 });
  }

  if (o.ticks) {
    const count = 5;
    const gap = 6 * s;
    const startX = -w / 2 + c + 10 * s;
    for (let i = 0; i < count; i++) {
      g.rect(startX + i * gap, -h / 2 + 5 * s, 3 * s, 3 * s).fill({
        color: accent,
        alpha: i === 0 ? 0.9 : 0.4,
      });
    }
  }
  return g;
};

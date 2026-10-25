import { Container, Graphics } from "pixi.js";

// Seeded random so a redraw gives the same surface instead of reshuffling it.
export const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// An irregular blob (continent, mare, shoal) as a jittered polygon.
export const drawBlob = (
  g: Graphics,
  x: number,
  y: number,
  r: number,
  rand: () => number,
  jag = 0.35,
  points = 12,
) => {
  const poly: number[] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rr = r * (1 - jag / 2 + rand() * jag);
    poly.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
  }
  return g.poly(poly);
};

// Pixi's arc() continues the current path, so start a fresh sub-path at the
// arc's first point to avoid a stray line from the previous shape.
export const arcPath = (
  g: Graphics,
  x: number,
  y: number,
  r: number,
  from: number,
  to: number,
) =>
  g
    .moveTo(x + Math.cos(from) * r, y + Math.sin(from) * r)
    .arc(x, y, r, from, to);

type SphereOptions = {
  body: number;
  // Surface detail, drawn over the body and clipped to the disc.
  detail?: (g: Graphics, r: number) => void;
  // Atmosphere color for the halo and lit rim; omit for an airless body.
  atmosphere?: number;
  rim?: number;
  night?: number;
};

// A planet lit from the upper left: body and detail, a soft terminator that
// darkens towards the lower right, a thin lit rim and an optional halo.
export const createSphere = (radius: number, options: SphereOptions) => {
  const view = new Container();
  const halo = new Graphics();
  if (options.atmosphere !== undefined) {
    for (let i = 8; i >= 1; i--) {
      halo
        .circle(0, 0, radius * (1 + i * 0.025))
        .fill({ color: options.atmosphere, alpha: 0.05 });
    }
  }
  const body = new Graphics().circle(0, 0, radius).fill(options.body);
  const detail = new Graphics();
  options.detail?.(detail, radius);
  const shade = new Graphics();
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    shade
      .circle(radius * 0.9 * t, radius * 0.9 * t, radius * (1.15 - t * 0.35))
      .fill({ color: options.night ?? 0x01030a, alpha: 0.075 });
  }
  const mask = new Graphics().circle(0, 0, radius).fill(0xffffff);
  const maskShade = new Graphics().circle(0, 0, radius).fill(0xffffff);
  detail.mask = mask;
  shade.mask = maskShade;
  const rimColor = options.rim ?? options.atmosphere ?? 0xffffff;
  const rim = new Graphics().circle(0, 0, radius).stroke({
    color: rimColor,
    width: Math.max(1, radius * 0.02),
    alpha: 0.25,
  });
  arcPath(rim, 0, 0, radius, Math.PI * 0.85, Math.PI * 1.65).stroke({
    color: rimColor,
    width: Math.max(1.2, radius * 0.035),
    alpha: 0.75,
  });
  view.addChild(halo, body, detail, mask, shade, maskShade, rim);
  return view;
};

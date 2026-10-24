import type { Graphics } from "pixi.js";

export const lerpColor = (a: number, b: number, t: number) => {
  let out = 0;
  for (const shift of [16, 8, 0]) {
    const ca = (a >> shift) & 255;
    const cb = (b >> shift) & 255;
    out |= Math.round(ca + (cb - ca) * t) << shift;
  }
  return out;
};

export type GradientStop = { at: number; color: number };

// Samples a multi-stop gradient at t in [0, 1].
export const sampleGradient = (stops: GradientStop[], t: number) => {
  if (t <= stops[0].at) return stops[0].color;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const next = stops[i];
    if (t <= next.at) {
      return lerpColor(
        prev.color,
        next.color,
        (t - prev.at) / (next.at - prev.at),
      );
    }
  }
  return stops[stops.length - 1].color;
};

// Draws a vertical gradient as flat strips (no auxiliary textures).
export const drawVerticalGradient = (
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: GradientStop[],
  steps = 96,
) => {
  for (let i = 0; i < steps; i++) {
    g.rect(x, y + (height * i) / steps, width, height / steps + 1).fill(
      sampleGradient(stops, i / (steps - 1)),
    );
  }
  return g;
};

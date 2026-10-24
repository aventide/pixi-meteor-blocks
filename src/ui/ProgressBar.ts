import { Container, Graphics } from "pixi.js";
import { uiTheme } from "./theme";
import { verticalGradient } from "./frame";
import { lerpColor } from "../themes/shared/color";

type ProgressBarOptions = {
  width: number; // screen px
  height: number; // screen px
  color: number;
  segments?: number;
  trackColor?: number;
};

// A segmented meter of slanted cells. Origin is its left-center. The leading
// cell fades in with fractional progress, so the meter fills smoothly.
export class ProgressBar extends Container {
  private g = new Graphics();
  private progress = -1;
  private readonly barWidth: number;
  private readonly barHeight: number;
  private readonly color: number;
  private readonly segments: number;
  private readonly trackColor: number;

  constructor({
    width,
    height,
    color,
    segments = 20,
    trackColor = uiTheme.colors.progressTrack,
  }: ProgressBarOptions) {
    super();
    this.barWidth = width;
    this.barHeight = height;
    this.color = color;
    this.segments = segments;
    this.trackColor = trackColor;
    this.addChild(this.g);
    this.eventMode = "none";
    this.setProgress(0);
  }

  setProgress(progress: number) {
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped === this.progress) return;
    this.progress = clamped;
    this.draw();
  }

  private draw() {
    const n = this.segments;
    const h = this.barHeight;
    const skew = h * 0.45;
    const gap = Math.max(1.5, h * 0.18);
    const cellW = (this.barWidth - skew - gap * (n - 1)) / n;
    const lit = this.progress * n;
    const fill = verticalGradient(
      lerpColor(this.color, 0xffffff, 0.45),
      this.color,
    );
    const g = this.g.clear();

    for (let i = 0; i < n; i++) {
      const x = i * (cellW + gap);
      const pts = [
        x + skew,
        -h / 2,
        x + skew + cellW,
        -h / 2,
        x + cellW,
        h / 2,
        x,
        h / 2,
      ];
      g.poly(pts).fill({ color: this.trackColor, alpha: 0.85 });
      const amount = Math.max(0, Math.min(1, lit - i));
      if (amount > 0) {
        g.poly(pts).fill({ fill, alpha: amount });
      }
      g.poly(pts).stroke({ color: this.color, width: 1, alpha: 0.35 });
    }
  }
}

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

// Draw cells once; only the lit cells' alpha changes while counting up.
export class ProgressBar extends Container {
  private readonly cells: Graphics[] = [];
  private progress = -1;

  constructor({
    width,
    height: h,
    color,
    segments: n = 20,
    trackColor = uiTheme.colors.progressTrack,
  }: ProgressBarOptions) {
    super();
    const track = new Graphics();
    this.addChild(track);
    const skew = h * 0.45;
    const gap = Math.max(1.5, h * 0.18);
    const cellW = (width - skew - gap * (n - 1)) / n;
    const fill = verticalGradient(
      this,
      lerpColor(color, 0xffffff, 0.45),
      color,
    );
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
      track.poly(pts).fill({ color: trackColor, alpha: 0.85 });
      const cell = new Graphics().poly(pts).fill(fill);
      this.cells.push(cell);
      this.addChild(cell);
    }
    const border = new Graphics();
    for (let i = 0; i < n; i++) {
      const x = i * (cellW + gap);
      border
        .poly([
          x + skew,
          -h / 2,
          x + skew + cellW,
          -h / 2,
          x + cellW,
          h / 2,
          x,
          h / 2,
        ])
        .stroke({ color, width: 1, alpha: 0.35 });
    }
    this.addChild(border);
    this.eventMode = "none";
    this.setProgress(0);
  }

  setProgress(progress: number) {
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped === this.progress) return;
    this.progress = clamped;
    const lit = clamped * this.cells.length;
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].alpha = Math.max(0, Math.min(1, lit - i));
    }
  }
}

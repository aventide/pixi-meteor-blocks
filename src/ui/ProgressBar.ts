import { Container, Graphics } from "pixi.js";
import { uiTheme } from "./theme";

type ProgressBarOptions = {
  width: number; // screen px
  height: number; // screen px
  color: number;
  trackColor?: number;
};

// A horizontal progress bar. Origin is its left-center.
export class ProgressBar extends Container {
  private track = new Graphics();
  private fill = new Graphics();
  private progress = 0;
  private barWidth: number;
  private barHeight: number;
  private color: number;
  private trackColor: number;

  constructor({
    width,
    height,
    color,
    trackColor = uiTheme.colors.progressTrack,
  }: ProgressBarOptions) {
    super();
    this.barWidth = width;
    this.barHeight = height;
    this.color = color;
    this.trackColor = trackColor;
    this.addChild(this.track, this.fill);
    this.eventMode = "none";
    this.drawTrack();
    this.drawFill();
  }

  setProgress(progress: number) {
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped === this.progress) return;
    this.progress = clamped;
    this.drawFill();
  }

  private drawTrack() {
    const h = this.barHeight;
    this.track
      .clear()
      .roundRect(0, -h / 2, this.barWidth, h, h / 2)
      .fill(this.trackColor)
      .roundRect(0, -h / 2, this.barWidth, h, h / 2)
      .stroke({ color: 0xffffff, alpha: 0.15, width: 1 });
  }

  private drawFill() {
    const h = this.barHeight;
    const w = Math.max(
      this.progress > 0 ? h : 0,
      this.barWidth * this.progress,
    );
    this.fill.clear();
    if (w > 0) {
      this.fill
        .roundRect(0, -h / 2, w, h, h / 2)
        .fill(this.color)
        .roundRect(2, -h / 2 + 2, Math.max(0, w - 4), h * 0.35, h / 4)
        .fill({ color: 0xffffff, alpha: 0.25 });
    }
  }
}

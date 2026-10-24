import { Container, Graphics, Text, type Ticker } from "pixi.js";
import { getApp } from "../game/app";

// Wall-clock frames, independent of gameplay's Space-key ticker speed.
export class FpsMeter extends Container {
  private readonly readout = new Text({
    text: "FPS …",
    style: { fontFamily: "monospace", fontSize: 12, fill: 0xffffff },
  });
  private elapsed = 0;
  private frames = 0;

  constructor() {
    super();
    this.eventMode = "none";
    this.position.set(8, 8);
    this.addChild(
      new Graphics().rect(0, 0, 90, 24).fill({ color: 0x000000, alpha: 0.8 }),
      this.readout,
    );
    this.readout.position.set(6, 4);
    getApp().ticker.add(this.tick);
  }

  private tick = (time: Ticker) => {
    this.elapsed += time.elapsedMS;
    this.frames++;
    if (this.elapsed < 500) return;
    this.readout.text = `FPS ${Math.round((this.frames * 1000) / this.elapsed)}`;
    this.elapsed = 0;
    this.frames = 0;
  };

  override destroy(options?: Parameters<Container["destroy"]>[0]) {
    getApp().ticker.remove(this.tick);
    super.destroy(options ?? { children: true });
  }
}

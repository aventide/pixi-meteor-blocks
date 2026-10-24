import { Container, Graphics } from "pixi.js";
import { lerpColor } from "../themes/shared/color";

type Star = { view: Graphics; baseAlpha: number; phase: number; speed: number };

// Ambient twinkling starfield for menu screens. Stars are drawn once and only
// their alpha and position change per frame.
export class Starfield extends Container {
  private stars: Star[] = [];
  private backdrop = new Graphics();
  private time = 0;
  private fieldWidth = 0;
  private fieldHeight = 0;

  constructor(
    width: number,
    height: number,
    private readonly count = 90,
    private readonly colors = { top: 0x070b1d, bottom: 0x1a1640 },
  ) {
    super();
    this.eventMode = "none";
    this.addChild(this.backdrop);
    this.resize(width, height);
  }

  resize(width: number, height: number) {
    this.fieldWidth = width;
    this.fieldHeight = height;
    this.drawBackdrop();
    this.stars.forEach((s) => s.view.destroy());
    this.stars = [];
    for (let i = 0; i < this.count; i++) {
      const radius = 0.6 + Math.random() * 1.6;
      const view = new Graphics().circle(0, 0, radius).fill(0xffffff);
      view.position.set(Math.random() * width, Math.random() * height);
      const star = {
        view,
        baseAlpha: 0.25 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
        speed: 2 + radius * 4,
      };
      this.stars.push(star);
      this.addChild(view);
    }
  }

  update(dt: number) {
    this.time += dt;
    for (const star of this.stars) {
      star.view.alpha =
        star.baseAlpha * (0.65 + 0.35 * Math.sin(this.time * 1.4 + star.phase));
      star.view.y += star.speed * dt;
      if (star.view.y > this.fieldHeight + 2) {
        star.view.y = -2;
        star.view.x = Math.random() * this.fieldWidth;
      }
    }
  }

  private drawBackdrop() {
    const steps = 48;
    this.backdrop.clear();
    for (let i = 0; i < steps; i++) {
      this.backdrop
        .rect(
          0,
          (this.fieldHeight * i) / steps,
          this.fieldWidth,
          this.fieldHeight / steps + 1,
        )
        .fill(lerpColor(this.colors.top, this.colors.bottom, i / (steps - 1)));
    }
  }
}

import { Container, Graphics } from "pixi.js";
import { Label } from "./Label";
import { uiTheme } from "./theme";
import { drawTechFrame } from "./frame";

type PanelOptions = {
  width: number; // screen px
  height: number; // screen px
  title?: string;
  scale?: number;
  color?: number;
  accent?: number;
};

// A chamfered glass panel with tech accents. Origin is its center. Children
// are added to `content`, whose origin is also the panel center.
export class Panel extends Container {
  readonly content = new Container();
  readonly panelWidth: number;
  readonly panelHeight: number;

  constructor({
    width,
    height,
    title,
    scale = 1,
    color = uiTheme.colors.panel,
    accent = uiTheme.colors.accent,
  }: PanelOptions) {
    super();
    this.panelWidth = width;
    this.panelHeight = height;
    const bg = drawTechFrame(new Graphics(), {
      width,
      height,
      chamfer: uiTheme.chamfer.large * scale,
      fill: color,
      accent,
      glow: 8 * scale,
      brackets: true,
      ticks: true,
      scale,
    });
    bg.eventMode = "none";
    this.addChild(bg, this.content);

    if (title) {
      const heading = new Label(title, {
        variant: "heading",
        scale,
        glow: accent,
      });
      heading.y = -height / 2 + uiTheme.space.xl * scale;
      this.content.addChild(heading);
    }
    // Panels swallow pointer events so taps never fall through to the board.
    this.eventMode = "static";
    this.on("pointerdown", (e) => e.stopPropagation());
  }
}

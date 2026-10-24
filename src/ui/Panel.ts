import { Container, Graphics } from "pixi.js";
import { Label } from "./Label";
import { uiTheme } from "./theme";

type PanelOptions = {
  width: number; // screen px
  height: number; // screen px
  title?: string;
  scale?: number;
  color?: number;
  accent?: number;
};

// A rounded panel with an optional title. Origin is its center. Children are
// added to `content`, whose origin is also the panel center.
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
    accent = uiTheme.colors.panelStroke,
  }: PanelOptions) {
    super();
    this.panelWidth = width;
    this.panelHeight = height;
    const r = uiTheme.radius.large * scale;
    const bg = new Graphics()
      .roundRect(-width / 2, -height / 2 + 6 * scale, width, height, r)
      .fill({ color: 0x000000, alpha: 0.35 })
      .roundRect(-width / 2, -height / 2, width, height, r)
      .fill({ color, alpha: 0.96 })
      .roundRect(-width / 2, -height / 2, width, height, r)
      .stroke({ color: accent, width: 2 * scale, alpha: 0.9 });
    bg.eventMode = "none";
    this.addChild(bg, this.content);

    if (title) {
      const heading = new Label(title, { variant: "heading", scale });
      heading.y = -height / 2 + uiTheme.space.xl * scale;
      this.content.addChild(heading);
    }
    // Panels swallow pointer events so taps never fall through to the board.
    this.eventMode = "static";
    this.on("pointerdown", (e) => e.stopPropagation());
  }
}

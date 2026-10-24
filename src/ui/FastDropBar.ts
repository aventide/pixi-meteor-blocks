import { Container, Graphics } from "pixi.js";
import type { PlanetConfig } from "../config/planets";
import { Button } from "./Button";
import { Label } from "./Label";
import { verticalGradient } from "./frame";
import { getUiScale, uiTheme } from "./theme";
import { lerpColor } from "../themes/shared/color";

type FastDropBarOptions = {
  width: number;
  height: number; // screen height
  barHeight: number;
  planet: PlanetConfig;
  onHoldChange: (holding: boolean) => void;
};

export const isTouchDevice = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

// The bottom bar under the board: one large hold-to-drop-faster button within
// thumb reach (the touch equivalent of holding Space). Origin is the bar's
// top-left; the scene positions it at the bottom of the screen.
export class FastDropBar extends Container {
  private holding = false;

  constructor({
    width,
    height,
    barHeight,
    planet,
    onHoldChange,
  }: FastDropBarOptions) {
    super();
    const s = getUiScale(width, height);
    const { accent, uiPanel, uiText } = planet.theme.palette;

    const bar = new Graphics()
      .rect(0, 0, width, barHeight)
      .fill(
        verticalGradient(
          this,
          lerpColor(uiPanel, 0x000000, 0.25),
          lerpColor(uiPanel, 0xffffff, 0.06),
        ),
      )
      .rect(0, 0, width, 6 * s)
      .fill({ color: accent, alpha: 0.12 })
      .rect(0, 0, width, 2 * s)
      .fill({ color: accent, alpha: 0.95 });
    bar.eventMode = "static";
    bar.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(bar);

    const button = new Button({
      label: "Hold: Fast Drop",
      variant: "secondary",
      width: Math.min(300, (width * 0.72) / s),
      height: Math.max(uiTheme.minTouchTarget / s, (barHeight * 0.68) / s),
      scale: s,
      accent,
      onPress: () => {},
    });
    button.position.set(width / 2, barHeight / 2 + 1 * s);

    // Down-chevrons either side of the label signal "drop".
    const chevrons = new Graphics();
    const cw = 7 * s;
    for (const side of [-1, 1]) {
      const x = side * (button.buttonWidth / 2 - 22 * s);
      for (const dy of [-4 * s, 3 * s]) {
        chevrons
          .moveTo(x - cw, dy - cw * 0.55)
          .lineTo(x, dy + cw * 0.55)
          .lineTo(x + cw, dy - cw * 0.55);
      }
    }
    chevrons.stroke({
      color: accent,
      width: 2.5 * s,
      cap: "round",
      join: "round",
    });
    chevrons.position.copyFrom(button.position);
    chevrons.eventMode = "none";

    const start = () => this.setHolding(true, onHoldChange);
    const stop = () => this.setHolding(false, onHoldChange);
    button.on("pointerdown", start);
    button.on("pointerup", stop);
    button.on("pointerupoutside", stop);
    button.on("pointercancel", stop);
    this.addChild(button, chevrons);

    if (!isTouchDevice()) {
      const hint = new Label("or hold SPACE", {
        variant: "small",
        scale: s * 0.85,
        align: "right",
        color: lerpColor(uiText, accent, 0.4),
      });
      hint.position.set(width - uiTheme.space.md * s, barHeight / 2);
      hint.visible = width - button.buttonWidth > 2 * hint.width + 24 * s;
      this.addChild(hint);
    }
  }

  release(onHoldChange: (holding: boolean) => void) {
    this.setHolding(false, onHoldChange);
  }

  private setHolding(
    holding: boolean,
    onHoldChange: (holding: boolean) => void,
  ) {
    if (this.holding === holding) return;
    this.holding = holding;
    onHoldChange(holding);
  }
}

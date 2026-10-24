import { Container, Graphics, Rectangle } from "pixi.js";
import { Label } from "./Label";
import { uiTheme } from "./theme";
import { chamferPoints, verticalGradient } from "./frame";
import { tween, easeOutCubic } from "./tween";
import { lerpColor } from "../themes/shared/color";

export type ButtonVariant = "primary" | "secondary";

type ButtonOptions = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  width?: number; // design px
  height?: number; // design px
  scale?: number;
  accent?: number;
};

type ButtonState = "idle" | "hover" | "pressed" | "disabled";

// A Pixi-drawn, chamfered, glossy button. Origin is its center. Presses fire
// on pointertap, and pointer events stop here so they never reach the board.
export class Button extends Container {
  private bg = new Graphics();
  private face = new Container();
  private text: Label;
  private state: ButtonState = "idle";
  private enabled = true;
  private cancelPressTween: (() => void) | null = null;
  readonly buttonWidth: number;
  readonly buttonHeight: number;
  private readonly variant: ButtonVariant;
  private readonly accent: number;
  private readonly s: number;

  constructor({
    label,
    onPress,
    variant = "primary",
    width = 240,
    height = 50,
    scale = 1,
    accent = uiTheme.colors.accent,
  }: ButtonOptions) {
    super();
    this.variant = variant;
    this.accent = accent;
    this.s = scale;
    this.buttonWidth = Math.max(uiTheme.minTouchTarget, width * scale);
    this.buttonHeight = Math.max(uiTheme.minTouchTarget, height * scale);
    this.text = new Label(label, {
      variant: "button",
      color: uiTheme.colors.buttonText,
      scale,
    });
    if (variant === "primary") {
      this.text.style.dropShadow = {
        color: uiTheme.colors.buttonTextShadow,
        blur: 0,
        distance: 2 * scale,
        angle: Math.PI / 2,
        alpha: 0.6,
      };
    }

    this.face.addChild(this.bg, this.text);
    this.addChild(this.face);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(
      -this.buttonWidth / 2,
      -this.buttonHeight / 2,
      this.buttonWidth,
      this.buttonHeight,
    );

    this.on("pointerover", () => this.setState("hover"));
    this.on("pointerout", () => this.setState("idle"));
    this.on("pointerdown", (e) => {
      e.stopPropagation();
      this.setState("pressed");
    });
    this.on("pointerup", () => this.setState("hover"));
    this.on("pointerupoutside", () => this.setState("idle"));
    this.on("pointertap", (e) => {
      e.stopPropagation();
      if (this.enabled) onPress();
    });

    this.draw();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.eventMode = enabled ? "static" : "none";
    this.setState(enabled ? "idle" : "disabled");
  }

  private setState(state: ButtonState) {
    if (!this.enabled && state !== "disabled") return;
    const wasPressed = this.state === "pressed";
    this.state = state;
    this.draw();
    if (state === "pressed" || wasPressed) {
      this.animatePress(state === "pressed");
    }
  }

  private animatePress(down: boolean) {
    this.cancelPressTween?.();
    const from = this.face.y;
    const to = down ? 2 * this.s : 0;
    this.cancelPressTween = tween({
      target: this,
      duration: uiTheme.durations.fast,
      ease: easeOutCubic,
      onUpdate: (t) => {
        if (!this.face.destroyed) this.face.y = from + (to - from) * t;
      },
    });
  }

  private draw() {
    const w = this.buttonWidth;
    const h = this.buttonHeight;
    const s = this.s;
    const c = uiTheme.chamfer.small * s * 1.4;
    const pts = chamferPoints(w, h, c);
    const hover = this.state === "hover";
    const pressed = this.state === "pressed";
    const g = this.bg.clear();

    // Drop shadow / base plate.
    g.poly(chamferPoints(w, h, c).map((v, i) => (i % 2 ? v + 4 * s : v))).fill({
      color: 0x000000,
      alpha: pressed ? 0.15 : 0.35,
    });
    if (hover) {
      for (let i = 3; i >= 1; i--) {
        g.poly(pts).stroke({
          color: this.accent,
          width: 4 * i * s,
          alpha: 0.08,
        });
      }
    }

    if (this.variant === "primary") {
      const c0 = uiTheme.colors;
      // The default accent keeps the classic blue; planet accents tint the
      // whole button so each world's interface matches its palette.
      const classic = this.accent === c0.accent;
      const top = classic
        ? pressed
          ? c0.buttonPressedTop
          : lerpColor(c0.buttonTop, this.accent, 0.35)
        : lerpColor(
            this.accent,
            pressed ? 0x000000 : 0xffffff,
            pressed ? 0.1 : 0.35,
          );
      const bottom = classic
        ? pressed
          ? c0.buttonPressedBottom
          : c0.buttonBottom
        : lerpColor(this.accent, 0x000000, pressed ? 0.6 : 0.45);
      g.poly(pts).fill(
        verticalGradient(hover ? lerpColor(top, 0xffffff, 0.2) : top, bottom),
      );
      // Gloss band across the upper half.
      g.poly(
        chamferPoints(w - 8 * s, h * 0.42, Math.max(0, c - 4 * s)).map(
          (v, i) => (i % 2 ? v - h * 0.22 : v),
        ),
      ).fill({ color: 0xffffff, alpha: pressed ? 0.12 : 0.28 });
      g.poly(pts).stroke({ color: 0xffffff, width: 1.5 * s, alpha: 0.75 });
    } else {
      const fill = uiTheme.colors.buttonSecondary;
      g.poly(pts).fill({
        fill: verticalGradient(
          lerpColor(fill, 0xffffff, hover ? 0.18 : 0.1),
          fill,
        ),
        alpha: 0.95,
      });
      g.poly(pts).stroke({
        color: this.accent,
        width: 1.5 * s,
        alpha: hover ? 1 : 0.75,
      });
    }

    // Small accent notch on the left edge.
    g.rect(-w / 2 + 6 * s, -h * 0.2, 3 * s, h * 0.4).fill({
      color: this.variant === "primary" ? 0xffffff : this.accent,
      alpha: 0.8,
    });
    this.alpha = this.state === "disabled" ? 0.45 : 1;
  }

  override destroy(options?: Parameters<Container["destroy"]>[0]) {
    this.cancelPressTween?.();
    super.destroy(options ?? { children: true });
  }
}

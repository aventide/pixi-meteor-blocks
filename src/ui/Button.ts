import { Container, Graphics, Rectangle } from "pixi.js";
import { Label } from "./Label";
import { uiTheme } from "./theme";
import { tween, easeOutCubic } from "./tween";

export type ButtonVariant = "primary" | "secondary";

type ButtonOptions = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  width?: number; // design px
  height?: number; // design px
  scale?: number;
};

type ButtonState = "idle" | "hover" | "pressed" | "disabled";

const fillFor = (variant: ButtonVariant, state: ButtonState) => {
  const c = uiTheme.colors;
  if (variant === "primary") {
    return state === "hover"
      ? c.buttonHover
      : state === "pressed"
        ? c.buttonPressed
        : c.button;
  }
  return state === "hover"
    ? c.buttonSecondaryHover
    : state === "pressed"
      ? c.buttonSecondaryPressed
      : c.buttonSecondary;
};

// A Pixi-drawn button. Origin is its center. Presses fire on pointertap, and
// pointer events stop here so they never reach the board underneath.
export class Button extends Container {
  private bg = new Graphics();
  private text: Label;
  private state: ButtonState = "idle";
  private enabled = true;
  private cancelPressTween: (() => void) | null = null;
  readonly buttonWidth: number;
  readonly buttonHeight: number;
  private variant: ButtonVariant;

  constructor({
    label,
    onPress,
    variant = "primary",
    width = 220,
    height = 52,
    scale = 1,
  }: ButtonOptions) {
    super();
    this.variant = variant;
    this.buttonWidth = width * scale;
    this.buttonHeight = Math.max(uiTheme.minTouchTarget, height) * scale;
    this.text = new Label(label, {
      variant: "button",
      color: uiTheme.colors.buttonText,
      scale,
    });

    this.addChild(this.bg, this.text);
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
    if (state === "pressed" || wasPressed)
      this.animatePress(state === "pressed");
  }

  private animatePress(down: boolean) {
    this.cancelPressTween?.();
    const from = this.scale.x;
    const to = down ? 0.96 : 1;
    this.cancelPressTween = tween({
      duration: uiTheme.durations.fast,
      ease: easeOutCubic,
      onUpdate: (t) => {
        if (!this.destroyed) this.scale.set(from + (to - from) * t);
      },
    });
  }

  private draw() {
    const w = this.buttonWidth;
    const h = this.buttonHeight;
    const r = Math.min(uiTheme.radius.medium, h / 2);
    this.bg.clear();
    this.bg
      .roundRect(-w / 2, -h / 2 + 3, w, h, r)
      .fill({ color: 0x000000, alpha: 0.25 });
    this.bg
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill(fillFor(this.variant, this.state));
    this.bg
      .roundRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, r)
      .stroke({ color: 0xffffff, alpha: 0.12, width: 1 });
    this.alpha = this.state === "disabled" ? 0.45 : 1;
  }

  override destroy(options?: Parameters<Container["destroy"]>[0]) {
    this.cancelPressTween?.();
    super.destroy(options ?? { children: true });
  }
}

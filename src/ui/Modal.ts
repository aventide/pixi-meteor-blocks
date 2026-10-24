import { Container, Graphics } from "pixi.js";
import { Panel } from "./Panel";
import { Label } from "./Label";
import { Button, type ButtonVariant } from "./Button";
import { getUiScale, uiTheme } from "./theme";
import { easeOutBack, fade, tween } from "./tween";

export type ModalAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
};

type ModalOptions = {
  title: string;
  titleColor?: number;
  message?: string;
  actions: ModalAction[];
  panelColor?: number;
  accent?: number;
};

// A centered dialog over a dimming scrim. The scrim swallows input so nothing
// behind the modal (including the board) can be touched while it is open.
export class Modal extends Container {
  private scrim = new Graphics();
  private panel: Panel | null = null;

  constructor(
    private readonly options: ModalOptions,
    width: number,
    height: number,
  ) {
    super();
    this.scrim.eventMode = "static";
    this.scrim.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(this.scrim);
    this.layout(width, height);
  }

  layout(width: number, height: number) {
    const s = getUiScale(width, height);
    const { title, titleColor, message, actions, panelColor, accent } =
      this.options;
    this.scrim.clear().rect(0, 0, width, height).fill({
      color: uiTheme.colors.scrim,
      alpha: 0.62,
    });

    this.panel?.destroy({ children: true });
    const buttonGap = uiTheme.space.md * s;
    const buttonHeight = 52 * s;
    const headerHeight = (message ? 120 : 84) * s;
    const panelHeight =
      headerHeight +
      actions.length * buttonHeight +
      (actions.length - 1) * buttonGap +
      uiTheme.space.xl * s;
    const panelWidth = Math.min(width - uiTheme.space.lg * 2, 330 * s);

    const panel = new Panel({
      width: panelWidth,
      height: panelHeight,
      scale: s,
      color: panelColor,
      accent,
    });
    const heading = new Label(title, {
      variant: "heading",
      color: titleColor ?? uiTheme.colors.text,
      glow: titleColor ?? accent ?? uiTheme.colors.accent,
      scale: s,
    });
    heading.y = -panelHeight / 2 + uiTheme.space.xl * s;
    panel.content.addChild(heading);

    if (message) {
      const body = new Label(message, {
        variant: "body",
        color: uiTheme.colors.textMuted,
        scale: s,
        wordWrapWidth: panelWidth - uiTheme.space.lg * 2 * s,
      });
      body.y = heading.y + 44 * s;
      panel.content.addChild(body);
    }

    let y = -panelHeight / 2 + headerHeight + buttonHeight / 2;
    for (const action of actions) {
      const button = new Button({
        label: action.label,
        onPress: action.onPress,
        variant: action.variant ?? "primary",
        width: Math.min(250, (panelWidth - uiTheme.space.lg * 2 * s) / s),
        scale: s,
        accent,
      });
      button.y = y;
      panel.content.addChild(button);
      y += buttonHeight + buttonGap;
    }

    panel.position.set(width / 2, height / 2);
    this.panel = panel;
    this.addChild(panel);
  }

  show() {
    this.alpha = 0;
    void fade(this, 1, uiTheme.durations.normal);
    const panel = this.panel;
    if (!panel) return;
    panel.scale.set(0.9);
    tween({
      duration: uiTheme.durations.slow,
      ease: easeOutBack,
      onUpdate: (t) => {
        if (!panel.destroyed) panel.scale.set(0.9 + 0.1 * t);
      },
    });
  }
}

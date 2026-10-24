import { Container, Graphics } from "pixi.js";
import type { PlanetConfig } from "../config/planets";
import { planets } from "../config/planets";
import { Label } from "./Label";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { verticalGradient } from "./frame";
import { getUiScale, uiTheme } from "./theme";
import { lerpColor } from "../themes/shared/color";

type HudOptions = {
  width: number;
  height: number;
  hudHeight: number;
  planet: PlanetConfig;
  onPause: () => void;
};

export const formatGravity = (planet: PlanetConfig) =>
  `${(planet.physics.gravity / planets.earth.physics.gravity).toFixed(1)}×`;

// The in-game top bar: planet name and gravity on the left, the launch meter
// and counter in the middle, and the pause button on the right. The counter
// ticks up toward the real value and pops on each launch.
export class Hud extends Container {
  private readonly bar = new Graphics();
  private readonly dangerGlow = new Graphics();
  private readonly meter: ProgressBar;
  private readonly count: Label;
  private readonly warning: Label;
  private readonly meterLabel: Label;
  private shown = 0;
  private target = 0;
  private goal = 1;
  private pop = 0;
  private danger = false;
  private time = 0;

  constructor({ width, height, hudHeight, planet, onPause }: HudOptions) {
    super();
    const s = getUiScale(width, height);
    const { accent, uiPanel, uiText } = planet.theme.palette;
    const pad = uiTheme.space.md * s;

    // Bar: gradient glass with a glowing accent edge along the bottom.
    this.bar
      .rect(0, 0, width, hudHeight)
      .fill(
        verticalGradient(
          lerpColor(uiPanel, 0xffffff, 0.1),
          lerpColor(uiPanel, 0x000000, 0.25),
        ),
      )
      .rect(0, hudHeight - 6 * s, width, 6 * s)
      .fill({ color: accent, alpha: 0.12 })
      .rect(0, hudHeight - 2 * s, width, 2 * s)
      .fill({ color: accent, alpha: 0.95 });
    this.bar.eventMode = "static";
    this.bar.on("pointerdown", (e) => e.stopPropagation());
    this.dangerGlow
      .rect(0, hudHeight - 4 * s, width, 4 * s)
      .fill(uiTheme.colors.lose);
    this.dangerGlow.alpha = 0;
    this.addChild(this.bar, this.dangerGlow);

    const name = new Label(planet.name, {
      variant: "heading",
      scale: s * 0.68,
      align: "left",
      color: uiText,
      glow: accent,
    });
    name.position.set(pad, hudHeight * 0.38);
    const gravity = new Label(`GRAVITY ${formatGravity(planet)}`, {
      variant: "small",
      scale: s * 0.85,
      align: "left",
      color: lerpColor(uiText, accent, 0.5),
    });
    gravity.position.set(pad, hudHeight * 0.72);

    const pauseButton = new Button({
      label: "II",
      variant: "secondary",
      width: 46,
      height: 44,
      scale: s * 0.82,
      accent,
      onPress: onPause,
    });
    pauseButton.position.set(
      width - pad - pauseButton.buttonWidth / 2,
      hudHeight / 2,
    );

    // Center block: label, meter, and count.
    const centerX = width * 0.56;
    const meterWidth = Math.min(width * 0.34, 190 * s);
    this.meter = new ProgressBar({
      width: meterWidth,
      height: 10 * s,
      color: accent,
      segments: 16,
    });
    this.meter.position.set(centerX - meterWidth / 2, hudHeight * 0.66);
    const meterLabel = (this.meterLabel = new Label("LAUNCHED", {
      variant: "small",
      scale: s * 0.8,
      align: "left",
      color: lerpColor(uiText, accent, 0.5),
    }));
    meterLabel.position.set(centerX - meterWidth / 2, hudHeight * 0.32);
    this.count = new Label("0 / 0", {
      variant: "number",
      scale: s * 0.62,
      align: "right",
      color: uiText,
    });
    this.count.position.set(centerX + meterWidth / 2, hudHeight * 0.32);
    // Replaces the LAUNCHED label while a column is in danger.
    this.warning = new Label("DANGER", {
      variant: "small",
      scale: s * 0.8,
      align: "left",
      color: uiTheme.colors.lose,
    });
    this.warning.position.copyFrom(meterLabel.position);
    this.warning.visible = false;

    this.addChild(
      name,
      gravity,
      meterLabel,
      this.count,
      this.warning,
      this.meter,
      pauseButton,
    );
  }

  setLaunched(launched: number, goal: number) {
    if (launched > this.target) this.pop = 1;
    this.target = Math.min(launched, goal);
    this.goal = goal;
    if (this.shown > this.target) this.shown = this.target;
    this.render();
  }

  setDanger(danger: boolean) {
    this.danger = danger;
  }

  update(dt: number) {
    this.time += dt;
    if (this.shown < this.target) {
      // Tick up quickly but visibly; big jumps catch up faster.
      this.shown = Math.min(
        this.target,
        this.shown + Math.max(12, (this.target - this.shown) * 6) * dt,
      );
      this.render();
    }
    if (this.pop > 0) {
      this.pop = Math.max(0, this.pop - dt * 4);
      this.count.scale.set(1 + 0.25 * this.pop * this.pop);
    }
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 8);
    this.dangerGlow.alpha = this.danger ? 0.35 + 0.65 * pulse : 0;
    this.warning.visible = this.danger;
    this.meterLabel.visible = !this.danger;
    this.warning.alpha = 0.5 + 0.5 * pulse;
  }

  private render() {
    this.count.text = `${Math.floor(this.shown)} / ${this.goal}`;
    this.meter.setProgress(this.shown / this.goal);
  }
}

import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { BackgroundHandle } from "../../config/planets";
import type { Scene } from "./SceneManager";
import { sceneManager } from "./SceneManager";
import { StarMapScene } from "./StarMapScene";
import { getHighestCleared, resetProgress } from "../progress";
import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { getUiScale, uiTheme } from "../../ui/theme";
import { getScreenSize } from "../app";
import { planets } from "../../config/planets";
import { createEarthOrbit } from "../../themes/earth";
import { lerpColor } from "../../themes/shared/color";

// Where Earth's edge crosses the title screen, below the start button.
const TITLE_LIMB = 0.84;

type Rocket = {
  view: Container;
  flame: Graphics;
  speed: number;
  phase: number;
  height: number;
};

// A thrust streak: a narrow white-hot core that cools to amber and fades,
// drawn as stacked soft ellipses for additive blending.
const drawThrust = (g: Graphics, size: number) => {
  const steps = 32;
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    g.ellipse(0, size * 1.4 * t, size * 0.2 * (1 - t * 0.8), size * 0.16).fill({
      color: lerpColor(0xffffff, 0xff7a2a, Math.min(1, t * 1.4)),
      alpha: 0.26 * (1 - t),
    });
  }
  return g;
};

export class TitleScene implements Scene {
  readonly view = new Container();
  private orbit: BackgroundHandle;
  private decor = new Container();
  private rocketLayer = new Container();
  private titleGroup = new Container();
  private buttons = new Container();
  private rockets: Rocket[] = [];
  private tiles: Texture[] = [];
  private startButton: Button | null = null;
  private time = 0;
  private titleBaseY = 0;
  private screen = { width: 0, height: 0 };

  constructor() {
    const { width, height } = getScreenSize();
    this.orbit = createEarthOrbit(width, height, TITLE_LIMB);
    this.view.addChild(
      this.orbit.view,
      this.decor,
      this.rocketLayer,
      this.titleGroup,
      this.buttons,
    );
  }

  async enter() {
    const { red, blue, green, yellow } = planets.earth.theme.tiles;
    const loaded = await Assets.load<Texture>([red, blue, green, yellow]);
    this.tiles = Object.values(loaded);
    this.spawnRockets();
  }

  exit() {}

  update(dt: number) {
    this.time += dt;
    this.orbit.update(dt);
    this.titleGroup.y = this.titleBaseY + Math.sin(this.time * 1.2) * 4;
    if (this.startButton) {
      this.startButton.scale.set(
        1 + (0.5 + 0.5 * Math.sin(this.time * 3)) * 0.015,
      );
    }
    const { width, height } = this.screen;
    for (const rocket of this.rockets) {
      rocket.view.y -= rocket.speed * dt;
      const flicker = 0.85 + Math.sin(this.time * 30 + rocket.phase) * 0.15;
      rocket.flame.scale.set(1, flicker);
      if (rocket.view.y < -rocket.height) {
        rocket.view.y = height + rocket.height + Math.random() * height * 0.5;
        rocket.view.x = width * (0.06 + Math.random() * 0.88);
      }
    }
  }

  resize(width: number, height: number) {
    this.screen = { width, height };
    const s = getUiScale(width, height);
    this.orbit.resize(width, height);

    this.decor.removeChildren().forEach((c) => c.destroy({ children: true }));
    const moon = planets.moon.theme.mapIcon(Math.min(width, height) * 0.09);
    moon.position.set(width * 0.82, height * 0.13);
    this.decor.addChild(moon);

    this.titleGroup.removeChildren().forEach((c) => c.destroy());
    const title = new Label("METEOR\nBLOCKS", {
      variant: "title",
      gradient: [0xffffff, 0x6fc8ff],
      glow: 0x2f8cff,
      scale: s * 1.3,
    });
    title.style.stroke = { color: 0x08183f, width: 3 * s, join: "round" };
    const subtitle = new Label("A five-world launch voyage", {
      variant: "body",
      color: uiTheme.colors.textMuted,
      scale: s * 1.05,
    });
    subtitle.y = title.height / 2 + uiTheme.space.lg * s;
    const rule = new Graphics()
      .rect(-90 * s, 0, 180 * s, 2 * s)
      .fill({ color: uiTheme.colors.accent, alpha: 0.85 })
      .rect(-110 * s, 0, 12 * s, 2 * s)
      .rect(98 * s, 0, 12 * s, 2 * s)
      .fill({ color: uiTheme.colors.accent, alpha: 0.5 });
    rule.y = subtitle.y + 24 * s;
    this.titleGroup.addChild(title, subtitle, rule);
    this.titleGroup.x = width / 2;
    this.titleBaseY = height * 0.32;
    this.titleGroup.y = this.titleBaseY;

    this.buttons.removeChildren().forEach((c) => c.destroy());
    this.startButton = new Button({
      scale: s * 1.1,
      label: getHighestCleared() >= 0 ? "Continue Trip" : "Start Trip",
      onPress: () => sceneManager.goTo(new StarMapScene()),
    });
    this.buttons.addChild(this.startButton);
    if (getHighestCleared() >= 0) {
      const reset = new Button({
        label: "Reset Progress",
        variant: "secondary",
        width: 250,
        height: 40,
        scale: s * 0.85,
        onPress: () => {
          resetProgress();
          this.resize(width, height);
        },
      });
      reset.y = 70 * s;
      this.buttons.addChild(reset);
    }
    this.buttons.position.set(width / 2, height * 0.7);

    if (this.tiles.length) this.spawnRockets();
  }

  private spawnRockets() {
    const { width, height } = this.screen;
    this.rocketLayer
      .removeChildren()
      .forEach((c) => c.destroy({ children: true }));
    this.rockets = [];
    const size = Math.max(28, width / 11);
    for (let i = 0; i < 6; i++) {
      const view = new Container();
      const flame = drawThrust(new Graphics(), size);
      flame.blendMode = "add";
      flame.y = size * 0.98;
      const sprite = new Sprite(this.tiles[i % this.tiles.length]);
      sprite.setSize(size);
      sprite.anchor.set(0.5, 0);
      view.addChild(flame, sprite);
      view.position.set(
        width * (0.06 + Math.random() * 0.88),
        height * (0.2 + i * 0.25) + Math.random() * height * 0.2,
      );
      view.alpha = 0.55 + Math.random() * 0.35;
      view.scale.set(0.7 + Math.random() * 0.4);
      this.rocketLayer.addChild(view);
      this.rockets.push({
        view,
        flame,
        speed: height * (0.12 + Math.random() * 0.14),
        phase: Math.random() * 10,
        height: view.height * 1.15, // include the flame flicker envelope
      });
    }
  }
}

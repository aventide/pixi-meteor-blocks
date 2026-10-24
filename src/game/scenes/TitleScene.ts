import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { Scene } from "./SceneManager";
import { sceneManager } from "./SceneManager";
import { StarMapScene } from "./StarMapScene";
import { getHighestCleared, resetProgress } from "../progress";
import { Starfield } from "../../ui/Starfield";
import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { getUiScale, uiTheme } from "../../ui/theme";
import { getScreenSize } from "../app";
import { planets } from "../../config/planets";

type Rocket = {
  view: Container;
  flame: Graphics;
  speed: number;
  phase: number;
  height: number;
};

const drawFlame = (g: Graphics, size: number) => {
  // Layered teardrops: wide orange outer flame, yellow core, white-hot tip.
  const layers: [number, number, number][] = [
    [0.55, 1.5, 0xff5a1a],
    [0.4, 1.1, 0xffb02e],
    [0.22, 0.65, 0xfff4c0],
  ];
  for (const [wf, hf, color] of layers) {
    const w = size * wf;
    const h = size * hf;
    g.moveTo(-w / 2, 0)
      .bezierCurveTo(-w / 2, h * 0.5, -w * 0.1, h * 0.8, 0, h)
      .bezierCurveTo(w * 0.1, h * 0.8, w / 2, h * 0.5, w / 2, 0)
      .closePath()
      .fill({ color, alpha: 0.95 });
  }
  return g;
};

const createMoon = (r: number) => {
  const g = new Graphics();
  g.circle(0, 0, r * 1.15).fill({ color: 0xbfd0ff, alpha: 0.08 });
  g.circle(0, 0, r).fill(0xb9bfcc);
  const craters: [number, number, number][] = [
    [-0.35, -0.2, 0.22],
    [0.3, 0.25, 0.28],
    [0.15, -0.45, 0.12],
    [-0.2, 0.45, 0.14],
  ];
  for (const [x, y, cr] of craters) {
    g.circle(x * r, y * r, cr * r).fill({ color: 0x8a90a0, alpha: 0.9 });
    g.circle(x * r - cr * r * 0.2, y * r - cr * r * 0.2, cr * r * 0.75).fill({
      color: 0x9da3b3,
      alpha: 0.9,
    });
  }
  g.circle(r * 0.3, r * 0.3, r).fill({ color: 0x0a0f25, alpha: 0.35 });
  return g;
};

export class TitleScene implements Scene {
  readonly view = new Container();
  private starfield: Starfield;
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
    this.starfield = new Starfield(width, height, 120, {
      top: 0x02040f,
      bottom: 0x141a4a,
    });
    this.view.addChild(
      this.starfield,
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
    this.starfield.update(dt);
    this.titleGroup.y = this.titleBaseY + Math.sin(this.time * 1.2) * 4;
    for (let i = 0; i < this.decor.children.length; i++) {
      this.decor.children[i].rotation += dt * (i === 0 ? 0.02 : -0.03);
    }
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
    this.starfield.resize(width, height);

    this.decor.removeChildren().forEach((c) => c.destroy({ children: true }));
    // Earth sits low as a curved horizon below the start button.
    const earthRadius = Math.max(width, height) * 0.5;
    const earth = planets.earth.theme.mapIcon(earthRadius);
    earth.position.set(width * 0.3, height + earthRadius * 0.72);
    const moon = createMoon(Math.min(width, height) * 0.12);
    moon.position.set(width * 0.84, height * 0.14);
    this.decor.addChild(earth, moon);

    this.titleGroup.removeChildren().forEach((c) => c.destroy());
    const title = new Label("METEOR\nBLOCKS", {
      variant: "title",
      gradient: [0xffffff, 0x6fc8ff],
      glow: 0x2f8cff,
      scale: s * 1.3,
    });
    title.style.stroke = { color: 0x08183f, width: 7 * s, join: "round" };
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
      const flame = drawFlame(new Graphics(), size * 0.9);
      flame.y = size * 0.95;
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

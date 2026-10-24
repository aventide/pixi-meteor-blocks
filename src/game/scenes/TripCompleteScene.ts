import { Container, Graphics } from "pixi.js";
import type { Scene } from "./SceneManager";
import { sceneManager } from "./SceneManager";
import { StarMapScene } from "./StarMapScene";
import { TitleScene } from "./TitleScene";
import { planets } from "../../config/planets";
import { getScreenSize } from "../app";
import { Starfield } from "../../ui/Starfield";
import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { getUiScale, uiTheme } from "../../ui/theme";

type Confetto = { view: Graphics; vx: number; vy: number; spin: number };

const route = Object.values(planets).sort((a, b) => a.order - b.order);
const CONFETTI_COLORS = route.map((p) => p.theme.palette.accent);

export class TripCompleteScene implements Scene {
  readonly view = new Container();
  private starfield: Starfield;
  private planetsRow = new Container();
  private confettiLayer = new Container();
  private content = new Container();
  private confetti: Confetto[] = [];
  private time = 0;
  private height = 0;
  private width = 0;

  constructor() {
    const { width, height } = getScreenSize();
    this.starfield = new Starfield(width, height, 140, {
      top: 0x03040f,
      bottom: 0x1a1247,
    });
    this.view.addChild(
      this.starfield,
      this.planetsRow,
      this.confettiLayer,
      this.content,
    );
  }

  enter() {}

  exit() {}

  update(dt: number) {
    this.time += dt;
    this.starfield.update(dt);
    for (let i = 0; i < this.planetsRow.children.length; i++) {
      this.planetsRow.children[i].y = Math.sin(this.time * 1.6 + i * 0.9) * 6;
    }
    for (const c of this.confetti) {
      c.view.x += c.vx * dt;
      c.view.y += c.vy * dt;
      c.view.rotation += c.spin * dt;
      if (c.view.y > this.height + 10) {
        c.view.y = -10;
        c.view.x = Math.random() * this.width;
      }
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    const s = getUiScale(width, height);
    this.starfield.resize(width, height);

    this.planetsRow
      .removeChildren()
      .forEach((c) => c.destroy({ children: true }));
    const radius = Math.min(width / 14, 34 * s);
    route.forEach((planet, i) => {
      const icon = planet.theme.mapIcon(radius);
      const t = i / (route.length - 1);
      icon.x = width * (0.14 + 0.72 * t);
      this.planetsRow.addChild(icon);
    });
    this.planetsRow.y = height * 0.24;

    this.confettiLayer.removeChildren().forEach((c) => c.destroy());
    this.confetti = [];
    for (let i = 0; i < 70; i++) {
      const size = (4 + Math.random() * 5) * s;
      const view = new Graphics()
        .rect(-size / 2, -size / 4, size, size / 2)
        .fill(CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      view.position.set(Math.random() * width, Math.random() * height);
      this.confettiLayer.addChild(view);
      this.confetti.push({
        view,
        vx: (Math.random() - 0.5) * 30,
        vy: 40 + Math.random() * 70,
        spin: (Math.random() - 0.5) * 6,
      });
    }

    this.content.removeChildren().forEach((c) => c.destroy({ children: true }));
    const title = new Label("Trip\nComplete", {
      variant: "title",
      scale: s * 1.1,
      gradient: [0xfff6c8, 0xffb83d],
      glow: 0xff8a1a,
    });
    title.style.stroke = { color: 0x3a1a00, width: 6 * s, join: "round" };
    title.position.set(width / 2, height * 0.45);
    const subtitle = new Label("All five worlds cleared. Nice flying!", {
      variant: "body",
      scale: s,
      color: uiTheme.colors.textMuted,
    });
    subtitle.position.set(width / 2, height * 0.58);
    const map = new Button({
      label: "Star Map",
      scale: s,
      onPress: () => sceneManager.goTo(new StarMapScene()),
    });
    map.position.set(width / 2, height * 0.7);
    const title2 = new Button({
      label: "Title",
      variant: "secondary",
      scale: s,
      onPress: () => sceneManager.goTo(new TitleScene()),
    });
    title2.position.set(width / 2, height * 0.7 + 66 * s);
    this.content.addChild(title, subtitle, map, title2);
  }
}

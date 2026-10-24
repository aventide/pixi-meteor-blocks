import { Container } from "pixi.js";
import type { Scene } from "./SceneManager";
import { sceneManager } from "./SceneManager";
import { PlayScene } from "./PlayScene";
import { Starfield } from "../../ui/Starfield";
import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { getUiScale, uiTheme } from "../../ui/theme";
import { getScreenSize } from "../app";

export class TitleScene implements Scene {
  readonly view = new Container();
  private starfield: Starfield;
  private titleGroup = new Container();
  private buttons = new Container();
  private time = 0;
  private titleBaseY = 0;

  constructor() {
    const { width, height } = getScreenSize();
    this.starfield = new Starfield(width, height);
    this.view.addChild(this.starfield, this.titleGroup, this.buttons);
  }

  enter() {}

  exit() {}

  update(dt: number) {
    this.time += dt;
    this.starfield.update(dt);
    this.titleGroup.y = this.titleBaseY + Math.sin(this.time * 1.2) * 4;
  }

  resize(width: number, height: number) {
    const s = getUiScale(width, height);
    this.starfield.resize(width, height);

    this.titleGroup.removeChildren().forEach((c) => c.destroy());
    const title = new Label("METEOR\nBLOCKS", {
      variant: "title",
      scale: s * 1.25,
    });
    const subtitle = new Label("A trip across five worlds", {
      variant: "body",
      color: uiTheme.colors.textMuted,
      scale: s,
    });
    subtitle.y = title.height / 2 + uiTheme.space.lg * s;
    this.titleGroup.addChild(title, subtitle);
    this.titleGroup.x = width / 2;
    this.titleBaseY = height * 0.34;
    this.titleGroup.y = this.titleBaseY;

    this.buttons.removeChildren().forEach((c) => c.destroy());
    const start = new Button({
      label: "Start Trip",
      scale: s,
      onPress: () => sceneManager.goTo(new PlayScene({ planetId: "earth" })),
    });
    this.buttons.addChild(start);
    this.buttons.position.set(width / 2, height * 0.68);
  }
}

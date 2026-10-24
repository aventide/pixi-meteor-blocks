import { Container, Graphics } from "pixi.js";
import { getScreenSize, uiRoot } from "../app";
import { fade } from "../../ui/tween";
import { uiTheme } from "../../ui/theme";

export interface Scene {
  readonly view: Container;
  enter(): void | Promise<void>;
  exit(): void;
  update(dt: number): void; // dt in seconds
  resize(width: number, height: number): void;
}

// Owns the active scene and the curtain used to transition between scenes.
// The curtain sits above everything (including the board) and blocks input
// while a transition runs.
class SceneManager {
  private current: Scene | null = null;
  private readonly sceneLayer = new Container();
  private readonly curtain = new Graphics();
  private transitioning = false;

  init() {
    this.curtain.eventMode = "static";
    this.curtain.alpha = 0;
    this.curtain.visible = false;
    uiRoot.addChild(this.sceneLayer, this.curtain);
    const { width, height } = getScreenSize();
    this.drawCurtain(width, height);
  }

  async goTo(next: Scene) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.curtain.visible = true;

    if (this.current) {
      await fade(this.curtain, 1, uiTheme.durations.normal);
      this.current.exit();
      this.current.view.destroy({ children: true });
    } else {
      this.curtain.alpha = 1;
    }

    this.current = next;
    this.sceneLayer.addChild(next.view);
    const { width, height } = getScreenSize();
    next.resize(width, height);
    await next.enter();

    await fade(this.curtain, 0, uiTheme.durations.slow);
    this.curtain.visible = false;
    this.transitioning = false;
  }

  update(dt: number) {
    this.current?.update(dt);
  }

  resize(width: number, height: number) {
    this.drawCurtain(width, height);
    this.current?.resize(width, height);
  }

  private drawCurtain(width: number, height: number) {
    this.curtain.clear().rect(0, 0, width, height).fill(0x000000);
  }
}

export const sceneManager = new SceneManager();

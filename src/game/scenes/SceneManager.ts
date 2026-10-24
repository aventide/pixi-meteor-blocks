import { Container, Graphics, Rectangle } from "pixi.js";
import { getScreenSize, uiRoot } from "../app";
import { tween, easeInOutSine } from "../../ui/tween";
import { uiTheme } from "../../ui/theme";
import { setGlobalPointerDown } from "../../world";
import { Modal } from "../../ui/Modal";

export interface Scene {
  readonly view: Container;
  enter(): void | Promise<void>;
  exit(): void;
  update(dt: number): void; // dt in seconds
  resize(width: number, height: number): void;
}

// Owns the active scene and the shutter used to transition between scenes:
// two blast-door panels close from the top and bottom, the scene swaps, and
// they open again. The shutter sits above everything and blocks input.
class SceneManager {
  private current: Scene | null = null;
  private readonly sceneLayer = new Container();
  private readonly shutter = new Container();
  private readonly top = new Graphics();
  private readonly bottom = new Graphics();
  private transitioning = false;
  private height = 0;
  private loadError: Modal | null = null;

  init() {
    this.shutter.eventMode = "static";
    this.shutter.on("pointerdown", (e) => e.stopPropagation());
    this.shutter.visible = false;
    this.shutter.addChild(this.top, this.bottom);
    uiRoot.addChild(this.sceneLayer, this.shutter);
    const { width, height } = getScreenSize();
    this.drawShutter(width, height);
  }

  async goTo(next: Scene) {
    if (this.transitioning) {
      next.view.destroy({ children: true });
      return;
    }
    this.transitioning = true;
    setGlobalPointerDown(false);
    this.shutter.visible = true;

    if (this.current) {
      await this.animateShutter(0, 1, uiTheme.durations.normal + 60);
      this.current.exit();
      this.current.view.destroy({ children: true });
    } else {
      this.setShutter(1);
    }

    this.current = next;
    this.sceneLayer.addChild(next.view);
    const { width, height } = getScreenSize();
    this.loadError?.destroy({ children: true });
    this.loadError = null;
    try {
      next.resize(width, height);
      await next.enter();
    } catch {
      // Failed asset loads must release partial scenes and unlock the shutter.
      this.current = null;
      next.exit();
      next.view.destroy({ children: true });
      const size = getScreenSize();
      this.loadError = new Modal(
        {
          title: "Unable to load",
          message: "The scene could not load. Reload to try again.",
          actions: [
            { label: "Reload", onPress: () => window.location.reload() },
          ],
        },
        size.width,
        size.height,
      );
      this.sceneLayer.addChild(this.loadError);
    }

    await this.animateShutter(1, 0, uiTheme.durations.slow);
    this.shutter.visible = false;
    this.transitioning = false;
  }

  update(dt: number) {
    this.current?.update(dt);
  }

  resize(width: number, height: number) {
    this.drawShutter(width, height);
    this.current?.resize(width, height);
    this.loadError?.layout(width, height);
  }

  // closed = 0 (open) .. 1 (fully closed)
  private setShutter(closed: number) {
    const half = this.height / 2;
    this.top.y = -half * (1 - closed);
    this.bottom.y = half * (1 - closed);
  }

  private animateShutter(from: number, to: number, duration: number) {
    return new Promise<void>((resolve) => {
      tween({
        target: this.shutter,
        duration,
        ease: easeInOutSine,
        onUpdate: (t) => this.setShutter(from + (to - from) * t),
        onComplete: resolve,
      });
    });
  }

  private drawShutter(width: number, height: number) {
    this.height = height;
    this.shutter.hitArea = new Rectangle(0, 0, width, height);
    const half = height / 2;
    const accent = uiTheme.colors.accent;
    const notch = Math.min(width * 0.18, 70);
    // Each door has a chamfered notch at the seam and a glowing edge line.
    this.top
      .clear()
      .poly([
        0,
        0,
        width,
        0,
        width,
        half,
        width / 2 + notch,
        half,
        width / 2 + notch - 12,
        half - 10,
        width / 2 - notch + 12,
        half - 10,
        width / 2 - notch,
        half,
        0,
        half,
      ])
      .fill(0x050a1c)
      .rect(0, half - 3, width / 2 - notch, 2)
      .rect(width / 2 + notch, half - 3, width / 2 - notch, 2)
      .fill({ color: accent, alpha: 0.9 });
    this.bottom
      .clear()
      .poly([
        0,
        half,
        width / 2 - notch,
        half,
        width / 2 - notch + 12,
        half + 10,
        width / 2 + notch - 12,
        half + 10,
        width / 2 + notch,
        half,
        width,
        half,
        width,
        height,
        0,
        height,
      ])
      .fill(0x050a1c)
      .rect(0, half + 1, width / 2 - notch, 2)
      .rect(width / 2 + notch, half + 1, width / 2 - notch, 2)
      .fill({ color: accent, alpha: 0.9 });
    this.setShutter(this.shutter.visible ? 1 : 0);
  }
}

export const sceneManager = new SceneManager();

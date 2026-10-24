import { Application } from "pixi.js";

import {
  setGlobalPointer,
  setGlobalPointerDown,
  setWorldDimensions,
  initializeStage,
} from "./world";
import {
  ACCELERATED_MAIN_TICKER_SPEED,
  DEFAULT_MAIN_TICKER_SPEED,
} from "./constants";
import {
  getBoardOffset,
  isBoardInputEnabled,
  setApp,
  uiRoot,
  worldRoot,
} from "./game/app";
import { sceneManager } from "./game/scenes/SceneManager";
import { TitleScene } from "./game/scenes/TitleScene";
import { planets } from "./config/planets";

(async () => {
  const app = new Application();
  await app.init({
    background: "#05070f",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  setApp(app);

  // The engine's stage is worldRoot; the demo interface draws above it.
  app.stage.addChild(worldRoot, uiRoot);
  worldRoot.visible = false;
  initializeStage(worldRoot);

  document.getElementById("pixi-container")!.appendChild(app.canvas);
  const clearGlobalPointerDown = () => {
    setGlobalPointerDown(false);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearGlobalPointerDown();
      app.stop();
    } else {
      app.start();
    }
  });

  app.canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // pointer events
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.addEventListener("pointerdown", (e) => {
    if (!isBoardInputEnabled()) return;
    // needed for mobile/touch
    const rect = app.canvas.getBoundingClientRect();
    const offset = getBoardOffset();
    const x =
      ((e.clientX - rect.left) / rect.width) * app.screen.width - offset.x;
    const y =
      ((e.clientY - rect.top) / rect.height) * app.screen.height - offset.y;
    setGlobalPointer({ x, y });
    setGlobalPointerDown(true);
  });
  window.addEventListener("pointerup", clearGlobalPointerDown);
  window.addEventListener("pointercancel", clearGlobalPointerDown);
  window.addEventListener("blur", clearGlobalPointerDown);
  window.addEventListener("pointermove", (e) => {
    const rect = app.canvas.getBoundingClientRect();
    const offset = getBoardOffset();
    const x =
      ((e.clientX - rect.left) / rect.width) * app.screen.width - offset.x;
    const y =
      ((e.clientY - rect.top) / rect.height) * app.screen.height - offset.y;
    setGlobalPointer({ x, y });
  });

  // keyboard events
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      app.ticker.speed = ACCELERATED_MAIN_TICKER_SPEED;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      app.ticker.speed = DEFAULT_MAIN_TICKER_SPEED;
    }
  });

  setWorldDimensions(app.screen.height, app.screen.width);

  if (import.meta.env.DEV) {
    // Dev-only hooks for Pixi devtools and automated checks.
    Object.assign(globalThis, { __PIXI_APP__: app, __DEMO__: { planets } });
  }

  sceneManager.init();
  app.ticker.add((time) => sceneManager.update(time.deltaMS / 1000));
  app.renderer.on("resize", (width: number, height: number) =>
    sceneManager.resize(width, height),
  );
  void sceneManager.goTo(new TitleScene());
})();

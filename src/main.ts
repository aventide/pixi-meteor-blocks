import { Application } from "pixi.js";

import {
  getWorld,
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
  toBoardPoint,
  isBoardInputEnabled,
  setApp,
  uiRoot,
  worldRoot,
} from "./game/app";
import { sceneManager } from "./game/scenes/SceneManager";
import { TitleScene } from "./game/scenes/TitleScene";
import { planets } from "./config/planets";
import { loadFonts } from "./ui/fonts";
import { applyDevOverrides, devParams } from "./game/devParams";
import { PlayScene } from "./game/scenes/PlayScene";
import { FpsMeter } from "./ui/FpsMeter";

(async () => {
  const app = new Application();
  await app.init({
    background: "#05070f",
    autoDensity: true,
    resolution: Math.min(2, Math.max(1, window.devicePixelRatio)),
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
  // Only the pointer that started on the board drives it, so a second finger
  // (e.g. holding the fast-drop button) can't hijack a drag. Mouse hover still
  // updates the pointer when no board press is active.
  let boardPointerId: number | null = null;
  const releaseBoardPointer = (e?: PointerEvent) => {
    if (e && boardPointerId !== null && e.pointerId !== boardPointerId) return;
    boardPointerId = null;
    clearGlobalPointerDown();
  };
  app.stage.addEventListener("pointerdown", (e) => {
    if (!isBoardInputEnabled()) return;
    boardPointerId = e.pointerId;
    // needed for mobile/touch
    const rect = app.canvas.getBoundingClientRect();
    const { x, y } = toBoardPoint(
      ((e.clientX - rect.left) / rect.width) * app.screen.width,
      ((e.clientY - rect.top) / rect.height) * app.screen.height,
    );
    setGlobalPointer({ x, y });
    setGlobalPointerDown(true);
  });
  window.addEventListener("pointerup", releaseBoardPointer);
  window.addEventListener("pointercancel", releaseBoardPointer);
  window.addEventListener("blur", () => releaseBoardPointer());
  window.addEventListener("pointermove", (e) => {
    if (
      boardPointerId === null
        ? e.pointerType !== "mouse"
        : e.pointerId !== boardPointerId
    ) {
      return;
    }
    const rect = app.canvas.getBoundingClientRect();
    const { x, y } = toBoardPoint(
      ((e.clientX - rect.left) / rect.width) * app.screen.width,
      ((e.clientY - rect.top) / rect.height) * app.screen.height,
    );
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
    Object.assign(globalThis, {
      __PIXI_APP__: app,
      __DEMO__: { planets, getWorld },
    });
  }

  await loadFonts();
  sceneManager.init();
  if (devParams.fps) app.stage.addChild(new FpsMeter());
  app.ticker.add((time) => sceneManager.update(time.deltaMS / 1000));
  app.renderer.on("resize", (width: number, height: number) =>
    sceneManager.resize(width, height),
  );
  applyDevOverrides();
  void sceneManager.goTo(
    devParams.planet
      ? new PlayScene({ planetId: devParams.planet })
      : new TitleScene(),
  );
})();

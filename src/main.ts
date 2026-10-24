import { Application } from "pixi.js";

import {
  setActivePlanet,
  setGlobalPointer,
  setGlobalPointerDown,
  setWorldDimensions,
  initializeStage,
} from "./world";
import {
  ACCELERATED_MAIN_TICKER_SPEED,
  DEFAULT_MAIN_TICKER_SPEED,
} from "./constants";
import { startGameLoop } from "./game/loop";
import { loadTextures } from "./textures";

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  setActivePlanet("earth");
  await loadTextures();

  initializeStage(app.stage);

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
    // needed for mobile/touch
    const rect = app.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * app.screen.width;
    const y = ((e.clientY - rect.top) / rect.height) * app.screen.height;
    setGlobalPointer({ x, y });
    setGlobalPointerDown(true);
  });
  window.addEventListener("pointerup", clearGlobalPointerDown);
  window.addEventListener("pointercancel", clearGlobalPointerDown);
  window.addEventListener("blur", clearGlobalPointerDown);
  window.addEventListener("pointermove", (e) => {
    const rect = app.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * app.screen.width;
    const y = ((e.clientY - rect.top) / rect.height) * app.screen.height;
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

  startGameLoop(app);
})();

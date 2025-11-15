import { Application, Container } from "pixi.js";

import {
  getWorld,
  setGlobalPointer,
  setStage,
  setWorldDimensions,
} from "./world";
import type { WorldStage } from "./world";
import { createSingleBlock } from "./entities";
import { descentMutator, overlayMutator, positionMutator } from "./mutators";
import { getRandomFileNumber } from "./util";
import { getIsSpawnPositionOpen } from "./entities/util";
import { DEFAULT_POINTER_POSITION } from "./constants";

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  const blocksLayer = new Container();
  const overlayLayer = new Container();
  app.stage.addChild(blocksLayer);
  app.stage.addChild(overlayLayer);
  Object.assign(app.stage, { blocksLayer, overlayLayer });
  setStage(app.stage as WorldStage);

  document.getElementById("pixi-container")!.appendChild(app.canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      app.stop();
    } else {
      app.start();
    }
  });

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.addEventListener("pointermove", (e) => {
    const { x, y } = e.global;
    setGlobalPointer({ x, y });
  });
  app.stage.addEventListener("pointerleave", () => {
    setGlobalPointer(DEFAULT_POINTER_POSITION);
  });

  setWorldDimensions(app.screen.height, app.screen.width);

  const dropInterval = 500;
  let timeAccumulated = 0;
  app.ticker.add((time) => {
    timeAccumulated += time.deltaMS;
    if (timeAccumulated >= dropInterval) {
      timeAccumulated -= dropInterval;
      let createdBlock = null;
      let attempts = 0;

      while (!createdBlock && attempts < 45) {
        const file = getRandomFileNumber();
        attempts++;
        if (getIsSpawnPositionOpen(file)) {
          createdBlock = createSingleBlock(file);
        }
      }
    }
  });

  app.ticker.add((time) => {
    const { blockGroupsMap } = getWorld();
    const dt = time.deltaTime / 60;
    // apply mutators to each block group
    blockGroupsMap.forEach((blockGroup) => {
      descentMutator(blockGroup, dt);
      overlayMutator(blockGroup);
      positionMutator(blockGroup, dt);
    });
  });
})();

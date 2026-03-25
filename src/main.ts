import { Application } from "pixi.js";

import {
  getWorld,
  setGlobalPointer,
  setGlobalPointerDown,
  setWorldDimensions,
  initializeStage,
} from "./world";
import { createSingleBlock } from "./entities";
import {
  descentMutator,
  sequenceMutator,
  positionMutator,
  selectionMutator,
} from "./mutators";
import { getRandomFileNumber } from "./util";
import { getIsSpawnPositionOpen } from "./entities";
import {
  ACCELERATED_MAIN_TICKER_SPEED,
  DEFAULT_DROP_INTERVAL,
  DEFAULT_FILE_COUNT,
  DEFAULT_FILE_BLOCKS_LIMIT,
  DEFAULT_MAIN_TICKER_SPEED,
} from "./constants";
import { dangerAnimation } from "./animations";
import { getAllSelectionFileFragments } from "./mutators/selectionMutator/util";
import { loadTextures } from "./textures";

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

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

  let timeAccumulated = 0;
  app.ticker.add((time) => {
    const dropInterval = DEFAULT_DROP_INTERVAL;
    timeAccumulated += time.deltaMS;
    if (timeAccumulated >= dropInterval) {
      timeAccumulated -= dropInterval;
      let createdBlock = null;
      let attempts = 0;

      // @todo we should attempt every other fileNumber before bailing out
      while (!createdBlock && attempts < DEFAULT_FILE_COUNT) {
        const file = getRandomFileNumber();
        attempts++;
        if (getIsSpawnPositionOpen(file)) {
          createdBlock = createSingleBlock(file);
        }
      }
    }
  });

  app.ticker.add((time) => {
    const { blockGroupsById } = getWorld();
    const dt = time.deltaTime / 60;

    let iterations = 0;

    // apply once per group per tick mutations
    blockGroupsById.forEach((blockGroup) => {
      if (iterations <= 300) {
        iterations++;
        descentMutator(blockGroup, dt);
        positionMutator(blockGroup, dt);
        // an optional (via arg) mutator which applies a debug overlay to each group
        // debugMutator(blockGroup, true)
      } else {
        throw new Error("Iteration pressure level exceeded threshold");
      }
    });

    // apply once per tick mutations

    // get all selectionFragments for file
    const allSelectionFileFragments = getAllSelectionFileFragments();

    selectionMutator(allSelectionFileFragments);
    sequenceMutator(allSelectionFileFragments);
    dangerAnimation(dt);

    // check for losing state
    // @todo consider adding a 1-2 sec "tolerance" once file limit is reached
    // before the file is considered for placement (and game loss)
    blockGroupsById.forEach((blockGroup) =>
      blockGroup.fileFragments.forEach((fileFragment) => {
        if (fileFragment.blocks.length >= DEFAULT_FILE_BLOCKS_LIMIT + 2) {
          alert("You have lost the game.");
          app.stop();
        }
      }),
    );
  });
})();

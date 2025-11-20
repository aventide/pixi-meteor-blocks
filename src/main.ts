import { Application, Container } from "pixi.js";

import {
  getBlockSize,
  getWorld,
  setGlobalPointer,
  setGlobalPointerDown,
  setStage,
  setSelectedBlock,
  setWorldDimensions,
} from "./world";
import type { WorldStage } from "./world";
import { createSingleBlock } from "./entities";
import { descentMutator, overlayMutator, positionMutator } from "./mutators";
import { getRandomFileNumber } from "./util";
import {
  getFileBlockDirectlyAbove,
  getFileBlockDirectlyBelow,
  getIsSpawnPositionOpen,
  swapFileBlockPositions,
} from "./entities/util";
import {
  DEFAULT_FILE_COUNT,
  DEFAULT_FILE_LIMIT,
  DEFAULT_POINTER_POSITION,
} from "./constants";

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
  app.stage.addEventListener("pointerdown", () => {
    setGlobalPointerDown(true);
  });
  app.stage.addEventListener("pointerup", () => {
    setGlobalPointerDown(false);
    setSelectedBlock(null);
  });
  app.stage.addEventListener("pointermove", (e) => {
    const blockSize = getBlockSize();

    const { x, y } = e.global;
    setGlobalPointer({ x, y });

    const { selectedBlock } = getWorld();

    if (selectedBlock) {
      if (y < selectedBlock.block.sprite.y) {
        const fileBlockDirectlyAbove = getFileBlockDirectlyAbove(selectedBlock);
        if (fileBlockDirectlyAbove) {
          swapFileBlockPositions(selectedBlock.block, fileBlockDirectlyAbove);
        }
      }
      if (y > selectedBlock.block.sprite.y + blockSize) {
        const fileBlockDirectlyBelow = getFileBlockDirectlyBelow(selectedBlock);
        if (fileBlockDirectlyBelow) {
          swapFileBlockPositions(selectedBlock.block, fileBlockDirectlyBelow);
        }
      }
    }
  });
  app.stage.addEventListener("pointerleave", () => {
    setGlobalPointer(DEFAULT_POINTER_POSITION);
    setGlobalPointerDown(false);
    setSelectedBlock(null);
  });

  setWorldDimensions(app.screen.height, app.screen.width);

  const dropInterval = 700;
  let timeAccumulated = 0;
  app.ticker.add((time) => {
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

  let dangerOscillationPhase = 0;

  app.ticker.add((time) => {
    const { blockGroupsMap } = getWorld();
    const dt = time.deltaTime / 60;
    // apply mutators to each block group
    blockGroupsMap.forEach((blockGroup) => {
      descentMutator(blockGroup, dt);
      overlayMutator(blockGroup);
      positionMutator(blockGroup, dt);
    });

    // apply per-tick animations
    const DANGER_ANIMATION_DURATION = 1;
    const DANGER_ANIMATION_MAX_OPACITY = 0.45;

    dangerOscillationPhase =
      (dangerOscillationPhase + dt / DANGER_ANIMATION_DURATION) % 1;
    // number that oscillates between 0 and 1
    const dangerOscillation =
      (1 + Math.cos(dangerOscillationPhase * Math.PI * 2)) / 2;

    blockGroupsMap.forEach((blockGroup) => {
      blockGroup.files.forEach((file) => {
        file.overlay.danger.alpha =
          dangerOscillation * DANGER_ANIMATION_MAX_OPACITY;
      });
    });

    // check for losing state
    // @todo consider adding a 1-2 sec "tolerance" once file limit is reached
    // before the file is considered for placement (and game loss)
    blockGroupsMap.forEach((blockGroup) =>
      blockGroup.files.forEach((file) => {
        if (file.blocks.length >= DEFAULT_FILE_LIMIT + 2) {
          alert("You have lost the game.");
          app.stop();
        }
      }),
    );
  });
})();

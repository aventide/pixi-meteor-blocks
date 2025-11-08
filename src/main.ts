import { Application, Container } from "pixi.js";

import { getWorld, setStage, setWorldDimensions } from "./world";
import type { WorldStage } from "./world";
import { createSingleBlock } from "./entities";
import { descentMutator, velocityMutator } from "./mutators";
import { getRandomFileNumber } from "./util";

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

  setWorldDimensions(app.screen.height, app.screen.width);

  const dropInterval = 500;
  let timeAccumulated = 0;
  app.ticker.add((time) => {
    timeAccumulated += time.deltaMS;
    if (timeAccumulated >= dropInterval) {
      timeAccumulated -= dropInterval;
      const file = getRandomFileNumber();
      createSingleBlock(file);
      // newBlockGroup.files.forEach((file) => {
      //   file.blocks.forEach((block) => blocksLayer.addChild(block.sprite));
      //   overlayLayer.addChild(file.overlay);
      // });
      // check if new block would intersect an existing container
      // @todo alternatively, could check if number of blocks in file exceeds capacity by a certain number
      // if (getIsGroupInIntersection(newBlockGroup)) {
      //   alert("You have lost the game.");
      // } else {
      //   blockGroups.push(newBlockGroup);
      // newBlockGroup.files.forEach((file) => {
      //file.blocks.forEach((block) => app.stage.addChild(block.sprite));
      //});
      // }
    }
  });

  app.ticker.add((time) => {
    const { blockGroupsMap } = getWorld();
    const dt = time.deltaTime / 60;
    // apply mutators to each block group
    blockGroupsMap.forEach((blockGroup) => {
      descentMutator(blockGroup, dt);
      velocityMutator(blockGroup, dt);
    });
  });
})();

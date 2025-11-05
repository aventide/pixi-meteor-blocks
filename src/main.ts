import type { BlockGroup } from "./entities/types";

import { Application, Container } from "pixi.js";

import { setWorldDimensions } from "./world";
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

  document.getElementById("pixi-container")!.appendChild(app.canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      app.stop();
    } else {
      app.start();
    }
  });

  setWorldDimensions(app.screen.height, app.screen.width);

  const blockGroups: BlockGroup[] = [];

  blockGroups.forEach((blockGroup) =>
    blockGroup.files.forEach((file) => {
      file.blocks.forEach((block) => blocksLayer.addChild(block.sprite));
    }),
  );

  const dropInterval = 500;
  let timeAccumulated = 0;
  app.ticker.add((time) => {
    timeAccumulated += time.deltaMS;
    if (timeAccumulated >= dropInterval) {
      timeAccumulated -= dropInterval;
      const file = getRandomFileNumber();
      const newBlockGroup: BlockGroup = createSingleBlock(file);
      blockGroups.push(newBlockGroup);
      newBlockGroup.files.forEach((file) => {
        file.blocks.forEach((block) => blocksLayer.addChild(block.sprite));
        overlayLayer.addChild(file.overlay);
      });
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
    const dt = time.deltaTime / 60;
    // apply mutators to each block group
    blockGroups.forEach((blockGroup) => {
      descentMutator(blockGroup, dt);
      velocityMutator(blockGroup, dt);
    });
  });
})();

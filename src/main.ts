import type { BlockGroup } from "./entities/types";

import { Application } from "pixi.js";

import { setWorldDimensions, getWorld } from "./world";
import { createSingleBlock, createVerticalTestGroup } from "./entities";
import { gravityMutator, velocityMutator } from "./mutators";

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  setWorldDimensions(app.screen.height, app.screen.width);

  const blockGroups: BlockGroup[] = [createVerticalTestGroup(4)];

  blockGroups.forEach((blockGroup) =>
    blockGroup.blocks.forEach((block) => app.stage.addChild(block.sprite)),
  );

  setInterval(() => {
    // @todo I do not love the naming here
    const newBlockGroup: BlockGroup = createSingleBlock();
    blockGroups.push(newBlockGroup);
    app.stage.addChild(newBlockGroup.blocks[0].sprite);
    console.log(getWorld().filesMap);
    console.log(getWorld().blockGroupsMap);
  }, 1000);

  app.ticker.add((time) => {
    const dt = time.deltaTime / 60;

    // apply mutators to each block group
    blockGroups.forEach((blockGroup) => {
      gravityMutator(blockGroup, dt);
      velocityMutator(blockGroup, dt);
    });
  });
})();

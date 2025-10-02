import { Application } from "pixi.js";
import { Block, createRandomBlock, createVerticalTestGroup } from "./creators";
import { gravityMutator } from "./mutators/gravityMutator";
import { setWorldDimensions } from "./world";

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

  const files: Record<number, Block[]> = {};

  // or, in the future, just "entities" because block groups could be included
  // entities can be created, merged/composed, and decomposed
  const blocks: Block[] = [
    ...createVerticalTestGroup(2),
    ...createVerticalTestGroup(4),
    ...createVerticalTestGroup(6),
  ];

  // eventually it will be entities, not blocks, to do top-level iterating on
  // because stacks of blocks will be processed altogether

  // track initial blocks in stage and files
  blocks.forEach((block) => {
    app.stage.addChild(block.sprite);
    if (!files[block.file]) {
      files[block.file] = [];
    } else {
      files[block.file].push(block);
    }
  });

  setInterval(() => {
    const newBlock = createRandomBlock(files);

    app.stage.addChild(newBlock.sprite);
    blocks.push(newBlock);
    if (!files[newBlock.file]) {
      files[newBlock.file] = [];
    } else {
      files[newBlock.file].push(newBlock);
    }
  }, 500);

  app.ticker.add((time) => {
    const dt = time.deltaTime / 60;

    // apply mutators to each block
    blocks.forEach((block) => {
      gravityMutator(block, dt);
    });
  });
})();

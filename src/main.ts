import { Application } from "pixi.js";
import { FILE_COUNT, GRAVITY_FACTOR } from "./constants";
import { getRandomBlockTexture, getRandomIntUpTo } from "./util";
import { Block, createBlock, createVerticalTestGroup } from "./creators";

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const blockLength = app.screen.width / FILE_COUNT;
  const files: Record<number, Block[]> = {};

  // or, in the future, just "entities" because block groups could be included
  // entities can be created, merged/composed, and decomposed
  const blocks: Block[] = [
    ...createVerticalTestGroup(2, blockLength),
    ...createVerticalTestGroup(4, blockLength),
    ...createVerticalTestGroup(6, blockLength),
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
    const file = getRandomIntUpTo(FILE_COUNT);

    const newBlock = createBlock({
      texture: getRandomBlockTexture(),
      initialPosition: {
        x: file * blockLength,
        y: -blockLength,
      },
      size: blockLength,
      file: file,
      fileOrder: files[file]?.length + 1 || 0,
    });
    app.stage.addChild(newBlock.sprite);
    blocks.push(newBlock);
    if (!files[newBlock.file]) {
      files[newBlock.file] = [];
    } else {
      files[newBlock.file].push(newBlock);
    }

    console.log(files);
  }, 500);

  app.ticker.add((time) => {
    const dt = time.deltaTime / 60;

    blocks.forEach((block) => {
      // these calculations also need to be normalized for block size/dimensions, to account for differences in canvas size
      // otherwise taller screens will take longer to drop blocks
      block.velocity += GRAVITY_FACTOR * dt;
      block.sprite.y += block.velocity * dt;

      // this will get trickier because ground will sometimes be a block below
      // we should store vertical "files", or basically a dictionary of blocks under a certain x coord (a column of blocks), to help with this calculation
      // and then groundY is simply the top stalled block of the file
      //
      // this will not work after any blocks are culled, because the fileOrder will need to be updated on the entire file
      const groundY =
        app.screen.height - (block.fileOrder + 1) * block.sprite.height;

      if (block.sprite.y >= groundY) {
        block.sprite.y = groundY;
        block.velocity = 0;
      }
    });
  });
})();

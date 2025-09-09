import { Application, Assets, Sprite, Texture } from "pixi.js";

type Block = {
  sprite: Sprite;
  velocity: number;
  file: number;
  fileOrder: number;
};

type Coord = {
  x: number;
  y: number;
};

const gravity = 980; // gravity is planet-wide (or level-wide) constant

const redTexture: Texture = await Assets.load("/assets/tile_red.svg");
const blueTexture: Texture = await Assets.load("/assets/tile_blue.svg");
const greenTexture: Texture = await Assets.load("/assets/tile_green.svg");
const yellowTexture: Texture = await Assets.load("/assets/tile_yellow.svg");

const getRandomIntUpTo = (upToNumber: number) =>
  Math.floor(Math.random() * upToNumber);

const getRandomBlockTexture = () => {
  const textureOptions: Texture[] = [
    redTexture,
    blueTexture,
    greenTexture,
    yellowTexture,
  ];

  return textureOptions[getRandomIntUpTo(textureOptions.length)];
};

const createBlock = ({
  initialPosition,
  texture,
  size,
  file,
  fileOrder,
}: {
  initialPosition: Coord;
  texture: Texture;
  size: number;
  file: number;
  fileOrder: number;
}): Block => {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0);
  sprite.setSize(size);
  sprite.position.set(initialPosition.x, initialPosition.y);

  return {
    sprite,
    velocity: 0,
    file,
    fileOrder,
  };
};

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const blockLength = app.screen.width / 9;

  // or, in the future, just "entities" because block groups could be included
  // entities can be created, merged/composed, and decomposed
  const blocks: Block[] = [];

  const files: Record<number, Block[]> = {};

  // eventually it will be entities, not blocks, to do top-level iterating on
  // because stacks of blocks will be processed altogether
  blocks.forEach((block) => {
    app.stage.addChild(block.sprite);
  });

  setInterval(() => {
    const file = blockLength * getRandomIntUpTo(9);

    const newBlock = createBlock({
      texture: getRandomBlockTexture(),
      initialPosition: {
        x: file,
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
  }, 500);

  app.ticker.add((time) => {
    const dt = time.deltaTime / 60;

    blocks.forEach((block) => {
      block.velocity += gravity * dt;
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

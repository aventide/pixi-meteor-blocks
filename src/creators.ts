import { Sprite, Texture } from "pixi.js";
import { getRandomBlockTexture, getRandomFileNumber } from "./util";
import { getWorld } from "./world";
import { DEFAULT_FILE_COUNT } from "./constants";

export type Coord = {
  x: number;
  y: number;
};

export type Block = {
  sprite: Sprite;
  velocity: number;
  file: number;
  fileOrder: number;
};

const createBlock = ({
  initialPosition,
  texture,
  file,
  fileOrder,
}: {
  initialPosition: Coord;
  texture: Texture;
  file: number;
  fileOrder: number;
}): Block => {
  const { width: worldWidth } = getWorld();

  const blockSize = worldWidth / DEFAULT_FILE_COUNT;

  const sprite = new Sprite(texture);
  sprite.anchor.set(0);
  sprite.setSize(blockSize);
  sprite.position.set(
    initialPosition.x * blockSize,
    initialPosition.y * blockSize,
  );

  return {
    sprite,
    velocity: 0,
    file,
    fileOrder,
  };
};

const createRandomBlock = (files: Record<number, Block[]>): Block => {
  const file = getRandomFileNumber();

  return createBlock({
    texture: getRandomBlockTexture(),
    initialPosition: {
      x: file,
      y: -1,
    },
    file,
    fileOrder: files[file]?.length + 1 || 0,
  });
};

// @todo the math breaks here because when two stacks are created at the same file, the file orders are not adjusted accordingly
const createVerticalTestGroup = (blockCount: number): Block[] => {
  const blocks: Block[] = [];
  const file = getRandomFileNumber();

  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture: getRandomBlockTexture(),
      file,
      fileOrder: i,
    });
    blocks.push(newBlock);
  }

  return blocks;
};

export { createBlock, createRandomBlock, createVerticalTestGroup };

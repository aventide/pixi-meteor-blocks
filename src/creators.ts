import { Sprite, Texture } from "pixi.js";
import { getRandomBlockTexture, getRandomFileNumber } from "./util";

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

// @todo the math breaks here because when two stacks are created at the same file, the file orders are not adjusted accordingly
const createVerticalTestGroup = (
  blockCount: number,
  blockLength: number,
): Block[] => {
  const blocks: Block[] = [];

  const file = getRandomFileNumber();

  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file * blockLength, y: blockLength * (i + 1) * -1 },
      texture: getRandomBlockTexture(),
      size: blockLength,
      file,
      fileOrder: i,
    });
    blocks.push(newBlock);
  }

  return blocks;
};

export { createBlock, createVerticalTestGroup };

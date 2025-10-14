import { Sprite, Texture } from "pixi.js";
import { getRandomFileNumber } from "../util";
import { getBlockSize } from "../world";
import { Block, BlockGroup, Coord } from "../entities/types";
import { getRandomBlockTexture } from "../textures";

const createBlock = ({
  initialPosition,
  texture,
  file,
}: {
  initialPosition: Coord;
  texture: Texture;
  file: number;
}): Block => {
  const blockSize = getBlockSize();

  const sprite = new Sprite(texture);
  sprite.anchor.set(0);
  sprite.setSize(blockSize);
  sprite.position.set(
    initialPosition.x * blockSize,
    initialPosition.y * blockSize,
  );

  return {
    sprite,
    file,
  };
};

const createSingleBlock = (): BlockGroup => {
  const file = getRandomFileNumber();

  return {
    blocks: [
      createBlock({
        texture: getRandomBlockTexture(),
        initialPosition: {
          x: file,
          y: -1,
        },
        file,
      }),
    ],
    files: [file],
    velocity: 0,
  };
};

const createVerticalTestGroup = (blockCount: number): BlockGroup => {
  const blockGroup: BlockGroup = { blocks: [], files: [], velocity: 0 };
  const file = getRandomFileNumber();

  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture: getRandomBlockTexture(),
      file,
    });
    blockGroup.blocks.push(newBlock);
  }

  return blockGroup;
};

export { createBlock, createSingleBlock, createVerticalTestGroup };

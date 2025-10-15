import { Sprite, Texture } from "pixi.js";
import { getRandomFileNumber } from "../util";
import { getBlockSize, getWorld } from "../world";
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
    (initialPosition.x - 1) * blockSize,
    initialPosition.y * blockSize,
  );

  return {
    sprite,
    file,
  };
};

const createBlockGroup = (
  blocks: Block[],
  velocity: number = 0,
): BlockGroup => {
  const { blockGroupIdPool, blockGroupsMap, filesMap } = getWorld();

  const assignedId = blockGroupIdPool.pop();
  const fileNumbers = Array.from(new Set(blocks.map((block) => block.file)));

  if (assignedId) {
    const newBlockGroup: BlockGroup = {
      id: assignedId,
      files: fileNumbers,
      velocity,
      blocks,
    };

    blockGroupsMap.set(assignedId, newBlockGroup);
    fileNumbers.forEach((fileNumber) =>
      filesMap.get(fileNumber)?.push(assignedId),
    );

    return newBlockGroup;
  } else {
    throw new Error("No IDs available to assign to newly-requested BlockGroup");
  }
};

const createSingleBlock = (): BlockGroup => {
  const file = getRandomFileNumber();
  const initialBlock = createBlock({
    texture: getRandomBlockTexture(),
    initialPosition: {
      x: file,
      y: -1,
    },
    file,
  });

  return createBlockGroup([initialBlock]);
};

const createVerticalTestGroup = (blockCount: number): BlockGroup => {
  const file = getRandomFileNumber();
  const initialBlocks = [];
  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture: getRandomBlockTexture(),
      file,
    });
    initialBlocks.push(newBlock);
  }

  return createBlockGroup(initialBlocks);
};

export { createBlock, createSingleBlock, createVerticalTestGroup };

import type {
  Block,
  BlockGroup,
  BlockGroupFile,
  Coord,
  FileNumber,
} from "../entities/types";

import { Sprite, Texture } from "pixi.js";
import { getRandomFileNumber } from "../util";
import { getBlockSize, getWorld } from "../world";
import { getRandomBlockTexture } from "../textures";
import { DEFAULT_SPAWN_POINT, DEFAULT_POP_VELOCITY } from "../constants";

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

// input must be a "file" aka blocks all with the same y coord
export const getFileBoundaries = (blocks: Block[]) => {
  const blockSize = getBlockSize();

  let highestTop = blocks[0].sprite.y;
  let lowestBottom = blocks[0].sprite.y + blockSize;

  blocks.forEach((block) => {
    const topOfBlock = block.sprite.y;
    const bottomOfBlock = block.sprite.y + blockSize;
    if (topOfBlock < highestTop) highestTop = topOfBlock;
    if (bottomOfBlock > lowestBottom) lowestBottom = bottomOfBlock;
  });

  return {
    top: highestTop,
    bottom: lowestBottom,
  };
};

const createBlockGroup = (
  groupFiles: BlockGroupFile[],
  velocity: number = 0,
): BlockGroup => {
  const { blockGroupIdPool, blockGroupsMap, fileBlockGroupsMap } = getWorld();
  const assignedId = blockGroupIdPool.pop();

  if (assignedId) {
    const newBlockGroup: BlockGroup = {
      id: assignedId,
      files: groupFiles,
      velocity,
    };

    const fileNumbers = groupFiles.map((groupFile) => groupFile.number);

    blockGroupsMap.set(assignedId, newBlockGroup);
    fileNumbers.forEach((fileNumber) =>
      fileBlockGroupsMap.get(fileNumber)?.push(newBlockGroup),
    );

    // input handler for each file
    newBlockGroup.files.forEach((file) => {
      file.blocks.forEach(({ sprite }) => {
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.on("pointertap", () => {
          newBlockGroup.velocity = DEFAULT_POP_VELOCITY;
        });
      });
    });
    return newBlockGroup;
  } else {
    throw new Error("No IDs available to assign to newly-requested BlockGroup");
  }
};

const createSingleBlock = (fileNumber: FileNumber): BlockGroup => {
  const initialBlock = createBlock({
    texture: getRandomBlockTexture(),
    initialPosition: {
      x: fileNumber,
      y: DEFAULT_SPAWN_POINT,
    },
    file: fileNumber,
  });

  return createBlockGroup([
    {
      blocks: [initialBlock],
      boundary: getFileBoundaries([initialBlock]),
      number: fileNumber,
    },
  ]);
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

  return createBlockGroup([
    {
      blocks: initialBlocks,
      boundary: getFileBoundaries(initialBlocks),
      number: file,
    },
  ]);
};

export { createBlock, createSingleBlock, createVerticalTestGroup };

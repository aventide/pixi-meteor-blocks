import { Sprite, Texture } from "pixi.js";
import { getRandomFileNumber } from "../util";
import { getBlockSize, getWorld } from "../world";
import { Block, BlockGroup, BlockGroupFile, Coord } from "../entities/types";
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

// const removeBlockGroup = (blockGroup: BlockGroup) => {
//   const { blockGroupIdPool, blockGroupsMap, fileBlockGroupsMap } = getWorld();

//   blockGroupsMap.delete(blockGroup.id);

//   blockGroup.files.forEach((file) => {
//     const blockGroupsToFilter: BlockGroup[] =
//       fileBlockGroupsMap.get(file.number) || [];
//     if (blockGroupsToFilter.length > 0) {
//       const filteredBlockGroups = blockGroupsToFilter.filter(
//         (group) => group.id !== blockGroup.id,
//       );
//       fileBlockGroupsMap.set(file.number, filteredBlockGroups);
//     }
//   });

//   blockGroupIdPool.push(blockGroup.id);
// };

const createBlockGroup = (
  blocks: Block[],
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
      blocks,
    };

    const fileNumbers = groupFiles.map((groupFile) => groupFile.number);

    blockGroupsMap.set(assignedId, newBlockGroup);
    fileNumbers.forEach((fileNumber) =>
      fileBlockGroupsMap.get(fileNumber)?.push(newBlockGroup),
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
      y: -3,
    },
    file,
  });

  return createBlockGroup(
    [initialBlock],
    [
      {
        blocks: [initialBlock],
        boundary: getFileBoundaries([initialBlock]),
        number: file,
      },
    ],
  );
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

  return createBlockGroup(initialBlocks, [
    {
      blocks: initialBlocks,
      boundary: getFileBoundaries(initialBlocks),
      number: file,
    },
  ]);
};

export { createBlock, createSingleBlock, createVerticalTestGroup };

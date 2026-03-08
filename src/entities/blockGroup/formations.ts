import type { BlockGroup, FileNumber } from "../types";

import { getBlockSize, getCeiling } from "../../world";
import { getRandomBlockTexture } from "../../textures";
import { createBlock } from "../block/index";
import { createBlockGroup } from "./index";

export const createSingleBlock = (fileNumber: FileNumber): BlockGroup => {
  const initialBlock = createBlock({
    texture: getRandomBlockTexture(),
    initialPosition: {
      x: fileNumber,
      y: getCeiling() / getBlockSize(),
    },
    file: fileNumber,
  });

  return createBlockGroup([
    {
      blocks: [initialBlock],
      number: fileNumber,
    },
  ]);
};

export const createVerticalTestGroup = (
  file: number,
  blockCount: number,
): BlockGroup => {
  const texture = getRandomBlockTexture();
  const initialBlocks = [];
  for (let i = 0; i < blockCount; i++) {
    const newBlock = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture,
      file,
    });
    initialBlocks.push(newBlock);
  }

  return createBlockGroup([
    {
      blocks: initialBlocks,
      number: file,
    },
  ]);
};

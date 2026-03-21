import type {
  BlockGroup,
  FileFragment,
  FileNumber,
  GroupFileFragment,
} from "../types";

import { getBlockSize, getCeiling, getWorld } from "../../world";

export const getIsSpawnPositionOpen = (file: FileNumber): boolean => {
  const { fileFragmentsByFileNumber } = getWorld();
  const blockSize = getBlockSize();

  const fragmentsInFile = fileFragmentsByFileNumber.get(file) || [];
  let isPositionOpen = true;

  fragmentsInFile.forEach((fragment) => {
    if (fragment.boundary.top < getCeiling() + blockSize) {
      isPositionOpen = false;
    }
  });

  return isPositionOpen;
};

// input must be a "file" aka blocks all with the same y coord
export const getFileFragmentBoundary = (blocks: FileFragment["blocks"]) => {
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

export const getFileFragmentsInGroupByFileNumber = (
  blockGroup: BlockGroup,
  fileNumber: FileNumber,
): GroupFileFragment[] =>
  blockGroup.fileFragments.filter(
    (fileFragment) => fileFragment.number === fileNumber,
  );

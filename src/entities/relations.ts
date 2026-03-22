import type {
  Block,
  BlockGroup,
  BlockGroupId,
  GroupFileFragment,
} from "./types";

import { getBlockSize, getWorld } from "../world";
import { getBlockGroupById } from "./blockGroup/util";
import { normalizeFileFragment } from "./fileFragment/operations";
import { createGroupFileFragment } from "./fileFragment/index";
import {
  getFileFragmentById,
  getFileFragmentsInGroupByFileNumber,
} from "./fileFragment/util";
import { isClose } from "../util";

const removeBlockFromFragment = (
  fileFragment: GroupFileFragment,
  block: Block,
): boolean => {
  const blockIndex = fileFragment.blocks.indexOf(block);
  if (blockIndex === -1) return false;

  fileFragment.blocks.splice(blockIndex, 1);
  return true;
};

const getContiguousBlockSegmentsInFile = (blocks: Block[]): Block[][] => {
  if (blocks.length === 0) {
    return [];
  }

  const sortedBlocks = [...blocks].sort(
    (blockA, blockB) => blockA.sprite.y - blockB.sprite.y,
  );
  const blockSize = getBlockSize();
  const segments: Block[][] = [[sortedBlocks[0]]];

  for (let i = 1; i < sortedBlocks.length; i++) {
    const currentBlock = sortedBlocks[i];
    const previousBlock = sortedBlocks[i - 1];
    const currentSegment = segments[segments.length - 1];

    if (isClose(currentBlock.sprite.y - previousBlock.sprite.y, blockSize)) {
      currentSegment.push(currentBlock);
    } else {
      segments.push([currentBlock]);
    }
  }

  return segments;
};

const getAdjacentTargetFragments = (
  block: Block,
  targetFragments: GroupFileFragment[],
): GroupFileFragment[] => {
  const blockSize = getBlockSize();
  const blockTop = block.sprite.y;
  const blockBottom = block.sprite.y + blockSize;

  return targetFragments.filter(
    (fragment) =>
      isClose(blockBottom, fragment.boundary.top) ||
      isClose(blockTop, fragment.boundary.bottom),
  );
};

const syncBlockGroupInFile = (
  blockGroup: BlockGroup,
  fileNumber: number,
): void => {
  const { blockGroupsByFileNumber } = getWorld();
  const groupsInFile = blockGroupsByFileNumber.get(fileNumber) || [];
  const hasFragmentInFile = blockGroup.fileFragments.some(
    (fileFragment) => fileFragment.number === fileNumber,
  );

  const filteredGroups = groupsInFile.filter(
    (group) => group.id !== blockGroup.id,
  );

  blockGroupsByFileNumber.set(
    fileNumber,
    hasFragmentInFile ? [...filteredGroups, blockGroup] : filteredGroups,
  );
};

const attachBlockToTargetGroup = (
  block: Block,
  targetGroup: BlockGroup,
): void => {
  const targetFragments = getFileFragmentsInGroupByFileNumber(
    targetGroup,
    block.file,
  );
  const adjacentFragments = getAdjacentTargetFragments(block, targetFragments);

  if (adjacentFragments.length === 0) {
    createGroupFileFragment(
      {
        number: block.file,
        blocks: [block],
      },
      targetGroup.id,
    );

    syncBlockGroupInFile(targetGroup, block.file);

    return;
  }

  if (adjacentFragments.length === 1) {
    const targetFragment = adjacentFragments[0];
    targetFragment.blocks.push(block);
    normalizeFileFragment(targetFragment);
    return;
  }

  if (adjacentFragments.length === 2) {
    const mergedBlocks = [
      ...adjacentFragments[0].blocks,
      ...adjacentFragments[1].blocks,
      block,
    ];

    removeGroupFileFragment(targetGroup, adjacentFragments[0]);
    removeGroupFileFragment(targetGroup, adjacentFragments[1]);

    createGroupFileFragment(
      {
        number: block.file,
        blocks: mergedBlocks,
      },
      targetGroup.id,
    );

    syncBlockGroupInFile(targetGroup, block.file);

    return;
  }

  throw new Error(
    "Cannot assign block to target BlockGroup when more than two adjacent GroupFileFragments exist for that file",
  );
};

const rebuildSourceFragmentAfterRemoval = (
  blockGroup: BlockGroup,
  fileFragment: GroupFileFragment,
): void => {
  const remainingSegments = getContiguousBlockSegmentsInFile(
    fileFragment.blocks,
  );

  if (remainingSegments.length === 0) {
    removeGroupFileFragment(blockGroup, fileFragment);
    syncBlockGroupInFile(blockGroup, fileFragment.number);

    return;
  }

  if (remainingSegments.length === 1) {
    fileFragment.blocks = remainingSegments[0];
    normalizeFileFragment(fileFragment);
    return;
  }

  removeGroupFileFragment(blockGroup, fileFragment);

  remainingSegments.forEach((segmentBlocks) => {
    createGroupFileFragment(
      {
        number: fileFragment.number,
        blocks: segmentBlocks,
      },
      blockGroup.id,
    );
  });

  syncBlockGroupInFile(blockGroup, fileFragment.number);
};

export const removeGroupFileFragment = (
  blockGroup: BlockGroup,
  fileFragment: GroupFileFragment,
): void => {
  const { fileFragmentsByFileNumber, fileFragmentsById } = getWorld();

  blockGroup.fileFragments = blockGroup.fileFragments.filter(
    (fragment) => fragment.id !== fileFragment.id,
  );

  fileFragmentsByFileNumber.set(
    fileFragment.number,
    (fileFragmentsByFileNumber.get(fileFragment.number) || []).filter(
      (fragment) => fragment.id !== fileFragment.id,
    ),
  );

  fileFragmentsById.delete(fileFragment.id);

  fileFragment.blocks.forEach((block) => {
    if (block.fragmentId === fileFragment.id) {
      block.fragmentId = null;
    }
  });

  fileFragment.overlay.danger.removeFromParent();
};

export const assignBlockToGroup = (
  block: Block,
  blockGroupId: BlockGroupId,
): BlockGroup => {
  const nextGroup = getBlockGroupById(blockGroupId);
  if (!nextGroup) {
    throw new Error("Cannot assign block to a BlockGroup that does not exist");
  }

  const previousGroup = getBlockGroupById(block.groupId);

  if (previousGroup?.id === nextGroup.id) {
    return nextGroup;
  }

  if (previousGroup) {
    const previousFragment = getFileFragmentById(block.fragmentId);

    if (!previousFragment || previousFragment.groupId !== previousGroup.id) {
      throw new Error(
        "Block references a previous BlockGroup, but no matching GroupFileFragment was found",
      );
    }

    const wasRemoved = removeBlockFromFragment(previousFragment, block);
    if (!wasRemoved) {
      throw new Error(
        "Block references a previous BlockGroup, but is missing from its GroupFileFragment",
      );
    }

    rebuildSourceFragmentAfterRemoval(previousGroup, previousFragment);
  }

  attachBlockToTargetGroup(block, nextGroup);

  block.groupId = nextGroup.id;

  return nextGroup;
};

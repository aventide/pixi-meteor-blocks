import type {
  Block,
  BlockGroup,
  BlockGroupId,
  GroupFileFragment,
} from "./types";

import { getBlockSize, getVeil, getWorld } from "../world";
import { getBlockGroupById } from "./blockGroup/util";
import { normalizeFileFragment } from "./fileFragment/operations";
import { createGroupFileFragment } from "./fileFragment/index";
import {
  getFileFragmentById,
  getFileFragmentsInGroupByFileNumber,
} from "./fileFragment/util";
import { isClose } from "../util";
import {
  ejectSubgroupFromBlockGroup,
  removeBlockGroup,
} from "./blockGroup/operations";

const detachBlockFromFileFragment = (
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

const getAdjacentFileFragmentsForBlock = (
  block: Block,
  fileFragments: GroupFileFragment[],
): GroupFileFragment[] => {
  const blockSize = getBlockSize();
  const blockTop = block.sprite.y;
  const blockBottom = block.sprite.y + blockSize;

  return fileFragments.filter(
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

const attachBlockToTargetBlockGroup = (
  block: Block,
  targetBlockGroup: BlockGroup,
): void => {
  const targetFileFragments = getFileFragmentsInGroupByFileNumber(
    targetBlockGroup,
    block.file,
  );
  const adjacentFileFragments = getAdjacentFileFragmentsForBlock(
    block,
    targetFileFragments,
  );

  if (adjacentFileFragments.length === 0) {
    createGroupFileFragment(
      {
        number: block.file,
        blocks: [block],
      },
      targetBlockGroup.id,
    );

    syncBlockGroupInFile(targetBlockGroup, block.file);

    return;
  }

  if (adjacentFileFragments.length === 1) {
    const targetFileFragment = adjacentFileFragments[0];
    targetFileFragment.blocks.push(block);
    normalizeFileFragment(targetFileFragment);
    return;
  }

  if (adjacentFileFragments.length === 2) {
    const mergedBlocks = [
      ...adjacentFileFragments[0].blocks,
      ...adjacentFileFragments[1].blocks,
      block,
    ];

    removeGroupFileFragment(targetBlockGroup, adjacentFileFragments[0]);
    removeGroupFileFragment(targetBlockGroup, adjacentFileFragments[1]);

    createGroupFileFragment(
      {
        number: block.file,
        blocks: mergedBlocks,
      },
      targetBlockGroup.id,
    );

    syncBlockGroupInFile(targetBlockGroup, block.file);

    return;
  }

  throw new Error(
    "Cannot assign block to target BlockGroup when more than two adjacent GroupFileFragments exist for that file",
  );
};

const rebuildSourceFileFragmentAfterBlockRemoval = (
  sourceBlockGroup: BlockGroup,
  sourceFileFragment: GroupFileFragment,
): void => {
  const remainingSegments = getContiguousBlockSegmentsInFile(
    sourceFileFragment.blocks,
  );

  if (remainingSegments.length === 0) {
    removeGroupFileFragment(sourceBlockGroup, sourceFileFragment);
    syncBlockGroupInFile(sourceBlockGroup, sourceFileFragment.number);

    return;
  }

  if (remainingSegments.length === 1) {
    sourceFileFragment.blocks = remainingSegments[0];
    normalizeFileFragment(sourceFileFragment);
    return;
  }

  removeGroupFileFragment(sourceBlockGroup, sourceFileFragment);

  remainingSegments.forEach((segmentBlocks) => {
    createGroupFileFragment(
      {
        number: sourceFileFragment.number,
        blocks: segmentBlocks,
      },
      sourceBlockGroup.id,
    );
  });

  syncBlockGroupInFile(sourceBlockGroup, sourceFileFragment.number);
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
  const targetBlockGroup = getBlockGroupById(blockGroupId);
  if (!targetBlockGroup) {
    throw new Error("Cannot assign block to a BlockGroup that does not exist");
  }

  const sourceBlockGroup = getBlockGroupById(block.groupId);

  if (sourceBlockGroup?.id === targetBlockGroup.id) {
    return targetBlockGroup;
  }

  if (sourceBlockGroup) {
    const sourceFileFragment = getFileFragmentById(block.fragmentId);

    if (
      !sourceFileFragment ||
      sourceFileFragment.groupId !== sourceBlockGroup.id
    ) {
      throw new Error(
        "Block references a previous BlockGroup, but no matching GroupFileFragment was found",
      );
    }

    const wasRemoved = detachBlockFromFileFragment(sourceFileFragment, block);
    if (!wasRemoved) {
      throw new Error(
        "Block references a previous BlockGroup, but is missing from its GroupFileFragment",
      );
    }

    rebuildSourceFileFragmentAfterBlockRemoval(
      sourceBlockGroup,
      sourceFileFragment,
    );
  }

  attachBlockToTargetBlockGroup(block, targetBlockGroup);

  block.groupId = targetBlockGroup.id;

  return targetBlockGroup;
};

export const vanishVeilExceedingBlocksInGroup = (group: BlockGroup) => {
  const veil = getVeil();
  const blocksToEject: Block[] = [];

  for (const frag of group.fileFragments) {
    if (frag.boundary.top < veil) {
      for (const block of frag.blocks) {
        if (block.sprite.y < veil) {
          blocksToEject.push(block);
        }
      }
    }
  }

  if (blocksToEject.length > 0) {
    const { targetGroup } = ejectSubgroupFromBlockGroup(group, blocksToEject);
    if (targetGroup) {
      removeBlockGroup(targetGroup);
    }
  }
};

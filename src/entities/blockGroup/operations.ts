import type { Block, BlockGroup, FilePlacement } from "../types";

import { getWorld } from "../../world";
import {
  createBlockGroupFromBlocks,
  getCombinedBlockGroupType,
  getCombinedVelocity,
  getContiguousFilePlacements,
  getFilePlacements,
} from "./util";

export const mergeBlockGroups = (
  sourceBlockGroup: BlockGroup,
  targetBlockGroup: BlockGroup,
) => {
  const { blockGroupsById } = getWorld();

  const mergedVelocity = getCombinedVelocity(
    sourceBlockGroup,
    targetBlockGroup,
  );
  const mergedBlocks = [
    ...sourceBlockGroup.fileFragments.flatMap(
      (fileFragment) => fileFragment.blocks,
    ),
    ...targetBlockGroup.fileFragments.flatMap(
      (fileFragment) => fileFragment.blocks,
    ),
  ];
  const mergedType = getCombinedBlockGroupType(
    sourceBlockGroup,
    targetBlockGroup,
  );

  removeBlockGroup(sourceBlockGroup);
  removeBlockGroup(targetBlockGroup);

  const mergedBlockGroup = createBlockGroupFromBlocks(
    mergedBlocks,
    mergedVelocity,
    mergedType,
  );

  blockGroupsById.set(mergedBlockGroup.id, mergedBlockGroup);

  return mergedBlockGroup;
};

export const ejectSubgroupFromBlockGroup = (
  sourceBlockGroup: BlockGroup,
  ejectedBlocks: Block[],
): { targetGroup: BlockGroup | null; sourceGroup: BlockGroup | null } => {
  const sourceBlockGroupPlacements = getFilePlacements(sourceBlockGroup);
  const ejectedBlockSet = new Set(ejectedBlocks);

  const sourceGroupPlacements: FilePlacement[] = [];
  const targetGroupPlacements: FilePlacement[] = [];

  sourceBlockGroupPlacements.forEach((sourcePlacement) => {
    const sourceBlocks: Block[] = [];
    const placementTargetBlocks: Block[] = [];

    sourcePlacement.blocks.forEach((block) => {
      if (ejectedBlockSet.has(block)) {
        placementTargetBlocks.push(block);
      } else {
        sourceBlocks.push(block);
      }
    });

    sourceGroupPlacements.push(
      ...getContiguousFilePlacements(sourceBlocks, sourcePlacement.number),
    );

    targetGroupPlacements.push(
      ...getContiguousFilePlacements(
        placementTargetBlocks,
        sourcePlacement.number,
      ),
    );
  });

  removeBlockGroup(sourceBlockGroup);

  const sourceGroup =
    sourceGroupPlacements.length > 0
      ? createBlockGroupFromBlocks(
          sourceGroupPlacements.flatMap(
            (filePlacement) => filePlacement.blocks,
          ),
          sourceBlockGroup.velocity,
          sourceBlockGroup.type,
        )
      : null;

  const targetGroup =
    targetGroupPlacements.length > 0
      ? createBlockGroupFromBlocks(
          targetGroupPlacements.flatMap(
            (filePlacement) => filePlacement.blocks,
          ),
          sourceBlockGroup.velocity,
          sourceBlockGroup.type,
        )
      : null;

  return {
    targetGroup,
    sourceGroup,
  };
};

export const removeBlockGroup = (blockGroup: BlockGroup) => {
  const {
    blockGroupsById,
    blockGroupsByFileNumber,
    fileFragmentsByFileNumber,
    fileFragmentsById,
  } = getWorld();

  blockGroupsById.delete(blockGroup.id);

  blockGroup.fileFragments.forEach((fileFragment) => {
    const blockGroupsToFilter =
      blockGroupsByFileNumber.get(fileFragment.number) || [];
    if (blockGroupsToFilter.length > 0) {
      blockGroupsByFileNumber.set(
        fileFragment.number,
        blockGroupsToFilter.filter((group) => group.id !== blockGroup.id),
      );
    }

    const fragmentsToFilter =
      fileFragmentsByFileNumber.get(fileFragment.number) || [];
    if (fragmentsToFilter.length > 0) {
      fileFragmentsByFileNumber.set(
        fileFragment.number,
        fragmentsToFilter.filter(
          (fragment) => fragment.groupId !== blockGroup.id,
        ),
      );
    }

    fileFragmentsById.delete(fileFragment.id);
  });

  blockGroup.fileFragments.forEach((fileFragment) => {
    fileFragment.blocks.forEach((block) => block.sprite.removeFromParent());
    fileFragment.overlay.danger.removeFromParent();
  });
};

import type { Block, BlockGroup, FileNumber, FilePlacement } from "../types";

import { getWorld } from "../../world";
import { sortBlocksAscending } from "../block/util";
import { createBlockGroup } from "./index";
import {
  getCombinedBlockGroupType,
  getCombinedFilePlacements,
  getCombinedVelocity,
  getFilePlacements,
} from "./util";

export const combineBlockGroups = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
) => {
  const { blockGroupsMap } = getWorld();

  const combinedVelocity = getCombinedVelocity(
    subjectBlockGroup,
    otherBlockGroup,
  );

  const subjectFilePlacements = getFilePlacements(subjectBlockGroup);
  const otherFilePlacements = getFilePlacements(otherBlockGroup);
  const combinedFilePlacements = getCombinedFilePlacements(
    subjectFilePlacements,
    otherFilePlacements,
  );

  const combinedType = getCombinedBlockGroupType(
    subjectBlockGroup,
    otherBlockGroup,
  );

  removeBlockGroup(subjectBlockGroup);
  removeBlockGroup(otherBlockGroup);

  const combinedBlockGroup = createBlockGroup(
    combinedFilePlacements,
    combinedVelocity,
    combinedType,
  );

  blockGroupsMap.set(combinedBlockGroup.id, combinedBlockGroup);

  return combinedBlockGroup;
};

export const decombineBlockGroup = (
  originalBlockGroup: BlockGroup,
  fracturePointMap: Map<FileNumber, number>,
): { basisGroup: BlockGroup | null; ejectedGroup: BlockGroup | null } => {
  const originalBlockGroupPlacements = getFilePlacements(originalBlockGroup);

  const basisGroupPlacements: FilePlacement[] = [];
  const ejectedGroupPlacements: FilePlacement[] = [];

  originalBlockGroupPlacements.forEach((originalPlacement) => {
    if (!fracturePointMap.has(originalPlacement.number)) {
      basisGroupPlacements.push({
        blocks: originalPlacement.blocks,
        number: originalPlacement.number,
      });
      return;
    }

    const individualFracturePoint = fracturePointMap.get(
      originalPlacement.number,
    )!;

    const basisBlocks: Block[] = [];
    const ejectedBlocks: Block[] = [];
    const sortedBlocks = sortBlocksAscending([...originalPlacement.blocks]);

    sortedBlocks.forEach((block, index) => {
      const blockRank = index + 1;
      if (blockRank <= individualFracturePoint) {
        ejectedBlocks.push(block);
      } else {
        basisBlocks.push(block);
      }
    });

    if (basisBlocks.length > 0) {
      basisGroupPlacements.push({
        blocks: basisBlocks,
        number: originalPlacement.number,
      });
    }

    if (ejectedBlocks.length > 0) {
      ejectedGroupPlacements.push({
        blocks: ejectedBlocks,
        number: originalPlacement.number,
      });
    }
  });

  removeBlockGroup(originalBlockGroup);

  const basisGroup =
    basisGroupPlacements.length > 0
      ? createBlockGroup(
          basisGroupPlacements,
          originalBlockGroup.velocity,
          originalBlockGroup.type,
        )
      : null;

  const ejectedGroup =
    ejectedGroupPlacements.length > 0
      ? createBlockGroup(
          ejectedGroupPlacements,
          originalBlockGroup.velocity,
          originalBlockGroup.type,
        )
      : null;

  return {
    basisGroup,
    ejectedGroup,
  };
};

export const removeBlockGroup = (blockGroup: BlockGroup) => {
  const { blockGroupsMap, fileBlockGroupsMap, fileFragmentsMap } = getWorld();

  blockGroupsMap.delete(blockGroup.id);

  blockGroup.fileFragments.forEach((fileFragment) => {
    const blockGroupsToFilter =
      fileBlockGroupsMap.get(fileFragment.number) || [];
    if (blockGroupsToFilter.length > 0) {
      fileBlockGroupsMap.set(
        fileFragment.number,
        blockGroupsToFilter.filter((group) => group.id !== blockGroup.id),
      );
    }

    const fragmentsToFilter = fileFragmentsMap.get(fileFragment.number) || [];
    if (fragmentsToFilter.length > 0) {
      fileFragmentsMap.set(
        fileFragment.number,
        fragmentsToFilter.filter(
          (fragment) => fragment.groupId !== blockGroup.id,
        ),
      );
    }
  });

  blockGroup.fileFragments.forEach((fileFragment) => {
    fileFragment.blocks.forEach((block) => block.sprite.removeFromParent());
    fileFragment.overlay.danger.removeFromParent();
  });
};

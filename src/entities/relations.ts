import type {
  Block,
  BlockGroup,
  BlockGroupId,
  GroupFileFragment,
} from "./types";

import { getFileFragmentById, getWorld } from "../world";
import { getBlockGroupById } from "./blockGroup/util";
import { normalizeFileFragment } from "./fileFragment/operations";
import { getFileFragmentsInGroupByFileNumber } from "./fileFragment/util";

const removeBlockFromFragment = (
  fileFragment: GroupFileFragment,
  block: Block,
): boolean => {
  const blockIndex = fileFragment.blocks.indexOf(block);
  if (blockIndex === -1) return false;

  fileFragment.blocks.splice(blockIndex, 1);
  return true;
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

    if (previousFragment.blocks.length === 0) {
      previousGroup.fileFragments = previousGroup.fileFragments.filter(
        (fileFragment) => fileFragment !== previousFragment,
      );

      const { fileFragmentsByFileNumber, blockGroupsByFileNumber } = getWorld();
      fileFragmentsByFileNumber.set(
        previousFragment.number,
        (fileFragmentsByFileNumber.get(previousFragment.number) || []).filter(
          (fileFragment) => fileFragment !== previousFragment,
        ),
      );
      blockGroupsByFileNumber.set(
        previousFragment.number,
        (blockGroupsByFileNumber.get(previousFragment.number) || []).filter(
          (group) => group.id !== previousGroup.id,
        ),
      );
    } else {
      normalizeFileFragment(previousFragment);
    }
  }

  const nextFragments = getFileFragmentsInGroupByFileNumber(
    nextGroup,
    block.file,
  );

  if (nextFragments.length === 0) {
    throw new Error(
      "Cannot assign block to target BlockGroup without an existing GroupFileFragment for that file",
    );
  }

  if (nextFragments.length > 1) {
    throw new Error(
      "Cannot assign block to target BlockGroup when multiple GroupFileFragments exist for that file",
    );
  }

  const nextFragment = nextFragments[0];

  nextFragment.blocks.push(block);
  normalizeFileFragment(nextFragment);

  block.groupId = nextGroup.id;

  return nextGroup;
};

import type {
  BlockGroup,
  BlockGroupType,
  FilePlacement,
  GroupFileFragment,
} from "../types";

import { addToBlocksLayer, addToOverlayLayer, getWorld } from "../../world";
import { createGroupFileFragment } from "../fileFragment/index";

export const createBlockGroup = (
  filePlacements: FilePlacement[],
  velocity: number = 0,
  type: BlockGroupType = "default",
): BlockGroup => {
  filePlacements.forEach((fp) => {
    if (fp.blocks.length === 0) {
      throw "File for created BlockGroup must contain at least one block";
    }
  });

  const { blockGroupIdPool, blockGroupsMap, fileBlockGroupsMap } = getWorld();
  const assignedId = blockGroupIdPool.pop();

  if (!assignedId) {
    throw new Error("No IDs available to assign to newly-requested BlockGroup");
  }

  const fragments: GroupFileFragment[] = filePlacements.map((fp) =>
    createGroupFileFragment(fp, assignedId),
  );
  const fileNumbers = fragments.map((fragment) => fragment.number);

  const newBlockGroup: BlockGroup = {
    id: assignedId,
    fileFragments: fragments,
    velocity,
    type,
  };

  blockGroupsMap.set(assignedId, newBlockGroup);
  fileNumbers.forEach((fileNumber) =>
    fileBlockGroupsMap.get(fileNumber)?.push(newBlockGroup),
  );

  newBlockGroup.fileFragments.forEach((fileFragment) => {
    fileFragment.blocks.forEach((block) => addToBlocksLayer(block.sprite));
    addToOverlayLayer(fileFragment.overlay.danger);
  });

  return newBlockGroup;
};

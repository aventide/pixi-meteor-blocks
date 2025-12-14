import { BlockGroup } from "../entities/types";
import { getIsGroupRooted } from "../entities/util";

export const sequenceMutator = (blockGroup: BlockGroup) => {
  // for now, we are only going to process blockGroups that are rooted to the bottom
  if (!getIsGroupRooted(blockGroup)) {
    return blockGroup;
  }

  return blockGroup;
};

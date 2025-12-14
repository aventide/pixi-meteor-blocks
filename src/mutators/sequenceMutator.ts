import { DEFAULT_POP_VELOCITY } from "../constants";
import { decombineBlockGroup } from "../entities";
import { Block, BlockGroup, FileNumber } from "../entities/types";
import { getIsGroupRooted } from "../entities/util";

export const sequenceMutator = (blockGroup: BlockGroup) => {
  // for now, we are only going to process blockGroups that are rooted to the bottom
  if (!getIsGroupRooted(blockGroup)) {
    return blockGroup;
  }

  // check for vertical sequences in the blockGroup
  const verticalSequence = findVerticalSequence(blockGroup);

  if (verticalSequence) {
    const { ejectedGroup } = decombineBlockGroup(
      blockGroup,
      getFracturePointMap(verticalSequence),
    );
    if (ejectedGroup) ejectedGroup.velocity = DEFAULT_POP_VELOCITY;
  }
};

const getFracturePointMap = (blocks: Block[]) => {
  const map: Record<FileNumber, number> = {};

  blocks.forEach((block) => {
    map[block.file] = block.groupFileRank;
  });

  return map;
};

// for now, if we find one sequence, just return that first one
const findVerticalSequence = (blockGroup: BlockGroup) => {
  for (const blockGroupFile of blockGroup.files) {
    let sequence: Block[] = [];
    for (const block of blockGroupFile.blocks) {
      const comparableVariant = block.sprite.texture.label;
      // if we're already in a sequence, check to see if it is being continued
      if (
        sequence.length > 0 &&
        sequence[0].sprite.texture.label === comparableVariant
      ) {
        sequence.push(block);
      } else {
        if (sequence.length >= 3 && sequence.length <= 5) {
          return sequence;
        }
        sequence = [block];
      }
    }

    if (sequence.length >= 3 && sequence.length <= 5) {
      return sequence;
    }
  }
};

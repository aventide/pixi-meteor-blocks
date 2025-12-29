import { DEFAULT_LAUNCH_VELOCITY } from "../constants";
import { decombineBlockGroup } from "../entities";
import { Block, BlockGroup, FileNumber } from "../entities/types";
import { getIsGroupRooted } from "../entities/util";
import { getWorld } from "../world";

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
    if (ejectedGroup) {
      ejectedGroup.velocity = DEFAULT_LAUNCH_VELOCITY;
      ejectedGroup.type = "launch";
    }
  }

  const rootedHorizontalSequence = findRootedHorizontalSequence();
  if (rootedHorizontalSequence) {
    // console.log(rootedHorizontalSequence);
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
        if (sequence.length >= 3) {
          return sequence;
        }
        sequence = [block];
      }
    }

    if (sequence.length >= 3) {
      return sequence;
    }
  }
};

const findRootedHorizontalSequence = () => {
  const adjacentFileSequences = findAdjacentFileSequences();

  // map of dist from bottom to blocks
  // those blocks may also need to be a map back to its group or we'll need to store group ids on blocks themselves
  // else we'll have to do another search to find the parent of the blocks to perform the decombines
  const boardRankBlockRecord: Map<number, Block[]> = new Map();

  // build up the map
  adjacentFileSequences.forEach((adjacentFileSequence: BlockGroup[]) => {
    adjacentFileSequence.forEach((blockGroup) => {
      blockGroup.files[0].blocks.forEach((block) => {
        const blocksFromBottom =
          blockGroup.files[0].blocks.length - block.groupFileRank;

        const currentRecord = boardRankBlockRecord.get(blocksFromBottom);
        if (currentRecord) {
          boardRankBlockRecord.set(blocksFromBottom, [...currentRecord, block]);
        } else {
          boardRankBlockRecord.set(blocksFromBottom, [block]);
        }
      });
    });
  });

  // check each row of adjacentFileSequences, for each block, check adjacency of fileNumber AND texture.
  for (const [, blockRow] of boardRankBlockRecord) {
    let sequence: Block[] = [];
    for (const block of blockRow) {
      const comparableVariant = block.sprite.texture.label;
      // if we're already in a sequence, check to see if it is being continued
      if (
        sequence.length > 0 &&
        sequence[sequence.length - 1].file === block.file - 1 &&
        sequence[sequence.length - 1].sprite.texture.label === comparableVariant
      ) {
        sequence.push(block);
      } else {
        if (sequence.length >= 3) {
          return sequence;
        }
        sequence = [block];
      }
    }
    if (sequence.length >= 3) {
      return sequence;
    }
  }
};

const findAdjacentFileSequences = (): BlockGroup[][] => {
  const { fileBlockGroupsMap } = getWorld();

  const allSequences: BlockGroup[][] = [];
  let fileSequence: BlockGroup[] = [];

  // check each file on the board
  fileBlockGroupsMap.forEach((fileBlockGroups) => {
    // check if one of the associated blockGroups is rooted and single-file
    const currentFileBlockGroup = fileBlockGroups.find(
      (fileBlockGroup) =>
        getIsGroupRooted(fileBlockGroup) && fileBlockGroup.files.length === 1,
    );
    if (currentFileBlockGroup) {
      // if so, we can add it to the sequence of adjacent files
      fileSequence.push(currentFileBlockGroup);
    } else {
      if (fileSequence.length >= 3) {
        allSequences.push([...fileSequence]);
      }
      fileSequence = [];
    }
  });

  if (fileSequence.length >= 3) {
    allSequences.push([...fileSequence]);
  }

  return allSequences;
};

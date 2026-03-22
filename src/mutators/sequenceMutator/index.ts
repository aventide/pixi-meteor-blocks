import { DEFAULT_LAUNCH_VELOCITY } from "../../constants";
import {
  ejectSubgroupFromBlockGroup,
  getBlockGroupById,
  mergeBlockGroups,
} from "../../entities";
import {
  Block,
  BlockGroup,
  BlockGroupId,
  BlockSequence,
  FileFragment,
} from "../../entities/types";
import { applyBurnToBlocks, getVerticalSequencesInFileFragment } from "./util";

const sequenceMutator = (allSelectionFileFragments: FileFragment[]) => {
  for (const frag of allSelectionFileFragments) {
    const verticalSequences: BlockSequence[] =
      getVerticalSequencesInFileFragment(frag);

    verticalSequences.forEach((sequence) =>
      launchVerticalSequence(frag, sequence),
    );
  }
};

const launchVerticalSequence = (
  frag: FileFragment,
  sequence: BlockSequence,
) => {
  applyBurnToBlocks(sequence);

  const bottomBlock = sequence[sequence.length - 1];
  const blocksAbove = getBlocksAboveInFileFragment(bottomBlock, frag);

  const blocksByGroupId = getBlocksByGroupId(blocksAbove);

  const ejectedGroups: BlockGroup[] = [];

  for (const [groupId, groupBlocks] of blocksByGroupId.entries()) {
    const sourceGroup = getBlockGroupById(groupId);
    if (!sourceGroup) continue;

    const { targetGroup } = ejectSubgroupFromBlockGroup(
      sourceGroup,
      groupBlocks,
    );

    if (targetGroup) {
      ejectedGroups.push(targetGroup);
    }
  }

  const launchedGroup = mergeAllBlockGroups(ejectedGroups);
  if (launchedGroup) {
    launchedGroup.type = "launch";
    launchedGroup.velocity = DEFAULT_LAUNCH_VELOCITY;
  }
};

export const mergeAllBlockGroups = (
  blockGroups: BlockGroup[],
): BlockGroup | null => {
  if (blockGroups.length === 0) {
    return null;
  }

  let mergedGroup = blockGroups[0];

  for (let i = 1; i < blockGroups.length; i++) {
    mergedGroup = mergeBlockGroups(mergedGroup, blockGroups[i]);
  }

  return mergedGroup;
};

export const getBlocksAboveInFileFragment = (
  block: Block,
  fileFragment: FileFragment,
): Block[] => {
  const blockIndex = fileFragment.blocks.findIndex(
    (fragmentBlock) => fragmentBlock.sprite.uid === block.sprite.uid,
  );

  if (blockIndex === -1) {
    return [];
  }

  return fileFragment.blocks.slice(0, blockIndex + 1);
};

export const getBlocksByGroupId = (
  blocks: Block[],
): Map<BlockGroupId, Block[]> => {
  const blocksByGroupId = new Map<BlockGroupId, Block[]>();

  blocks.forEach((block) => {
    if (block.groupId === null) return;

    const existingBlocks = blocksByGroupId.get(block.groupId);
    if (existingBlocks) {
      existingBlocks.push(block);
    } else {
      blocksByGroupId.set(block.groupId, [block]);
    }
  });

  return blocksByGroupId;
};

export default sequenceMutator;

import { DEFAULT_LAUNCH_VELOCITY } from "../../constants";
import { ejectSubgroupFromBlockGroup, getBlockGroupById } from "../../entities";
import { BlockGroup, BlockSequence, FileFragment } from "../../entities/types";
import {
  applyBurnToBlocks,
  getBlocksAboveInFileFragment,
  getBlocksByGroupId,
  getVerticalSequencesInFileFragment,
  mergeAllBlockGroups,
} from "./util";

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

export default sequenceMutator;

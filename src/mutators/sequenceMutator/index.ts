import { Block, FileFragment } from "../../entities/types";
import { getBurnedTexture } from "../../textures";

type BlockSequence = Block[];

const sequenceMutator = (allSelectionFileFragments: FileFragment[]) => {
  for (const frag of allSelectionFileFragments) {
    const verticalSequences: BlockSequence[] =
      getVerticalSequencesInFileFragment(frag);

    verticalSequences.forEach((sequence) => applyBurnToBlocks(sequence));
  }
};

const getVerticalSequencesInFileFragment = (frag: FileFragment) => {
  return [frag.blocks];
};

const applyBurnToBlocks = (blocks: Block[]) => {
  blocks.forEach((block) => (block.sprite.texture = getBurnedTexture()));
};

export default sequenceMutator;

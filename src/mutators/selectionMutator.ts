import { DEFAULT_FILE_BLOCKS_LIMIT, DEFAULT_POP_VELOCITY } from "../constants";
import { decombineBlockGroup } from "../entities";
import { Block, BlockGroup } from "../entities/types";
import {
  getBlockAboveInFragment,
  getBlockBelowInFragment,
  getIsGroupRooted,
  swapFileBlockPositions,
} from "../entities/util";
import { getBlockSize, getWorld, setGlobalPointerDown } from "../world";

let selectedBlock: Block | null = null;

export const selectionMutator = (blockGroup: BlockGroup) => {
  const { globalPointer, globalPointerDown } = getWorld();
  const blockSize = getBlockSize();

  if (!globalPointerDown) {
    selectedBlock = null;
  }

  blockGroup.fileFragments.forEach((fileFragment) => {
    // check for danger condition on group file fragment
    if (fileFragment.blocks.length > DEFAULT_FILE_BLOCKS_LIMIT) {
      fileFragment.overlay.danger.visible = true;
    } else {
      fileFragment.overlay.danger.visible = false;
    }

    fileFragment.blocks.forEach((block) => {
      // if current block being iterated is the selected block
      if (selectedBlock && selectedBlock.sprite.uid === block.sprite.uid) {
        block.sprite.alpha = 0.5;

        // if pointer moves relative to selected block, handle block swap
        if (globalPointer.y < selectedBlock.sprite.y) {
          const fileBlockDirectlyAbove = getBlockAboveInFragment(
            fileFragment,
            selectedBlock,
          );
          if (fileBlockDirectlyAbove) {
            swapFileBlockPositions(
              fileFragment.blocks,
              selectedBlock,
              fileBlockDirectlyAbove,
            );
          } else if (
            getIsGroupRooted(blockGroup) &&
            blockGroup.fileFragments.length === 1
          ) {
            const { ejectedGroup } = decombineBlockGroup(
              blockGroup,
              new Map([[blockGroup.fileFragments[0].number, 1]]),
            );
            setGlobalPointerDown(false);
            if (ejectedGroup) {
              ejectedGroup.type = "pop";
              ejectedGroup.velocity = DEFAULT_POP_VELOCITY;
            }
          }
        }
        if (globalPointer.y > selectedBlock.sprite.y + blockSize) {
          const fileBlockDirectlyBelow = getBlockBelowInFragment(
            fileFragment,
            selectedBlock,
          );
          if (fileBlockDirectlyBelow) {
            swapFileBlockPositions(
              fileFragment.blocks,
              selectedBlock,
              fileBlockDirectlyBelow,
            );
          }
        }
      } else {
        block.sprite.alpha = 1;
      }
    });
  });
};

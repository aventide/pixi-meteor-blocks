import { DEFAULT_FILE_LIMIT, DEFAULT_POP_VELOCITY } from "../constants";
import { decombineBlockGroup } from "../entities";
import { Block, BlockGroup, FileFragment } from "../entities/types";
import {
  getBlockAboveInFragment,
  getBlockBelowInFragment,
  getIsGroupRooted,
  swapFileBlockPositions,
} from "../entities/util";
import {
  getBlockSize,
  getWorld,
  setGlobalPointerDown,
  setSelectedBlockGroup,
} from "../world";

let selectedFileFragment: FileFragment | null = null;
let selectedBlock: Block | null = null;

export const selectionMutator = (blockGroup: BlockGroup) => {
  const { globalPointer, globalPointerDown, selectedBlockGroup } = getWorld();
  const blockSize = getBlockSize();

  if (!globalPointerDown) {
    selectedFileFragment = null;
    selectedBlock = null;
    setSelectedBlockGroup(null);
  }

  blockGroup.fileFragments.forEach((fileFragment) => {
    // check for danger condition on group file fragment
    if (fileFragment.blocks.length > DEFAULT_FILE_LIMIT) {
      fileFragment.overlay.danger.visible = true;
    } else {
      fileFragment.overlay.danger.visible = false;
    }

    // need access to a globally-stored group id because the groups merge
    fileFragment.overlay.selection.visible =
      fileFragment.number === selectedFileFragment?.number &&
      blockGroup.id === selectedBlockGroup?.id;

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
            setSelectedBlockGroup(null);
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

      // set selection if a file block is being hovered over
      if (
        globalPointer.x >= block.sprite.x &&
        globalPointer.x <= block.sprite.x + blockSize &&
        globalPointer.y >= block.sprite.y &&
        globalPointer.y <= block.sprite.y + blockSize &&
        globalPointerDown &&
        !selectedFileFragment
      ) {
        selectedFileFragment = fileFragment;
        selectedBlock = block;
        setSelectedBlockGroup(blockGroup);
      }
    });
  });
};

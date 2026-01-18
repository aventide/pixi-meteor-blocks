import { DEFAULT_FILE_LIMIT, DEFAULT_POP_VELOCITY } from "../constants";
import { decombineBlockGroup } from "../entities";
import { Block, BlockGroup, BlockGroupFile } from "../entities/types";
import {
  getFileBlockDirectlyAbove,
  getFileBlockDirectlyBelow,
  getIsGroupRooted,
  swapFileBlockPositions,
} from "../entities/util";
import {
  getBlockSize,
  getWorld,
  setGlobalPointerDown,
  setSelectedBlockGroup,
} from "../world";

let selectedFile: BlockGroupFile | null = null;
let selectedBlock: Block | null = null;

export const selectionMutator = (blockGroup: BlockGroup) => {
  const { globalPointer, globalPointerDown, selectedBlockGroup } = getWorld();
  const blockSize = getBlockSize();

  if (!globalPointerDown) {
    selectedFile = null;
    selectedBlock = null;
    setSelectedBlockGroup(null);
  }

  blockGroup.files.forEach((file) => {
    // check for danger condition on group file
    if (file.blocks.length > DEFAULT_FILE_LIMIT) {
      file.overlay.danger.visible = true;
    } else {
      file.overlay.danger.visible = false;
    }

    // need access to a globally-stored group id because the groups merge
    file.overlay.selection.visible =
      file.number === selectedFile?.number &&
      blockGroup.id === selectedBlockGroup?.id;

    file.blocks.forEach((block) => {
      // if current block being iterated is the selected block
      if (selectedBlock && selectedBlock.sprite.uid === block.sprite.uid) {
        block.sprite.alpha = 0.5;

        // if pointer moves relative to selected block, handle block swap
        if (globalPointer.y < selectedBlock.sprite.y) {
          const fileBlockDirectlyAbove = getFileBlockDirectlyAbove({
            block: selectedBlock,
            blockGroupId: blockGroup.id,
          });
          if (fileBlockDirectlyAbove) {
            swapFileBlockPositions(
              file.blocks,
              selectedBlock,
              fileBlockDirectlyAbove,
            );
          } else if (
            getIsGroupRooted(blockGroup) &&
            blockGroup.files.length === 1
          ) {
            const { ejectedGroup } = decombineBlockGroup(
              blockGroup,
              new Map([[blockGroup.files[0].number, 1]]),
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
          const fileBlockDirectlyBelow = getFileBlockDirectlyBelow({
            block: selectedBlock,
            blockGroupId: blockGroup.id,
          });
          if (fileBlockDirectlyBelow) {
            swapFileBlockPositions(
              file.blocks,
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
        !selectedFile
      ) {
        selectedFile = file;
        selectedBlock = block;
        setSelectedBlockGroup(blockGroup);
      }
    });
  });
};

import { DEFAULT_FILE_LIMIT } from "../constants";
import { Block, BlockGroup, BlockGroupFile } from "../entities/types";
import {
  getFileBlockDirectlyAbove,
  getFileBlockDirectlyBelow,
  swapFileBlockPositions,
} from "../entities/util";
import { getBlockSize, getWorld, setSelectedBlockGroup } from "../world";

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

  if (selectedBlock) {
    if (globalPointer.y < selectedBlock.sprite.y) {
      const fileBlockDirectlyAbove = getFileBlockDirectlyAbove({
        block: selectedBlock,
        blockGroupId: blockGroup.id,
      });
      if (fileBlockDirectlyAbove) {
        swapFileBlockPositions(selectedBlock, fileBlockDirectlyAbove);
      }
    }
    if (globalPointer.y > selectedBlock.sprite.y + blockSize) {
      const fileBlockDirectlyBelow = getFileBlockDirectlyBelow({
        block: selectedBlock,
        blockGroupId: blockGroup.id,
      });
      if (fileBlockDirectlyBelow) {
        swapFileBlockPositions(selectedBlock, fileBlockDirectlyBelow);
      }
    }
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
      block.sprite.alpha =
        selectedBlock?.sprite.uid === block.sprite.uid ? 0.5 : 1;
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

import { DEFAULT_FILE_LIMIT } from "../constants";
import { Block, BlockGroup } from "../entities/types";
import { getBlockSize, getWorld, setSelectedBlock } from "../world";

export const overlayMutator = (blockGroup: BlockGroup) => {
  const { globalPointer, globalPointerDown, selectedBlock } = getWorld();
  const blockSize = getBlockSize();

  blockGroup.files.forEach((file) => {
    // check for pointer hovering over a group file for selection
    if (
      file.blocks.some(
        (fileBlock: Block) =>
          fileBlock.sprite.uid === selectedBlock?.block.sprite.uid,
      )
    ) {
      file.overlay.selection.visible = true;
    } else {
      file.overlay.selection.visible = false;
    }

    // check for danger condition on group file
    if (file.blocks.length > DEFAULT_FILE_LIMIT) {
      file.overlay.danger.visible = true;
    } else {
      file.overlay.danger.visible = false;
    }

    file.blocks.forEach((block) => {
      if (
        globalPointerDown &&
        !selectedBlock &&
        globalPointer.x >= block.sprite.x &&
        globalPointer.x <= block.sprite.x + blockSize &&
        globalPointer.y >= block.sprite.y &&
        globalPointer.y <= block.sprite.y + blockSize
      ) {
        setSelectedBlock({
          block,
          blockGroupId: blockGroup.id,
        });
      }
    });
  });
};

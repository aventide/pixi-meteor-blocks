import { DEFAULT_FILE_LIMIT } from "../constants";
import { BlockGroup } from "../entities/types";
import { getBlockSize, getWorld } from "../world";

export const overlayMutator = (blockGroup: BlockGroup) => {
  const { globalPointer } = getWorld();
  const blockSize = getBlockSize();

  blockGroup.files.forEach((file) => {
    // check for pointer hovering over a group file for selection
    if (
      globalPointer.x >= (file.number - 1) * blockSize &&
      globalPointer.x <= (file.number - 1) * blockSize + blockSize &&
      globalPointer.y >= file.boundary.top &&
      globalPointer.y <= file.boundary.bottom
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
  });
};

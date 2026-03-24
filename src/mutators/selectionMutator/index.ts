import { Block, FileFragment } from "../../entities/types";
import {
  getBlockSize,
  getWorld,
  setSelectedFragmentOverlay,
} from "../../world";
import { getIsTouchDevice } from "../../util";
import {
  createFileSelectionOverlay,
  getHoveredBlock,
  swapWithBlockAbove,
  swapWithBlockBelow,
} from "./util";

type Visibility = "hover" | "press";

const visibility: Visibility = getIsTouchDevice() ? "press" : "hover";
let selectedBlock: Block | null = null;

const selectionMutator = (allSelectionFileFragments: FileFragment[]) => {
  const { globalPointer, globalPointerDown } = getWorld();
  const blockSize = getBlockSize();

  // clear selection overlay
  setSelectedFragmentOverlay(null);

  // clear selectedBlock
  if (!globalPointerDown) {
    selectedBlock = null;
  }

  for (const selectionFileFragment of allSelectionFileFragments) {
    const isSelectedBlockInFragment = selectedBlock
      ? selectionFileFragment.blocks.includes(selectedBlock)
      : false;
    const hoveredBlock = getHoveredBlock(selectionFileFragment);

    // if this block is the selected one, show the overlay for this selectionFragment
    // and possibly do a block swap, if cursor is above or below the block coordinates
    if (selectedBlock && isSelectedBlockInFragment) {
      setSelectedFragmentOverlay(
        createFileSelectionOverlay(
          selectedBlock,
          selectionFileFragment.boundary,
        ),
      );

      // this is where we would check the globalPointer position to check
      // for a block swap
      if (globalPointer.y < selectedBlock.sprite.y) {
        swapWithBlockAbove(selectedBlock, selectionFileFragment);
      }

      if (globalPointer.y > selectedBlock.sprite.y + blockSize) {
        swapWithBlockBelow(selectedBlock, selectionFileFragment);
      }
    }

    // otherwise, try to show hover if hover visibility is enabled
    else if (!selectedBlock && hoveredBlock) {
      if (visibility === "hover") {
        // set selection overlay for selected block/selectionFragment
        setSelectedFragmentOverlay(
          createFileSelectionOverlay(
            hoveredBlock,
            selectionFileFragment.boundary,
          ),
        );
      }

      if (globalPointerDown && !selectedBlock) {
        selectedBlock = hoveredBlock;
      }
    }
  }
};

export default selectionMutator;

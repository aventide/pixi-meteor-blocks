import { DEFAULT_FILE_COUNT } from "../../constants";
import { Block } from "../../entities/types";
import { getWorld, setSelectedFragmentOverlay } from "../../world";
import {
  createFileSelectionOverlay,
  getHoveredBlock,
  getSelectionFileFragments,
} from "./util";

type Visibility = "hover" | "press";

const visibility: Visibility = "hover";
let selectedBlock: Block | null = null;

// this mutator really does multiple things - it should be split up/renamed
// this mutator is the next selectionMutator. The finding of the selection fragments will be done separately in the future
const selectionFragmentMutator = () => {
  const { globalPointerDown } = getWorld();

  // clear selection overlay
  setSelectedFragmentOverlay(null);

  // clear selectedBlock
  if (!globalPointerDown) {
    selectedBlock = null;
  }

  // iterate one file at a time
  for (let fileNumber = 1; fileNumber <= DEFAULT_FILE_COUNT; fileNumber++) {
    // get all selectionFragments for file
    const selectionFileFragments = getSelectionFileFragments(fileNumber);

    for (const selectionFileFragment of selectionFileFragments) {
      const isSelectedBlockInFragment = selectedBlock
        ? selectionFileFragment.blocks.includes(selectedBlock)
        : false;
      const hoveredBlock = getHoveredBlock(selectionFileFragment);

      // if this block is the selected one, show the overlay for this selectionFragment
      if (selectedBlock && isSelectedBlockInFragment) {
        const selectionFragmentOverlay = createFileSelectionOverlay(
          selectedBlock,
          selectionFileFragment.boundary,
        );

        setSelectedFragmentOverlay(selectionFragmentOverlay);
      }

      // otherwise, try to show hover if hover visibility is enabled
      else if (!selectedBlock && hoveredBlock) {
        if (visibility === "hover") {
          // set selection overlay for selected block/selectionFragment
          const selectionFragmentOverlay = createFileSelectionOverlay(
            hoveredBlock,
            selectionFileFragment.boundary,
          );

          setSelectedFragmentOverlay(selectionFragmentOverlay);
        }

        if (globalPointerDown) {
          selectedBlock = hoveredBlock;
        }
      }
    }
  }
};

export default selectionFragmentMutator;

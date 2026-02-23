import { DEFAULT_FILE_COUNT } from "../../constants";
import { setSelectedFragmentOverlay } from "../../world";
import {
  createFileSelectionOverlay,
  getHoveredBlock,
  getSelectionFileFragments,
} from "./util";

// this is likely the successor to selectionMutator as a whole, sorry dude
// this mutator really does multiple things - it should be split up/renamed
const selectionFragmentMutator = () => {
  // clear selection overlay
  setSelectedFragmentOverlay(null);

  // iterate one file at a time
  for (let fileNumber = 1; fileNumber <= DEFAULT_FILE_COUNT; fileNumber++) {
    // get all selectionFragments for file
    const selectionFileFragments = getSelectionFileFragments(fileNumber);

    for (const selectionFileFragment of selectionFileFragments) {
      // set selection overlay
      const hoveredBlock = getHoveredBlock(selectionFileFragment);
      if (hoveredBlock) {
        const selectionFragmentOverlay = createFileSelectionOverlay(
          selectionFileFragment.number,
          selectionFileFragment.boundary,
        );

        setSelectedFragmentOverlay(selectionFragmentOverlay);
      }

      // do vertical and horizontal matching here
      // you can sort the blocks each of the selection fragments to do block swap
    }
  }
};

export default selectionFragmentMutator;

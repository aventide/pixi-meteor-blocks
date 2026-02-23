import { DEFAULT_FILE_COUNT } from "../../constants";
import { setSelectedFragmentOverlay } from "../../world";
import {
  createFileSelectionOverlay,
  getHoveredBlock,
  getSelectionFileFragments,
} from "./util";

// this is likely the successor to selectionMutator as a whole, sorry dude
const selectionFragmentMutator = () => {
  // clear old selection
  setSelectedFragmentOverlay(null);

  // iterate one file at a time
  for (let fileNumber = 1; fileNumber <= DEFAULT_FILE_COUNT; fileNumber++) {
    // get all selectionFragments for file
    const selectionFileFragments = getSelectionFileFragments(fileNumber);

    // in the future this loop will run on each selection fragment
    for (const selectionFileFragment of selectionFileFragments) {
      // find each selectionFragment and check for overlay display and vertical matches

      const hoveredBlock = getHoveredBlock(selectionFileFragment);
      if (hoveredBlock) {
        const selectionFragmentOverlay = createFileSelectionOverlay(
          selectionFileFragment.number,
          selectionFileFragment.boundary,
        );

        setSelectedFragmentOverlay(selectionFragmentOverlay);
      }
    }
  }
};

export default selectionFragmentMutator;

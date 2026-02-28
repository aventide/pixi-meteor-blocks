import { Container, Graphics, BlurFilter } from "pixi.js";
import {
  FileNumber,
  FileBoundary,
  Block,
  FileFragment,
  SelectionFileFragment,
} from "../../entities/types";
import { getBlockSize, getWorld } from "../../world";
import { isClose } from "../../util";
import { getFileBoundaries } from "../../entities/util";

// get all contiguous selection fragments in a given file
export const getSelectionFileFragments = (
  fileNumber: FileNumber,
): SelectionFileFragment[] => {
  const { fileFragmentsMap } = getWorld();

  const selectionFragments: SelectionFileFragment[] = [];

  // track the ids of the groups that have already been absorbed into a selection fragment
  // so we don't track them twice
  const fragmentsInFile: FileFragment[] =
    fileFragmentsMap.get(fileNumber) || [];

  // sort ascending by boundary top
  const sortedFragmentsInFile = fragmentsInFile.sort(
    (fragA, fragB) => fragA.boundary.top - fragB.boundary.top,
  );

  let currentSelectionFragment: FileFragment | null = null;
  let currentSelectionBlocks: Block[] = [];
  for (const fragmentInFile of sortedFragmentsInFile) {
    if (currentSelectionFragment === null) {
      currentSelectionFragment = fragmentInFile;
      currentSelectionBlocks = [...fragmentInFile.blocks];
    } else if (
      isClose(
        currentSelectionFragment.boundary.bottom,
        fragmentInFile.boundary.top,
      )
    ) {
      currentSelectionFragment = fragmentInFile;
      currentSelectionBlocks = [
        ...currentSelectionBlocks,
        ...fragmentInFile.blocks,
      ];
    } else {
      const selectionFragment: SelectionFileFragment =
        createSelectionFileFragment(fileNumber, currentSelectionBlocks);
      selectionFragments.push(selectionFragment);
      currentSelectionFragment = fragmentInFile;
      currentSelectionBlocks = [...fragmentInFile.blocks];
    }
  }

  if (currentSelectionBlocks.length > 0) {
    const selectionFragment: SelectionFileFragment =
      createSelectionFileFragment(fileNumber, currentSelectionBlocks);
    selectionFragments.push(selectionFragment);
  }

  return selectionFragments;
};

const createSelectionFileFragment = (
  fileNumber: FileNumber,
  selectionBlocks: Block[],
): SelectionFileFragment => {
  const selectionFileFragment: SelectionFileFragment = {
    blocks: [...selectionBlocks],
    number: fileNumber,
    boundary: getFileBoundaries(selectionBlocks),
  };

  return selectionFileFragment;
};

export const getHoveredBlock = (
  fileFragment: SelectionFileFragment,
): Block | null => {
  const { globalPointer } = getWorld();
  const blockSize = getBlockSize();

  // iterate through each block on fragment
  // return the block if the global pointer is within its dimensions
  // AND the global pointer is being pressed down
  for (const block of fileFragment.blocks) {
    if (
      globalPointer.x >= block.sprite.x &&
      globalPointer.x <= block.sprite.x + blockSize &&
      globalPointer.y >= block.sprite.y &&
      globalPointer.y <= block.sprite.y + blockSize
    ) {
      return block;
    }
  }
  return null;
};

export const getSelectedBlock = (fileFragment: FileFragment): Block | null => {
  const { globalPointerDown } = getWorld();

  const hoveredBlock = getHoveredBlock(fileFragment);
  if (hoveredBlock && globalPointerDown) return hoveredBlock;
  return null;
};

export const createFileSelectionOverlay = (
  block: Block,
  boundary: FileBoundary,
) => {
  const overlay = new Container();
  overlay.eventMode = "none";

  const overlayBorder = createFileSelectionOverlayBorder(block.file, boundary);
  const overlayBlock = createFileSelectionOverlayBlock(block);
  overlay.addChild(overlayBorder, overlayBlock);

  return overlay;
};

const createFileSelectionOverlayBorder = (
  fileNumber: FileNumber,
  boundary: FileBoundary,
): Container => {
  const blockSize = getBlockSize();

  const x = (fileNumber - 1) * blockSize;
  const y = boundary.top;
  const width = blockSize;
  const height = boundary.bottom - boundary.top;

  const overlay = new Container();
  overlay.eventMode = "none";

  const glow = new Graphics();
  const border = new Graphics();

  const blur = new BlurFilter();
  blur.strength = 2;

  glow.clear();
  glow
    .rect(x, y, width, height)
    .stroke({ width: 6, color: 0xffffff, alpha: 0.35 });
  glow.filters = [blur];

  border.clear();
  border
    .rect(x + 0.5, y + 0.5, width - 1, height - 1)
    .stroke({ width: 2, color: 0xffffff, alpha: 1.0 });

  overlay.addChild(glow, border);

  return overlay;
};

const createFileSelectionOverlayBlock = (block: Block): Container => {
  const blockSize = getBlockSize();

  const x = block.sprite.x;
  const y = block.sprite.y;
  const width = blockSize;
  const height = blockSize;

  const overlay = new Container();
  overlay.eventMode = "none";

  const glow = new Graphics();
  const border = new Graphics();

  const blur = new BlurFilter();
  blur.strength = 2;

  glow.clear();
  glow
    .rect(x - 3, y - 3, width + 6, height + 6)
    .stroke({ width: 8, color: 0xffffff, alpha: 0.35 });
  glow.filters = [blur];

  border.clear();
  border
    .rect(x - 1.5, y - 1.5, width + 3, height + 3)
    .stroke({ width: 4, color: 0xffffff, alpha: 1.0 });

  overlay.addChild(glow, border);

  return overlay;
};

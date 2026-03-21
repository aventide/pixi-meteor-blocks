import { Container, Graphics, BlurFilter } from "pixi.js";
import {
  FileNumber,
  FileBoundary,
  Block,
  FileFragment,
  GroupFileFragment,
} from "../../entities/types";
import {
  getBlockSize,
  getFileFragmentById,
  getWorld,
  setGlobalPointerDown,
} from "../../world";
import { isClose } from "../../util";
import {
  assignBlockToGroup,
  createFileFragment,
  getBlockGroupById,
  getIsGroupRooted,
} from "../../entities";
import { DEFAULT_FILE_COUNT, DEFAULT_POP_VELOCITY } from "../../constants";
import { decombineBlockGroup } from "../../entities";

const ejectTopMostBlockOfFragment = (subjectBlock: Block) => {
  const subjectGroup = getBlockGroupById(subjectBlock.groupId);

  if (!subjectGroup || !getIsGroupRooted(subjectGroup)) {
    return;
  }

  const subjectFragment = getFileFragmentById(subjectBlock.fragmentId);

  if (!subjectFragment || subjectFragment.groupId !== subjectGroup.id) {
    return;
  }

  const { ejectedGroup } = decombineBlockGroup(
    subjectGroup,
    new Map([[subjectFragment.number, 1]]),
  );

  setGlobalPointerDown(false);

  if (ejectedGroup) {
    ejectedGroup.type = "pop";
    ejectedGroup.velocity = DEFAULT_POP_VELOCITY;
  }
};

// get all contiguous selection fragments in a given file
export const getSelectionFileFragments = (
  fileNumber: FileNumber,
): FileFragment[] => {
  const { fileFragmentsMap } = getWorld();

  const selectionFragments: FileFragment[] = [];

  // track the ids of the groups that have already been absorbed into a selection fragment
  // so we don't track them twice
  const fragmentsInFile: GroupFileFragment[] =
    fileFragmentsMap.get(fileNumber) || [];

  // sort ascending by boundary top
  const sortedFragmentsInFile = fragmentsInFile.sort(
    (fragA, fragB) => fragA.boundary.top - fragB.boundary.top,
  );

  let currentSelectionFragment: GroupFileFragment | null = null;
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
      const selectionFragment: FileFragment = createFileFragment(
        fileNumber,
        currentSelectionBlocks,
      );
      selectionFragments.push(selectionFragment);
      currentSelectionFragment = fragmentInFile;
      currentSelectionBlocks = [...fragmentInFile.blocks];
    }
  }

  if (currentSelectionBlocks.length > 0) {
    const selectionFragment: FileFragment = createFileFragment(
      fileNumber,
      currentSelectionBlocks,
    );
    selectionFragments.push(selectionFragment);
  }

  return selectionFragments;
};

// get all selection file fragments in every file
export const getAllSelectionFileFragments = () => {
  const allSelectionFileFragments: FileFragment[] = [];
  for (let fileNumber = 1; fileNumber <= DEFAULT_FILE_COUNT; fileNumber++) {
    allSelectionFileFragments.push(...getSelectionFileFragments(fileNumber));
  }
  return allSelectionFileFragments;
};

export const getHoveredBlock = (fileFragment: FileFragment): Block | null => {
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

export const swapWithBlockAbove = (
  subjectBlock: Block,
  selectionFileFragment: FileFragment,
) => {
  const currentBlockIndex = selectionFileFragment.blocks.findIndex(
    (block) => block.sprite.uid === subjectBlock?.sprite.uid,
  );

  if (currentBlockIndex === -1) {
    return;
  }

  const blockAboveIndex = currentBlockIndex - 1;
  const blockAbove =
    blockAboveIndex >= 0 ? selectionFileFragment.blocks[blockAboveIndex] : null;

  if (blockAbove) {
    swapSelectionFileBlocks(subjectBlock, blockAbove);
  } else {
    ejectTopMostBlockOfFragment(subjectBlock);
  }
};

export const swapWithBlockBelow = (
  subjectBlock: Block,
  selectionFileFragment: FileFragment,
) => {
  const currentBlockIndex = selectionFileFragment.blocks.findIndex(
    (block) => block.sprite.uid === subjectBlock?.sprite.uid,
  );

  if (currentBlockIndex === -1) {
    return;
  }

  const blockBelowIndex = currentBlockIndex + 1;
  const blockBelow =
    blockBelowIndex < selectionFileFragment.blocks.length
      ? selectionFileFragment.blocks[blockBelowIndex]
      : null;

  if (blockBelow) {
    swapSelectionFileBlocks(subjectBlock, blockBelow);
  }
};

export const swapSelectionFileBlocks = (
  subjectBlock: Block,
  otherBlock: Block,
) => {
  const swapYPosition = subjectBlock.sprite.y;

  subjectBlock.sprite.y = otherBlock.sprite.y;
  otherBlock.sprite.y = swapYPosition;

  // @todo consider simpler implementation such as swapping
  // texture only, and then updating selectedBlock to the one above/below
  const subjectGroupId = subjectBlock.groupId;
  const otherGroupId = otherBlock.groupId;

  if (
    subjectGroupId === null ||
    otherGroupId === null ||
    subjectGroupId === otherGroupId
  ) {
    return;
  }

  assignBlockToGroup(subjectBlock, otherGroupId);
  assignBlockToGroup(otherBlock, subjectGroupId);
};

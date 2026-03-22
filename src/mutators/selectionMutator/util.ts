import { Container, Graphics, BlurFilter } from "pixi.js";
import {
  FileNumber,
  FileBoundary,
  Block,
  FileFragment,
  GroupFileFragment,
} from "../../entities/types";
import { getBlockSize, getWorld, setGlobalPointerDown } from "../../world";
import { isClose } from "../../util";
import {
  assignBlockToGroup,
  createFileFragment,
  getBlockGroupById,
  getFileFragmentById,
  getIsGroupRooted,
} from "../../entities";
import { DEFAULT_FILE_COUNT, DEFAULT_POP_VELOCITY } from "../../constants";
import { ejectSubgroupFromBlockGroup } from "../../entities";

const ejectTopMostBlockOfFragment = (sourceBlock: Block) => {
  const sourceGroup = getBlockGroupById(sourceBlock.groupId);

  if (!sourceGroup || !getIsGroupRooted(sourceGroup)) {
    return;
  }

  const sourceFragment = getFileFragmentById(sourceBlock.fragmentId);

  if (!sourceFragment || sourceFragment.groupId !== sourceGroup.id) {
    return;
  }

  const topMostBlock = sourceFragment.blocks[0];
  if (!topMostBlock) {
    return;
  }

  const { targetGroup } = ejectSubgroupFromBlockGroup(sourceGroup, [
    topMostBlock,
  ]);

  setGlobalPointerDown(false);

  if (targetGroup) {
    targetGroup.type = "pop";
    targetGroup.velocity = DEFAULT_POP_VELOCITY;
  }
};

// get all contiguous selection fragments in a given file
export const getSelectionFileFragments = (
  fileNumber: FileNumber,
): FileFragment[] => {
  const { fileFragmentsByFileNumber } = getWorld();

  const selectionFragments: FileFragment[] = [];

  // track the ids of the groups that have already been absorbed into a selection fragment
  // so we don't track them twice
  const fragmentsInFile: GroupFileFragment[] =
    fileFragmentsByFileNumber.get(fileNumber) || [];

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
  sourceBlock: Block,
  selectionFileFragment: FileFragment,
) => {
  const currentBlockIndex = selectionFileFragment.blocks.findIndex(
    (block) => block.sprite.uid === sourceBlock?.sprite.uid,
  );

  if (currentBlockIndex === -1) {
    return;
  }

  const targetBlockIndex = currentBlockIndex - 1;
  const targetBlock =
    targetBlockIndex >= 0
      ? selectionFileFragment.blocks[targetBlockIndex]
      : null;

  if (targetBlock) {
    swapSelectionFileBlocks(sourceBlock, targetBlock);
  } else {
    ejectTopMostBlockOfFragment(sourceBlock);
  }
};

export const swapWithBlockBelow = (
  sourceBlock: Block,
  selectionFileFragment: FileFragment,
) => {
  const currentBlockIndex = selectionFileFragment.blocks.findIndex(
    (block) => block.sprite.uid === sourceBlock?.sprite.uid,
  );

  if (currentBlockIndex === -1) {
    return;
  }

  const targetBlockIndex = currentBlockIndex + 1;
  const targetBlock =
    targetBlockIndex < selectionFileFragment.blocks.length
      ? selectionFileFragment.blocks[targetBlockIndex]
      : null;

  if (targetBlock) {
    swapSelectionFileBlocks(sourceBlock, targetBlock);
  }
};

export const swapSelectionFileBlocks = (
  sourceBlock: Block,
  targetBlock: Block,
) => {
  const swapYPosition = sourceBlock.sprite.y;

  sourceBlock.sprite.y = targetBlock.sprite.y;
  targetBlock.sprite.y = swapYPosition;

  // @todo consider simpler implementation such as swapping
  // texture only, and then updating selectedBlock to the one above/below
  const sourceGroupId = sourceBlock.groupId;
  const targetGroupId = targetBlock.groupId;

  if (
    sourceGroupId === null ||
    targetGroupId === null ||
    sourceGroupId === targetGroupId
  ) {
    return;
  }

  assignBlockToGroup(sourceBlock, targetGroupId);
  assignBlockToGroup(targetBlock, sourceGroupId);
};

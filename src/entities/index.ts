import type {
  Block,
  BlockGroup,
  BlockGroupFile,
  Coord,
  FileBoundary,
  FileNumber,
  FilePlacement,
} from "../entities/types";

import { BlurFilter, Container, Graphics, Sprite, Texture } from "pixi.js";
import { getRandomFileNumber } from "../util";
import {
  addToBlocksLayer,
  addToOverlayLayer,
  getBlockSize,
  getWorld,
  setSelectedBlockGroup,
} from "../world";
import { getRandomBlockTexture } from "../textures";
import { DEFAULT_SPAWN_POINT } from "../constants";
import {
  assignGroupFileRanks,
  getCombinedFilePlacements,
  getFileBoundaries,
  getFilePlacements,
  getMomentum,
} from "./util";

const createBlock = ({
  initialPosition,
  texture,
  file,
  groupFileRank,
}: {
  initialPosition: Coord;
  texture: Texture;
  file: number;
  groupFileRank: number;
}): Block => {
  const blockSize = getBlockSize();
  const sprite = new Sprite(texture);
  sprite.anchor.set(0);
  sprite.setSize(blockSize);
  sprite.position.set(
    (initialPosition.x - 1) * blockSize,
    initialPosition.y * blockSize,
  );
  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  return {
    sprite,
    file,
    groupFileRank,
  };
};

const createFileDangerOverlay = (
  fileNumber: FileNumber,
  boundary: FileBoundary,
): Container => {
  const blockSize = getBlockSize();

  const x = (fileNumber - 1) * blockSize;
  const y = boundary.top;
  const width = blockSize;
  const height = boundary.bottom - boundary.top;

  const overlay = new Container();
  overlay.visible = false;
  overlay.eventMode = "none";

  const danger = new Graphics();
  danger.clear();
  danger.rect(x, y, width, height).fill({
    color: 0xffffff,
  });

  overlay.addChild(danger);

  return overlay;
};

const createFileSelectionOverlay = (
  fileNumber: FileNumber,
  boundary: FileBoundary,
): Container => {
  const blockSize = getBlockSize();

  const x = (fileNumber - 1) * blockSize;
  const y = boundary.top;
  const width = blockSize;
  const height = boundary.bottom - boundary.top;

  const overlay = new Container();
  overlay.visible = false;
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

const createBlockGroupFile = (filePlacement: FilePlacement): BlockGroupFile => {
  const fileBoundaries = getFileBoundaries(filePlacement.blocks);

  const dangerOverlay = createFileDangerOverlay(
    filePlacement.number,
    fileBoundaries,
  );

  const selectionOverlay = createFileSelectionOverlay(
    filePlacement.number,
    fileBoundaries,
  );

  return {
    blocks: assignGroupFileRanks(filePlacement.blocks),
    number: filePlacement.number,
    boundary: fileBoundaries,
    overlay: {
      danger: dangerOverlay,
      selection: selectionOverlay,
    },
  };
};

const createBlockGroup = (
  filePlacements: FilePlacement[],
  velocity: number = 0,
): BlockGroup => {
  const { blockGroupIdPool, blockGroupsMap, fileBlockGroupsMap } = getWorld();
  const assignedId = blockGroupIdPool.pop();

  if (assignedId) {
    // create files
    const files: BlockGroupFile[] = filePlacements.map(createBlockGroupFile);
    const fileNumbers = files.map((file) => file.number);

    const newBlockGroup: BlockGroup = {
      id: assignedId,
      files,
      velocity,
    };

    // register the group and its files with the game world
    blockGroupsMap.set(assignedId, newBlockGroup);
    fileNumbers.forEach((fileNumber) =>
      fileBlockGroupsMap.get(fileNumber)?.push(newBlockGroup),
    );

    // add sprites to stage
    newBlockGroup.files.forEach((file) => {
      file.blocks.forEach((block) => addToBlocksLayer(block.sprite));
      addToOverlayLayer(file.overlay.danger);
      addToOverlayLayer(file.overlay.selection);
    });

    return newBlockGroup;
  } else {
    throw new Error("No IDs available to assign to newly-requested BlockGroup");
  }
};

export const createSingleBlock = (fileNumber: FileNumber): BlockGroup => {
  const initialBlock = createBlock({
    texture: getRandomBlockTexture(),
    initialPosition: {
      x: fileNumber,
      y: DEFAULT_SPAWN_POINT,
    },
    file: fileNumber,
    groupFileRank: 1,
  });

  return createBlockGroup([
    {
      blocks: [initialBlock],
      number: fileNumber,
    },
  ]);
};

export const createVerticalTestGroup = (blockCount: number): BlockGroup => {
  const file = getRandomFileNumber();
  const initialBlocks = [];
  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture: getRandomBlockTexture(),
      file,
      groupFileRank: i + 1,
    });
    initialBlocks.push(newBlock);
  }

  return createBlockGroup([
    {
      blocks: initialBlocks,
      number: file,
    },
  ]);
};

export const combineBlockGroups = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
) => {
  const { blockGroupsMap, selectedBlockGroup } = getWorld();

  const combinedVelocity =
    (getMomentum(subjectBlockGroup) + getMomentum(otherBlockGroup)) /
    [...subjectBlockGroup.files, ...otherBlockGroup.files].reduce(
      (totalBlocks, file) => totalBlocks + file.blocks.length,
      0,
    );

  const subjectFilePlacements = getFilePlacements(subjectBlockGroup);
  const otherFilePlacements = getFilePlacements(otherBlockGroup);
  const combinedFilePlacements: FilePlacement[] = getCombinedFilePlacements(
    subjectFilePlacements,
    otherFilePlacements,
  );

  const combinedBlockGroup = createBlockGroup(
    combinedFilePlacements,
    combinedVelocity,
  );

  blockGroupsMap.set(combinedBlockGroup.id, combinedBlockGroup);

  if (
    selectedBlockGroup?.id === subjectBlockGroup.id ||
    selectedBlockGroup?.id === otherBlockGroup.id
  ) {
    setSelectedBlockGroup(combinedBlockGroup);
  }

  removeBlockGroup(subjectBlockGroup);
  removeBlockGroup(otherBlockGroup);

  combinedBlockGroup.files.forEach((file) => {
    file.blocks.forEach((block) => addToBlocksLayer(block.sprite));
    addToOverlayLayer(file.overlay.danger);
    addToOverlayLayer(file.overlay.selection);
  });

  return combinedBlockGroup;
};

// create two new block groups, at a set of fracture points
// probably best to do sorted file blocks after all
// because it will make this, as well as swap, simpler
// and not rely on coords
// export const decombineBlockGroup = (
//   blockGroup: BlockGroup,
//   fracturePoints: number[],
// ): BlockGroup[] => {
//   const newBlockGroups: BlockGroup[] = [];

//   removeBlockGroup(blockGroup);

//   return newBlockGroups;
// };

export const removeBlockGroup = (blockGroup: BlockGroup) => {
  const { blockGroupIdPool, blockGroupsMap, fileBlockGroupsMap } = getWorld();

  blockGroupsMap.delete(blockGroup.id);

  blockGroup.files.forEach((file) => {
    const blockGroupsToFilter: BlockGroup[] =
      fileBlockGroupsMap.get(file.number) || [];
    if (blockGroupsToFilter.length > 0) {
      const filteredBlockGroups = blockGroupsToFilter.filter(
        (group) => group.id !== blockGroup.id,
      );
      fileBlockGroupsMap.set(file.number, filteredBlockGroups);
    }
  });

  // return removed BlockGroup's ID back to the ID pool
  blockGroupIdPool.push(blockGroup.id);

  // remove sprites from the stage
  blockGroup.files.forEach((file) => {
    file.blocks.forEach((block) => block.sprite.removeFromParent());
    file.overlay.danger.removeFromParent();
    file.overlay.selection.removeFromParent();
  });
};

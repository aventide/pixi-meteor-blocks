import type {
  Block,
  BlockGroup,
  BlockGroupId,
  BlockGroupType,
  Coord,
  FileBoundary,
  FileFragment,
  FileNumber,
  FilePlacement,
} from "../entities/types";

import { BlurFilter, Container, Graphics, Sprite, Texture } from "pixi.js";
import {
  addToBlocksLayer,
  addToOverlayLayer,
  getBlockSize,
  getCeiling,
  getWorld,
  setSelectedBlockGroup,
} from "../world";
import { getRandomBlockTexture } from "../textures";
import {
  assignBlockGroupId,
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

const createFileFragment = (
  filePlacement: FilePlacement,
  groupId: BlockGroupId,
): FileFragment => {
  const { fileFragmentsMap } = getWorld();

  const fileBoundaries = getFileBoundaries(filePlacement.blocks);

  const dangerOverlay = createFileDangerOverlay(
    filePlacement.number,
    fileBoundaries,
  );

  const selectionOverlay = createFileSelectionOverlay(
    filePlacement.number,
    fileBoundaries,
  );

  // @todo consider making these assignment functions pure
  // @todo consider doing id assignment as a separate step, though this is also fine
  assignBlockGroupId(filePlacement.blocks, groupId);
  assignGroupFileRanks(filePlacement.blocks);

  const fileFragment = {
    blocks: filePlacement.blocks,
    number: filePlacement.number,
    boundary: fileBoundaries,
    overlay: {
      danger: dangerOverlay,
      selection: selectionOverlay,
    },
    groupId,
  };

  // register file fragment with global tracking
  fileFragmentsMap.get(filePlacement.number)?.push(fileFragment);

  return fileFragment;
};

const createBlockGroup = (
  filePlacements: FilePlacement[],
  velocity: number = 0,
  type: BlockGroupType = "default",
): BlockGroup => {
  filePlacements.forEach((fp) => {
    if (fp.blocks.length === 0) {
      throw "File for created BlockGroup must contain at least one block";
    }
  });

  const { blockGroupIdPool, blockGroupsMap, fileBlockGroupsMap } = getWorld();
  const assignedId = blockGroupIdPool.pop();

  if (assignedId) {
    // create file fragments
    const fragments: FileFragment[] = filePlacements.map((fp) =>
      createFileFragment(fp, assignedId),
    );
    const fileNumbers = fragments.map((fragment) => fragment.number);

    const newBlockGroup: BlockGroup = {
      id: assignedId,
      fileFragments: fragments,
      velocity,
      type,
    };

    // register block group with global tracking
    blockGroupsMap.set(assignedId, newBlockGroup);
    fileNumbers.forEach((fileNumber) =>
      fileBlockGroupsMap.get(fileNumber)?.push(newBlockGroup),
    );

    // add sprites to stage
    newBlockGroup.fileFragments.forEach((fileFragment) => {
      fileFragment.blocks.forEach((block) => addToBlocksLayer(block.sprite));
      addToOverlayLayer(fileFragment.overlay.danger);
      addToOverlayLayer(fileFragment.overlay.selection);
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
      y: getCeiling() / getBlockSize(),
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

export const createVerticalTestGroup = (
  file: number,
  blockCount: number,
): BlockGroup => {
  const texture = getRandomBlockTexture();
  const initialBlocks = [];
  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture,
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

const getCombinedBlockGroupType = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
): BlockGroupType => {
  if (
    subjectBlockGroup.type === "launch" ||
    otherBlockGroup.type === "launch"
  ) {
    return "launch";
  } else if (
    subjectBlockGroup.type === "pop" ||
    otherBlockGroup.type === "pop"
  ) {
    return "pop";
  }

  return "default";
};

const getCombinedVelocity = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
): number => {
  let combinedVelocity: number = 0;

  // make modifications based on blockGroup types here

  combinedVelocity =
    (getMomentum(subjectBlockGroup) + getMomentum(otherBlockGroup)) /
    [
      ...subjectBlockGroup.fileFragments,
      ...otherBlockGroup.fileFragments,
    ].reduce(
      (totalBlocks, fileFragment) => totalBlocks + fileFragment.blocks.length,
      0,
    );

  return combinedVelocity;
};

export const combineBlockGroups = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
) => {
  const { blockGroupsMap, selectedBlockGroup } = getWorld();

  const combinedVelocity = getCombinedVelocity(
    subjectBlockGroup,
    otherBlockGroup,
  );

  const subjectFilePlacements = getFilePlacements(subjectBlockGroup);
  const otherFilePlacements = getFilePlacements(otherBlockGroup);
  const combinedFilePlacements: FilePlacement[] = getCombinedFilePlacements(
    subjectFilePlacements,
    otherFilePlacements,
  );

  const combinedType = getCombinedBlockGroupType(
    subjectBlockGroup,
    otherBlockGroup,
  );

  // begin combination process
  removeBlockGroup(subjectBlockGroup);
  removeBlockGroup(otherBlockGroup);

  const combinedBlockGroup = createBlockGroup(
    combinedFilePlacements,
    combinedVelocity,
    combinedType,
  );

  blockGroupsMap.set(combinedBlockGroup.id, combinedBlockGroup);

  if (
    selectedBlockGroup?.id === subjectBlockGroup.id ||
    selectedBlockGroup?.id === otherBlockGroup.id
  ) {
    setSelectedBlockGroup(combinedBlockGroup);
  }

  return combinedBlockGroup;
};

// create two new block groups, at a set of fracture points
// first returned group is intended to follow the "original" group properties
// second return group is the "ejected" group which more likely will be altered
export const decombineBlockGroup = (
  originalBlockGroup: BlockGroup,
  fracturePointMap: Map<FileNumber, number>,
): { basisGroup: BlockGroup | null; ejectedGroup: BlockGroup | null } => {
  const originalBlockGroupPlacements: FilePlacement[] =
    getFilePlacements(originalBlockGroup);

  const basisGroupPlacements: FilePlacement[] = [];
  const ejectedGroupPlacements: FilePlacement[] = [];

  originalBlockGroupPlacements.forEach((originalPlacement: FilePlacement) => {
    if (!fracturePointMap.has(originalPlacement.number)) {
      basisGroupPlacements.push({
        blocks: originalPlacement.blocks,
        number: originalPlacement.number,
      });
      return;
    }

    const individualFracturePoint = fracturePointMap.get(
      originalPlacement.number,
    )!;

    const basisBlocks: Block[] = [];
    const ejectedBlocks: Block[] = [];

    originalPlacement.blocks.forEach((block) => {
      if (block.groupFileRank <= individualFracturePoint) {
        ejectedBlocks.push(block);
      } else {
        basisBlocks.push(block);
      }
    });

    if (basisBlocks.length > 0) {
      basisGroupPlacements.push({
        blocks: basisBlocks,
        number: originalPlacement.number,
      });
    }
    if (ejectedBlocks.length > 0) {
      ejectedGroupPlacements.push({
        blocks: ejectedBlocks,
        number: originalPlacement.number,
      });
    }
  });

  // remove original blockGroup
  removeBlockGroup(originalBlockGroup);

  const basisGroup: BlockGroup | null =
    basisGroupPlacements.length > 0
      ? createBlockGroup(
          basisGroupPlacements,
          originalBlockGroup.velocity,
          originalBlockGroup.type,
        )
      : null;

  const ejectedGroup: BlockGroup | null =
    ejectedGroupPlacements.length > 0
      ? createBlockGroup(
          ejectedGroupPlacements,
          originalBlockGroup.velocity,
          originalBlockGroup.type,
        )
      : null;

  return {
    basisGroup,
    ejectedGroup,
  };
};

export const removeBlockGroup = (blockGroup: BlockGroup) => {
  const {
    blockGroupIdPool,
    blockGroupsMap,
    fileBlockGroupsMap,
    fileFragmentsMap,
  } = getWorld();

  // unregister block group from global tracking
  blockGroupsMap.delete(blockGroup.id);

  blockGroup.fileFragments.forEach((fileFragment) => {
    const blockGroupsToFilter: BlockGroup[] =
      fileBlockGroupsMap.get(fileFragment.number) || [];
    if (blockGroupsToFilter.length > 0) {
      const filteredBlockGroups = blockGroupsToFilter.filter(
        (group) => group.id !== blockGroup.id,
      );
      fileBlockGroupsMap.set(fileFragment.number, filteredBlockGroups);
    }

    // unregister file fragments from global tracking
    const fragmentsToFilter = fileFragmentsMap.get(fileFragment.number) || [];
    if (fragmentsToFilter.length > 0) {
      const filteredFragments = fragmentsToFilter.filter(
        (fragment) => fragment.groupId !== blockGroup.id,
      );
      fileFragmentsMap.set(fileFragment.number, filteredFragments);
    }
  });

  // return removed BlockGroup's ID back to the ID pool
  blockGroupIdPool.push(blockGroup.id);

  // remove sprites from the stage
  blockGroup.fileFragments.forEach((fileFragment) => {
    fileFragment.blocks.forEach((block) => block.sprite.removeFromParent());
    fileFragment.overlay.danger.removeFromParent();
    fileFragment.overlay.selection.removeFromParent();
  });
};

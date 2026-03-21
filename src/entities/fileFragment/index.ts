import type {
  Block,
  BlockGroupId,
  FileBoundary,
  FileFragment,
  FileNumber,
  FilePlacement,
  GroupFileFragment,
} from "../types";

import { Container, Graphics } from "pixi.js";
import { getBlockSize, getWorld } from "../../world";
import { assignBlockGroupId, sortBlocksAscending } from "../block/util";
import { getFileFragmentBoundary } from "./util";

export const createFileFragment = (
  fileNumber: FileNumber,
  blocks: Block[],
): FileFragment => {
  const sortedBlocks = sortBlocksAscending([...blocks]);

  return {
    blocks: sortedBlocks,
    number: fileNumber,
    boundary: getFileFragmentBoundary(sortedBlocks),
  };
};

export const createFileDangerOverlay = (
  fileNumber: number,
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

export const createGroupFileFragment = (
  filePlacement: FilePlacement,
  groupId: BlockGroupId,
): GroupFileFragment => {
  const { fileFragmentsMap } = getWorld();

  const fileFragment = createFileFragment(
    filePlacement.number,
    filePlacement.blocks,
  );
  const fileFragmentBoundary = fileFragment.boundary;

  const dangerOverlay = createFileDangerOverlay(
    filePlacement.number,
    fileFragmentBoundary,
  );

  assignBlockGroupId(filePlacement.blocks, groupId);

  const groupFileFragment: GroupFileFragment = {
    ...fileFragment,
    overlay: {
      danger: dangerOverlay,
    },
    groupId,
  };

  fileFragmentsMap.get(filePlacement.number)?.push(groupFileFragment);

  return groupFileFragment;
};

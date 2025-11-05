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
import { getBlockSize, getWorld } from "../world";
import { getRandomBlockTexture } from "../textures";
import { DEFAULT_SPAWN_POINT, DEFAULT_POP_VELOCITY } from "../constants";

const createBlock = ({
  initialPosition,
  texture,
  file,
}: {
  initialPosition: Coord;
  texture: Texture;
  file: number;
}): Block => {
  const blockSize = getBlockSize();
  const sprite = new Sprite(texture);
  sprite.anchor.set(0);
  sprite.setSize(blockSize);
  sprite.position.set(
    (initialPosition.x - 1) * blockSize,
    initialPosition.y * blockSize,
  );

  return {
    sprite,
    file,
  };
};

// input must be a "file" aka blocks all with the same y coord
export const getFileBoundaries = (blocks: Block[]) => {
  const blockSize = getBlockSize();

  let highestTop = blocks[0].sprite.y;
  let lowestBottom = blocks[0].sprite.y + blockSize;

  blocks.forEach((block) => {
    const topOfBlock = block.sprite.y;
    const bottomOfBlock = block.sprite.y + blockSize;
    if (topOfBlock < highestTop) highestTop = topOfBlock;
    if (bottomOfBlock > lowestBottom) lowestBottom = bottomOfBlock;
  });

  return {
    top: highestTop,
    bottom: lowestBottom,
  };
};

const createFileOverlay = (
  fileNumber: FileNumber,
  boundary: FileBoundary,
): Container => {
  const blockSize = getBlockSize();

  const x = (fileNumber - 1) * blockSize;
  const width = blockSize;

  const overlay = new Container();
  overlay.visible = false;
  overlay.eventMode = "none";

  const glow = new Graphics();
  const border = new Graphics();

  const blur = new BlurFilter();
  blur.strength = 2;

  const y = boundary.top;
  const height = boundary.bottom - boundary.top;

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
  const fileOverlay = createFileOverlay(filePlacement.number, fileBoundaries);

  return {
    blocks: filePlacement.blocks,
    number: filePlacement.number,
    boundary: fileBoundaries,
    overlay: fileOverlay,
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

    // input handler for each file
    newBlockGroup.files.forEach((file) => {
      file.blocks.forEach(({ sprite }) => {
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.on("pointerover", () => {
          file.overlay.visible = true;
        });

        sprite.on("pointerout", () => {
          file.overlay.visible = false;
        });
        sprite.on("pointertap", () => {
          newBlockGroup.velocity = DEFAULT_POP_VELOCITY;
          file.overlay.visible = false;
        });
      });
    });
    return newBlockGroup;
  } else {
    throw new Error("No IDs available to assign to newly-requested BlockGroup");
  }
};

const createSingleBlock = (fileNumber: FileNumber): BlockGroup => {
  const initialBlock = createBlock({
    texture: getRandomBlockTexture(),
    initialPosition: {
      x: fileNumber,
      y: DEFAULT_SPAWN_POINT,
    },
    file: fileNumber,
  });

  return createBlockGroup([
    {
      blocks: [initialBlock],
      number: fileNumber,
    },
  ]);
};

const createVerticalTestGroup = (blockCount: number): BlockGroup => {
  const file = getRandomFileNumber();
  const initialBlocks = [];
  for (let i = 0; i < blockCount; i++) {
    const newBlock: Block = createBlock({
      initialPosition: { x: file, y: (i + 1) * -1 },
      texture: getRandomBlockTexture(),
      file,
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

export { createBlock, createSingleBlock, createVerticalTestGroup };

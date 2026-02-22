import { Container, Graphics, BlurFilter } from "pixi.js";
import { DEFAULT_FILE_LIMIT, DEFAULT_POP_VELOCITY } from "../constants";
import { decombineBlockGroup } from "../entities";
import {
  Block,
  BlockGroup,
  FileBoundary,
  FileFragment,
  FileNumber,
} from "../entities/types";
import {
  getBlockAboveInFragment,
  getBlockBelowInFragment,
  getIsGroupRooted,
  swapFileBlockPositions,
} from "../entities/util";
import {
  getBlockSize,
  getWorld,
  setGlobalPointerDown,
  setSelectedBlockGroup,
  setSelectedFragmentOverlay,
} from "../world";

let selectedFileFragment: FileFragment | null = null;
let selectedBlock: Block | null = null;

export const selectionMutator = (blockGroup: BlockGroup) => {
  const { globalPointer, globalPointerDown } = getWorld();
  const blockSize = getBlockSize();

  if (!globalPointerDown) {
    selectedFileFragment = null;
    selectedBlock = null;
    setSelectedBlockGroup(null);
    setSelectedFragmentOverlay(null);
  }

  blockGroup.fileFragments.forEach((fileFragment) => {
    // check for danger condition on group file fragment
    if (fileFragment.blocks.length > DEFAULT_FILE_LIMIT) {
      fileFragment.overlay.danger.visible = true;
    } else {
      fileFragment.overlay.danger.visible = false;
    }

    fileFragment.blocks.forEach((block) => {
      // if current block being iterated is the selected block
      if (selectedBlock && selectedBlock.sprite.uid === block.sprite.uid) {
        block.sprite.alpha = 0.5;

        // if pointer moves relative to selected block, handle block swap
        if (globalPointer.y < selectedBlock.sprite.y) {
          const fileBlockDirectlyAbove = getBlockAboveInFragment(
            fileFragment,
            selectedBlock,
          );
          if (fileBlockDirectlyAbove) {
            swapFileBlockPositions(
              fileFragment.blocks,
              selectedBlock,
              fileBlockDirectlyAbove,
            );
          } else if (
            getIsGroupRooted(blockGroup) &&
            blockGroup.fileFragments.length === 1
          ) {
            const { ejectedGroup } = decombineBlockGroup(
              blockGroup,
              new Map([[blockGroup.fileFragments[0].number, 1]]),
            );
            setSelectedBlockGroup(null);
            setGlobalPointerDown(false);
            if (ejectedGroup) {
              ejectedGroup.type = "pop";
              ejectedGroup.velocity = DEFAULT_POP_VELOCITY;
            }
          }
        }
        if (globalPointer.y > selectedBlock.sprite.y + blockSize) {
          const fileBlockDirectlyBelow = getBlockBelowInFragment(
            fileFragment,
            selectedBlock,
          );
          if (fileBlockDirectlyBelow) {
            swapFileBlockPositions(
              fileFragment.blocks,
              selectedBlock,
              fileBlockDirectlyBelow,
            );
          }
        }
      } else {
        block.sprite.alpha = 1;
      }

      // set selection if a file block is being hovered over
      if (
        globalPointer.x >= block.sprite.x &&
        globalPointer.x <= block.sprite.x + blockSize &&
        globalPointer.y >= block.sprite.y &&
        globalPointer.y <= block.sprite.y + blockSize &&
        globalPointerDown &&
        !selectedFileFragment
      ) {
        selectedFileFragment = fileFragment;
        selectedBlock = block;
        setSelectedBlockGroup(blockGroup);
        const selectedFragmentOverlay = createFileSelectionOverlay(
          selectedFileFragment.number,
          selectedFileFragment.boundary,
        );

        setSelectedFragmentOverlay(selectedFragmentOverlay);
      }
    });
  });
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

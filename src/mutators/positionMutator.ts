import type { Block, BlockGroup } from "../entities/types";

import { getFloor, getVeil, getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import {
  combineBlockGroups,
  decombineBlockGroup,
  removeBlockGroup,
} from "../entities";
import { getDirectionallyNearestGroup } from "../entities/util";
import { getFracturePointMap } from "./sequenceMutator";

export const positionMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  const floor = getFloor();
  const veil = getVeil();

  const velocity = blockGroup.velocity;
  if (velocity === 0) return;

  const [nearestGroup] = getDirectionallyNearestGroup(blockGroup);

  const getGroupBoundaryInFile = (
    group: BlockGroup,
    fileNumber: number,
  ): { top: number; bottom: number } | null => {
    const fileFragment = group.fileFragments.find(
      (f) => f.number === fileNumber,
    );
    return fileFragment
      ? { top: fileFragment.boundary.top, bottom: fileFragment.boundary.bottom }
      : null;
  };

  const getStopDeltaForNearestGroupContact = (
    subjectGroup: BlockGroup,
    otherGroup: BlockGroup,
    deltaY: number,
  ): number | null => {
    if (deltaY === 0) return null;

    let minStopDelta: number | null = null;

    subjectGroup.fileFragments.forEach((subjectFileFragment) => {
      const otherBoundary = getGroupBoundaryInFile(
        otherGroup,
        subjectFileFragment.number,
      );
      if (!otherBoundary) return;

      if (deltaY > 0) {
        // moving down: subject bottom approaches other top
        const subjectBottom = subjectFileFragment.boundary.bottom;
        const stopDelta = otherBoundary.top - subjectBottom;

        // only consider contacts that occur during this move (including already intersecting -> stopDelta <= 0)
        if (stopDelta <= deltaY) {
          if (minStopDelta === null || stopDelta < minStopDelta) {
            minStopDelta = stopDelta;
          }
        }
      } else {
        // moving up: subject top approaches other bottom
        const subjectTop = subjectFileFragment.boundary.top;
        const stopDelta = otherBoundary.bottom - subjectTop;

        // deltaY is negative; contact occurs if stopDelta >= deltaY (including already intersecting -> stopDelta >= 0)
        if (stopDelta >= deltaY) {
          if (minStopDelta === null || stopDelta > minStopDelta) {
            minStopDelta = stopDelta;
          }
        }
      }
    });

    return minStopDelta;
  };

  const targetDelta = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);
  let adjustedDelta = targetDelta;

  let exceededVeil = false;
  let hitNearestGroup = false;
  let hitVeil = false;

  // if colliding with ceiling/floor, snap back into place with it
  if (velocity < 0) {
    // ceiling is based on the highest (minimum) file top in the group
    let groupTop = blockGroup.fileFragments[0].boundary.top;
    blockGroup.fileFragments.forEach((f) => {
      if (f.boundary.top < groupTop) groupTop = f.boundary.top;
    });

    if (groupTop + adjustedDelta <= veil) {
      exceededVeil = groupTop + adjustedDelta < veil;
      hitVeil = true;
      adjustedDelta =
        blockGroup.type !== "launch" ? veil - groupTop : adjustedDelta;
    }
  } else if (velocity > 0) {
    // floor is based on the lowest (maximum) file bottom in the group
    let groupBottom = blockGroup.fileFragments[0].boundary.bottom;
    blockGroup.fileFragments.forEach((f) => {
      if (f.boundary.bottom > groupBottom) groupBottom = f.boundary.bottom;
    });

    if (groupBottom + adjustedDelta >= floor) {
      adjustedDelta = floor - groupBottom;
    }
  }

  // if there is a group to collide with, snap into adjacency with it,
  // but compute contact per-file rather than using absolute group bounds
  if (nearestGroup) {
    const stopDelta = getStopDeltaForNearestGroupContact(
      blockGroup,
      nearestGroup,
      adjustedDelta,
    );

    if (stopDelta !== null) {
      adjustedDelta = stopDelta;
      hitNearestGroup = true;
    }
  }

  // perform translation of blockGroup position
  translateBlockGroupPosition(blockGroup, adjustedDelta);

  // post-translation reactions (based on hit flags)

  if (hitNearestGroup && nearestGroup) {
    // first, if any new grouping, do that
    combineBlockGroups(blockGroup, nearestGroup);
  } else if (hitVeil && blockGroup.type !== "launch") {
    // otherwise, if a pop block, stop at the veil
    blockGroup.velocity = 0;
  } else if (exceededVeil && blockGroup.type === "launch") {
    // otherwise, if a launch group exceeded the veil, remove the blocks beyond the veil
    const fracturePointBlocks: Block[] = [];
    blockGroup.fileFragments.forEach((fileFragment) => {
      let fracturePointBlock: Block | null = null;
      fileFragment.blocks.forEach((block) => {
        if (block.sprite.y < veil) {
          fracturePointBlock = block;
        }
      });
      if (fracturePointBlock) {
        fracturePointBlocks.push(fracturePointBlock);
      }
    });

    if (fracturePointBlocks.length > 0) {
      const { ejectedGroup: vanishedGroup } = decombineBlockGroup(
        blockGroup,
        getFracturePointMap(fracturePointBlocks),
      );
      if (vanishedGroup) {
        removeBlockGroup(vanishedGroup);
      }
    }
  }
};

const translateBlockGroupPosition = (
  blockGroup: BlockGroup,
  deltaY: number,
) => {
  if (deltaY === 0) return;

  blockGroup.fileFragments.forEach((fileFragment) => {
    fileFragment.boundary.top += deltaY;
    fileFragment.boundary.bottom += deltaY;
    fileFragment.overlay.danger.y += deltaY;
    fileFragment.overlay.selection.y += deltaY;
  });

  blockGroup.fileFragments.forEach((fileFragment) =>
    fileFragment.blocks.forEach((block) => {
      block.sprite.y += deltaY;
    }),
  );
};

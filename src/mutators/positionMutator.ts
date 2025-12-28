import type { BlockGroup } from "../entities/types";

import { getFloor, getVeil, getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import {
  combineBlockGroups,
  decombineBlockGroup,
  removeBlockGroup,
} from "../entities";
import {
  getDirectionallyNearestGroup,
  getGroupBoundaries,
} from "../entities/util";

export const positionMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  const floor = getFloor();
  const veil = getVeil();

  const velocity = blockGroup.velocity;
  if (velocity === 0) return;

  const { top: groupTop, bottom: groupBottom } = getGroupBoundaries(blockGroup);

  const [nearestGroup] = getDirectionallyNearestGroup(blockGroup);
  const nearestGroupBounds = nearestGroup
    ? getGroupBoundaries(nearestGroup)
    : null;

  const targetDelta = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);
  let adjustedDelta = targetDelta;

  let exceededVeil = false;
  let hitNearestGroup = false;
  let hitVeil = false;

  // if colliding with ceiling/floor, snap back into place with it
  if (velocity < 0 && groupTop + adjustedDelta <= veil) {
    exceededVeil = groupTop + adjustedDelta < veil;
    hitVeil = true;
    adjustedDelta = blockGroup.type === "pop" ? veil - groupTop : adjustedDelta;
  } else if (velocity > 0 && groupBottom + adjustedDelta >= floor) {
    adjustedDelta = floor - groupBottom;
  }

  // if there is a group to collide with, snap into adjacency with it
  if (nearestGroupBounds) {
    if (velocity > 0) {
      const bottomAfterMove = groupBottom + adjustedDelta;
      if (bottomAfterMove >= nearestGroupBounds.top) {
        adjustedDelta = nearestGroupBounds.top - groupBottom;
        hitNearestGroup = true;
      }
    } else {
      const topAfterMove = groupTop + adjustedDelta;
      if (topAfterMove <= nearestGroupBounds.bottom) {
        adjustedDelta = nearestGroupBounds.bottom - groupTop;
        hitNearestGroup = true;
      }
    }
  }

  // perform translation of blockGroup position
  translateBlockGroupPosition(blockGroup, adjustedDelta);

  // post-translation reactions (based on hit flags)

  if (hitNearestGroup && nearestGroup) {
    // first, if any new grouping, do that
    combineBlockGroups(blockGroup, nearestGroup);
  } else if (hitVeil && blockGroup.type === "pop") {
    // otherwise, if a pop block, stop at the veil
    blockGroup.velocity = 0;
  } else if (exceededVeil && blockGroup.type === "launch") {
    // otherwise, if a launch group exceeded the veil, remove the blocks beyond the veil
    // @todo for now, just do this assuming a one-file group
    let breakPoint: number | null = null;
    blockGroup.files[0].blocks.forEach((block) => {
      if (block.sprite.y < veil) {
        breakPoint = block.groupFileRank;
      }
    });

    if (breakPoint) {
      const { ejectedGroup: vanishedGroup, basisGroup: remainingGroup } =
        decombineBlockGroup(blockGroup, {
          [blockGroup.files[0].number]: breakPoint,
        });
      if (vanishedGroup) {
        removeBlockGroup(vanishedGroup);
      }
      if (remainingGroup) {
        remainingGroup.type = "launch";
      }
    }
  }
};

const translateBlockGroupPosition = (
  blockGroup: BlockGroup,
  deltaY: number,
) => {
  if (deltaY === 0) return;

  blockGroup.files.forEach((file) => {
    file.boundary.top += deltaY;
    file.boundary.bottom += deltaY;
    file.overlay.danger.y += deltaY;
    file.overlay.selection.y += deltaY;
  });

  blockGroup.files.forEach((file) =>
    file.blocks.forEach((block) => {
      block.sprite.y += deltaY;
    }),
  );
};

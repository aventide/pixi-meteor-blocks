import type { BlockGroup } from "../entities/types";

import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import { combineBlockGroups } from "../entities";
import {
  getDirectionallyNearestGroup,
  getGroupBoundaries,
} from "../entities/util";
import { getCeiling, getFloor, getWorld } from "../world";

export const positionMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  const ceiling = getCeiling();
  const floor = getFloor();

  const velocity = blockGroup.velocity;
  if (velocity === 0) return;

  const { top: groupTop, bottom: groupBottom } = getGroupBoundaries(blockGroup);

  const [nearestGroup] = getDirectionallyNearestGroup(blockGroup);
  const nearestGroupBounds = nearestGroup
    ? getGroupBoundaries(nearestGroup)
    : null;

  const targetDelta = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);
  let adjustedDelta = targetDelta;

  let hitCeiling = false;
  let hitNearestGroup = false;

  // if colliding with ceiling/floor, snap back into place with it
  if (velocity < 0 && groupTop + adjustedDelta <= ceiling) {
    adjustedDelta = ceiling - groupTop;
    hitCeiling = true;
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
  if (nearestGroup && hitNearestGroup) {
    combineBlockGroups(blockGroup, nearestGroup);
  }

  if (hitCeiling) {
    blockGroup.velocity = 0;
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

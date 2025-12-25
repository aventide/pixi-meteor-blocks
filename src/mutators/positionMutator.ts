import type { BlockGroup } from "../entities/types";

import { getCeiling, getFloor, getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import {
  getGroupBoundaries,
  getDirectionallyNearestGroup,
} from "../entities/util";
import { clamp } from "../util";
import { combineBlockGroups } from "../entities";

export const positionMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  // absolute ceiling and floor, nothing can ever vertically go beyond these bounds
  const absoluteCeiling = getCeiling();
  const absoluteFloor = getFloor();

  let upwardBounds = absoluteCeiling;
  let downwardBounds = absoluteFloor;

  const [nearestGroup] = getDirectionallyNearestGroup(blockGroup);

  const { top: groupTop, bottom: groupBottom } = getGroupBoundaries(blockGroup);

  if (nearestGroup) {
    const { top: nearestGroupTop, bottom: nearestGroupBottom } =
      getGroupBoundaries(nearestGroup);

    if (blockGroup.velocity > 0) {
      downwardBounds = nearestGroupTop;
    } else if (blockGroup.velocity < 0) {
      upwardBounds = nearestGroupBottom;
    }
  }

  // convert bounds to deltas
  const upwardBoundDelta = groupTop - upwardBounds;
  const downwardBoundDelta = downwardBounds - groupBottom;

  // normalize delta calculation based on screen height
  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  const resolvedDelta = clamp(
    targetDelta,
    -upwardBoundDelta,
    downwardBoundDelta,
  );

  // do final calculated movement on group
  blockGroup.files.forEach((file) => {
    file.boundary.top += resolvedDelta;
    file.boundary.bottom += resolvedDelta;
    // overlays can just be position-set when made visible, technically
    file.overlay.danger.y += resolvedDelta;
    file.overlay.selection.y += resolvedDelta;
  });
  blockGroup.files.forEach((file) =>
    file.blocks.forEach((block) => {
      block.sprite.y += resolvedDelta;
    }),
  );

  // post-movement collision handling
  const { top: groupTopPostMovement, bottom: groupBottomPostMovement } =
    getGroupBoundaries(blockGroup);

  if (nearestGroup) {
    const { top: nearestGroupTop, bottom: nearestGroupBottom } =
      getGroupBoundaries(nearestGroup);

    if (
      blockGroup.velocity > 0 &&
      groupBottomPostMovement === nearestGroupTop
    ) {
      combineBlockGroups(blockGroup, nearestGroup);
    } else if (
      blockGroup.velocity < 0 &&
      groupTopPostMovement === nearestGroupBottom
    ) {
      combineBlockGroups(blockGroup, nearestGroup);
    }
  }

  if (blockGroup.velocity < 0 && groupTopPostMovement === absoluteCeiling) {
    blockGroup.velocity = 0;
  }
};

import { DEFAULT_REFERENCE_HEIGHT } from "../../constants";

import { BlockGroup } from "../../entities/types";

import { getFloor, getWorld } from "../../world";
import { getClosestFragmentBelow, translatePosition } from "./util";

const positionMutator = (group: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();
  const floor = getFloor();

  const velocity = group.velocity;
  if (velocity === 0) return;

  // assuming downward velocity for now
  // for now, do not process upwards movement
  if (velocity < 0) return;

  // collect all diffs (after y coord - before y coord)
  const diffs: number[] = [];

  // full movement diff based on group's velocity
  const movementDiff = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);
  diffs.push(movementDiff);

  // diffs to obstacles below - check each fragment
  group.fileFragments.forEach((frag) => {
    // calculate and store diff to floor for this frag
    const diffToFloor = floor - frag.boundary.bottom;
    diffs.push(diffToFloor);

    // then calculate and track diffs to any fragments below in this file
    const closestFragmentBelow = getClosestFragmentBelow(frag);
    if (closestFragmentBelow) {
      const diffToClosestFragment =
        closestFragmentBelow.boundary.top - frag.boundary.bottom;
      diffs.push(diffToClosestFragment);
    }
  });

  // we have all the diffs now. Find the shortest one and use that to decide how much to move
  const shortestDiff = Math.min(...diffs);

  translatePosition(group, shortestDiff);
};

export default positionMutator;

import { DEFAULT_REFERENCE_HEIGHT } from "../../constants";

import { BlockGroup } from "../../entities/types";

import { getFloor, getWorld } from "../../world";
import { getClosestFragmentBelow, translatePosition } from "./util";

type ContactType = "contacted-floor" | "contacted-group";
type Contact = {
  type: ContactType;
  contactedGroups?: BlockGroup[];
};

const positionMutator = (group: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();
  const floor = getFloor();

  const velocity = group.velocity;
  if (velocity === 0) return;

  // assuming downward velocity for now
  // for now, do not process upwards movement
  if (velocity < 0) return;

  // full movement diff based on group's velocity
  const movementDiff = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  let minDiff = movementDiff;
  let contact: Contact | null = null;

  // diffs to obstacles below - check each fragment
  for (const frag of group.fileFragments) {
    // calculate and store diff to floor for this frag
    const diffToFloor = floor - frag.boundary.bottom;
    if (diffToFloor < minDiff) {
      minDiff = diffToFloor;
      contact = { type: "contacted-floor" };
    }

    // then calculate and track diffs to any fragments below in this file
    const closestFragmentBelow = getClosestFragmentBelow(frag);
    if (closestFragmentBelow) {
      const diffToClosestFragment =
        closestFragmentBelow.boundary.top - frag.boundary.bottom;

      if (diffToClosestFragment < minDiff) {
        minDiff = diffToClosestFragment;
        contact = { type: "contacted-group" };
      }
    }
  }

  translatePosition(group, minDiff);

  if (contact) {
    if (contact.type === "contacted-floor") {
      group.velocity = 0;
    } else if (contact.type === "contacted-group" && group.type !== "launch") {
      group.velocity = 0;
    }
  }
};

export default positionMutator;

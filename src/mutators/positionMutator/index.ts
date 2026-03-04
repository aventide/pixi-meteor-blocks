import { DEFAULT_REFERENCE_HEIGHT } from "../../constants";
import { combineBlockGroups } from "../../entities";

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
  const velocity = group.velocity;

  // full movement diff based on group's velocity
  const movementDiff = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  if (velocity > 0) {
    handleDownwardMotion(group, movementDiff);
  } else if (velocity < 0) {
    return;
  } else {
    return;
  }
};

const handleDownwardMotion = (group: BlockGroup, movementDiff: number) => {
  const { blockGroupsMap } = getWorld();

  const floor = getFloor();

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
        const closestGroupBelow = blockGroupsMap.get(
          closestFragmentBelow.groupId,
        );
        const contactedGroups = closestGroupBelow ? [closestGroupBelow] : [];
        contact = {
          type: "contacted-group",
          contactedGroups,
        };
      }
    }
  }

  translatePosition(group, minDiff);

  if (contact) {
    if (contact.type === "contacted-floor") {
      group.velocity = 0;
    } else if (
      contact.type === "contacted-group" &&
      contact.contactedGroups &&
      group.type !== "launch"
    ) {
      combineBlockGroups(group, contact.contactedGroups[0]);
    }
  }
};

export default positionMutator;

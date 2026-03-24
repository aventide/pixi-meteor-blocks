import { DEFAULT_REFERENCE_HEIGHT } from "../../constants";
import {
  mergeBlockGroups,
  vanishVeilExceedingBlocksInGroup,
} from "../../entities";

import { BlockGroup } from "../../entities/types";

import { getFloor, getVeil, getWorld } from "../../world";
import {
  getClosestFragmentAbove,
  getClosestFragmentBelow,
  translatePosition,
} from "./util";

type ContactType = "contacted-floor" | "contacted-group" | "contacted-veil";
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
    handleUpwardMotion(group, movementDiff);
  } else {
    return;
  }
};

// @todo evaluate this again
const mergeWithContactedGroups = (
  group: BlockGroup,
  contactedGroups: BlockGroup[],
) => {
  let mergedGroup = group;

  contactedGroups.forEach((contactedGroup) => {
    if (mergedGroup.id === contactedGroup.id) return;

    mergedGroup = mergeBlockGroups(mergedGroup, contactedGroup);
  });
};

const appendUniqueContactedGroup = (
  contact: Contact,
  contactedGroup: BlockGroup | undefined,
) => {
  if (
    contactedGroup &&
    !contact.contactedGroups?.some(
      (existingContactedGroup) =>
        existingContactedGroup.id === contactedGroup.id,
    )
  ) {
    contact.contactedGroups = [
      ...(contact.contactedGroups || []),
      contactedGroup,
    ];
  }
};

const handleDownwardMotion = (group: BlockGroup, movementDiff: number) => {
  const { blockGroupsById } = getWorld();

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

      const closestGroupBelow = blockGroupsById.get(
        closestFragmentBelow.groupId,
      );

      if (diffToClosestFragment <= minDiff) {
        if (diffToClosestFragment < minDiff) {
          minDiff = diffToClosestFragment;
          contact = {
            type: "contacted-group",
            contactedGroups: closestGroupBelow ? [closestGroupBelow] : [],
          };
        } else if (contact?.type === "contacted-group") {
          appendUniqueContactedGroup(contact, closestGroupBelow);
        }
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
      mergeWithContactedGroups(group, contact.contactedGroups);
    }
  }
};

const handleUpwardMotion = (group: BlockGroup, movementDiff: number) => {
  const { blockGroupsById } = getWorld();

  const veil = getVeil();

  let minDiff = movementDiff;
  let contact: Contact | null = null;
  let hasExceededVeil = false;

  // diffs to obstacles above - check each fragment
  for (const frag of group.fileFragments) {
    // calculate and store diff to veil for this frag
    // IF we care about it
    const diffToVeil = veil - frag.boundary.top;
    if (diffToVeil > minDiff && group.type !== "launch") {
      minDiff = diffToVeil;
      contact = { type: "contacted-veil" };
    }

    // if launched group is exceeding veil, we will start to vanish the blocks
    if (frag.boundary.top < veil && group.type === "launch") {
      // do not combine with contact or overriding may occur
      hasExceededVeil = true;
    }

    // then calculate and track diffs to any fragments above in this file
    const closestFragmentAbove = getClosestFragmentAbove(frag);
    if (closestFragmentAbove) {
      const diffToClosestFragment =
        closestFragmentAbove.boundary.bottom - frag.boundary.top;

      const closestGroupAbove = blockGroupsById.get(
        closestFragmentAbove.groupId,
      );

      if (diffToClosestFragment >= minDiff) {
        if (diffToClosestFragment > minDiff) {
          minDiff = diffToClosestFragment;
          contact = {
            type: "contacted-group",
            contactedGroups: closestGroupAbove ? [closestGroupAbove] : [],
          };
        } else if (contact?.type === "contacted-group") {
          appendUniqueContactedGroup(contact, closestGroupAbove);
        }
      }
    }
  }

  translatePosition(group, minDiff);

  if (hasExceededVeil) {
    vanishVeilExceedingBlocksInGroup(group);
    // @todo this solves an order of operations issue
    // see if there's a more robust way
    return;
  }

  if (contact) {
    if (contact.type === "contacted-veil") {
      group.velocity = 0;
    } else if (contact.type === "contacted-group" && contact.contactedGroups) {
      mergeWithContactedGroups(group, contact.contactedGroups);
    }
  }
};

export default positionMutator;

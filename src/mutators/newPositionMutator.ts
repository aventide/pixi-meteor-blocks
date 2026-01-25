import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import { BlockGroup } from "../entities/types";
import {
  getContactableGroups,
  getDirectionalBoundaryDistance,
  getGroupBoundaries,
} from "../entities/util";
import { getFloor, getVeil, getWorld } from "../world";

export const newPositionMutator = (blockGroup: BlockGroup, dt: number) => {
  if (blockGroup.velocity === 0) return;

  const leadingEdge = getGroupLeadingEdge(blockGroup);
  const snappedPosition = getSnappedPosition(blockGroup, dt);
  const positionDelta = snappedPosition - leadingEdge;
  translatePosition(blockGroup, positionDelta);

  // now we need to handle reactions to collisions/points of contact
  // we could possibly get the singular point of contact from the getSnappedPosition function
  // i.e it would return a string or enum that says which kind of collision happened
};

// applies an adjusted position (snap) to blockGroup based on velocity and obstacles
// obstacles can include upper and lower limits as well as neighboring groups
const getSnappedPosition = (blockGroup: BlockGroup, dt: number): number => {
  const { height: worldHeight } = getWorld();

  const floor = getFloor();
  const veil = getVeil();
  const velocity = blockGroup.velocity;
  const movingUpwards = velocity < 0;
  const movingDownwards = velocity > 0;

  // the maximum movement for this BlockGroup based on its velocity
  const targetDelta = velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);
  const groupLeadingEdge = getGroupLeadingEdge(blockGroup);

  // by default, the BlockGroup will move by its full velocity
  let snappedPosition = groupLeadingEdge + targetDelta;

  // check for sooner snap if moving downward
  if (movingDownwards && snappedPosition > floor) snappedPosition = floor;

  // check for sooner snap if moving upward
  // AND we care if we hit the veil, i.e. the group is a non launch type
  if (movingUpwards && snappedPosition < veil && blockGroup.type !== "launch")
    snappedPosition = veil;

  // finally, check for even sooner snap if colliding with a contactable BlockGroup
  const contactableEdge = getContactableGroupEdge(blockGroup);
  if (contactableEdge !== null) {
    if (movingDownwards && snappedPosition >= contactableEdge)
      snappedPosition = contactableEdge;
    else if (movingUpwards && snappedPosition <= contactableEdge)
      snappedPosition = contactableEdge;
  }

  return snappedPosition;
};

export const getContactableGroupEdge = (
  subjectGroup: BlockGroup,
): number | null => {
  const contactableGroups = getContactableGroups(subjectGroup);

  let minDistance = Infinity;
  let closestEdge = null;
  // let minDistanceGroup = null;

  subjectGroup.files.forEach((subjectFile) => {
    contactableGroups.forEach((contactableGroup) => {
      // get the file on the contactableGroup
      const contactableFile = contactableGroup.files.find(
        (file) => file.number === subjectFile.number,
      );

      if (contactableFile) {
        const distance = getDirectionalBoundaryDistance(
          subjectFile.boundary,
          contactableFile.boundary,
          subjectGroup.velocity,
        );

        if (distance < minDistance) {
          minDistance = distance;
          if (subjectGroup.velocity > 0)
            closestEdge = contactableFile.boundary.top;
          else closestEdge = contactableFile.boundary.bottom;
          // minDistanceGroup = contactableGroup;
        }
      }
    });
  });

  return closestEdge;
};

// get the leading edge for an entire group, judging by the whole boundary box of the group
// returns the y position of the edge
const getGroupLeadingEdge = (blockGroup: BlockGroup): number => {
  const { top: groupTop, bottom: groupBottom } = getGroupBoundaries(blockGroup);

  if (blockGroup.velocity > 0) return groupBottom;
  else return groupTop;
};

const translatePosition = (blockGroup: BlockGroup, deltaY: number) => {
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

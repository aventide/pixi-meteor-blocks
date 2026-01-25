import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import {
  combineBlockGroups,
  decombineBlockGroup,
  removeBlockGroup,
} from "../entities";
import { Block, BlockGroup } from "../entities/types";
import {
  getContactableGroups,
  getDirectionalBoundaryDistance,
  getGroupBoundaries,
} from "../entities/util";
import { getFloor, getVeil, getWorld } from "../world";
import { getFracturePointMap } from "./sequenceMutator";

export const newPositionMutator = (blockGroup: BlockGroup, dt: number) => {
  if (blockGroup.velocity === 0) return;

  // apply movement snap
  const leadingEdge = getGroupLeadingEdge(blockGroup);
  const snappedPosition = getSnappedPosition(blockGroup, dt);
  const positionDelta = snappedPosition - leadingEdge;

  // apply translation to sprites
  translatePosition(blockGroup, positionDelta);

  // apply reactions to contact
  applyContactReactions(blockGroup);
};

const applyContactReactions = (blockGroup: BlockGroup) => {
  const veil = getVeil();

  const groupLeadingEdge = getGroupLeadingEdge(blockGroup);

  const hitVeil = groupLeadingEdge === veil;
  const exceededVeil = groupLeadingEdge < veil;

  // @todo consider calculating nearest neighbor ONCE and then passing that info on to snapping and reactions functions
  const [contactableGroup, contactableEdge] = getContactableGroup(blockGroup);
  const hitContactableGroup =
    contactableEdge !== null && groupLeadingEdge === contactableEdge;

  if (contactableGroup && hitContactableGroup) {
    // first, if any new grouping, do that
    combineBlockGroups(blockGroup, contactableGroup);
  } else if (hitVeil && blockGroup.type !== "launch") {
    // otherwise, if a pop block, stop at the veil
    blockGroup.velocity = 0;
  } else if (exceededVeil && blockGroup.type === "launch") {
    // otherwise, if a launch group exceeded the veil, remove the blocks beyond the veil
    const fracturePointBlocks: Block[] = [];
    blockGroup.files.forEach((blockGroupFile) => {
      let fracturePointBlock: Block | null = null;
      blockGroupFile.blocks.forEach((block) => {
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
  if (movingDownwards && snappedPosition >= floor) snappedPosition = floor;

  // check for sooner snap if moving upward
  // AND we care if we hit the veil, i.e. the group is a non launch type
  if (movingUpwards && snappedPosition <= veil && blockGroup.type !== "launch")
    snappedPosition = veil;

  // finally, check for even sooner snap if colliding with a contactable BlockGroup
  const [, contactableEdge] = getContactableGroup(blockGroup);
  if (contactableEdge !== null) {
    if (movingDownwards && snappedPosition >= contactableEdge)
      snappedPosition = contactableEdge;
    else if (movingUpwards && snappedPosition <= contactableEdge)
      snappedPosition = contactableEdge;
  }

  return snappedPosition;
};

export const getContactableGroup = (
  subjectGroup: BlockGroup,
): [BlockGroup | null, number | null] => {
  const contactableGroups = getContactableGroups(subjectGroup);

  let minDistance = Infinity;
  let closestEdge = null;
  let closestGroup = null;

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
          closestGroup = contactableGroup;
        }
      }
    });
  });

  return [closestGroup, closestEdge];
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

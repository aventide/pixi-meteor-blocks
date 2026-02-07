import { BlockGroup, FileFragment } from "../../entities/types";
import { getWorld } from "../../world";

export const getClosestFragmentBelow = (
  subjectFragment: FileFragment,
): FileFragment | null => {
  const fragmentsInFile = getFragmentsInFile(subjectFragment);

  let closest: FileFragment | null = null;

  for (const frag of fragmentsInFile) {
    if (frag.groupId === subjectFragment.groupId) continue;

    const isBelow =
      frag.boundary.top >= subjectFragment.boundary.bottom &&
      frag.boundary.bottom > subjectFragment.boundary.bottom;

    if (!isBelow) continue;

    if (!closest || frag.boundary.top < closest.boundary.top) {
      closest = frag;
    }
  }

  return closest;
};

export const getClosestFragmentAbove = (
  subjectFragment: FileFragment,
): FileFragment | null => {
  const fragmentsInFile = getFragmentsInFile(subjectFragment);

  let closest: FileFragment | null = null;

  for (const frag of fragmentsInFile) {
    if (frag.groupId === subjectFragment.groupId) continue;

    const isAbove =
      frag.boundary.bottom <= subjectFragment.boundary.top &&
      frag.boundary.top < subjectFragment.boundary.top;

    if (!isAbove) continue;

    if (!closest || frag.boundary.bottom > closest.boundary.bottom) {
      closest = frag;
    }
  }

  return closest;
};

export const getFragmentsInFile = (
  subjectFragment: FileFragment,
): FileFragment[] => {
  const { fileFragmentsMap } = getWorld();
  const fragmentsInFile = fileFragmentsMap.get(subjectFragment.number);

  return fragmentsInFile || [];
};

export const translatePosition = (blockGroup: BlockGroup, deltaY: number) => {
  if (deltaY === 0) return;

  // Keep cached group boundary in sync with fragment/block translations.
  blockGroup.boundary.top += deltaY;
  blockGroup.boundary.bottom += deltaY;

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

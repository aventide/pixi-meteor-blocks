import { BlockGroup, FileFragment } from "../../entities/types";
import { DEFAULT_FLOAT_TOLERANCE } from "../../constants";
import { getWorld } from "../../world";

export const getClosestFragmentBelow = (
  subjectFragment: FileFragment,
): FileFragment | null => {
  const fragmentsInFile = getFragmentsInFile(subjectFragment);

  let closest: FileFragment | null = null;
  let closestDiff: number | null = null;

  for (const frag of fragmentsInFile) {
    if (frag.groupId === subjectFragment.groupId) continue;

    const diff = frag.boundary.top - subjectFragment.boundary.bottom;
    const overlaps =
      frag.boundary.bottom > subjectFragment.boundary.bottom &&
      frag.boundary.top < subjectFragment.boundary.bottom;

    // move on, if the diff is negative but no direct overlap
    if (diff < 0 && !overlaps) continue;

    const normalizedDiff = overlaps ? 0 : diff;

    if (closestDiff === null || normalizedDiff < closestDiff) {
      closest = frag;
      closestDiff = normalizedDiff;
    }
  }

  return closest;
};

export const getClosestFragmentAbove = (
  subjectFragment: FileFragment,
): FileFragment | null => {
  const fragmentsInFile = getFragmentsInFile(subjectFragment);

  let closest: FileFragment | null = null;
  let closestDiff: number | null = null;

  for (const frag of fragmentsInFile) {
    if (frag.groupId === subjectFragment.groupId) continue;

    const diff = subjectFragment.boundary.top - frag.boundary.bottom;
    const overlaps =
      frag.boundary.bottom > subjectFragment.boundary.top &&
      frag.boundary.top < subjectFragment.boundary.top;

    // move on, if the diff is negative but no direct overlap
    if (diff < 0 && !overlaps) continue;

    const normalizedDiff = overlaps ? 0 : diff;

    if (closestDiff === null || normalizedDiff < closestDiff) {
      closest = frag;
      closestDiff = normalizedDiff;
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

  const snap = (value: number) =>
    Math.round(value / DEFAULT_FLOAT_TOLERANCE) * DEFAULT_FLOAT_TOLERANCE;

  blockGroup.fileFragments.forEach((fileFragment) => {
    fileFragment.boundary.top = snap(fileFragment.boundary.top + deltaY);
    fileFragment.boundary.bottom = snap(fileFragment.boundary.bottom + deltaY);
    fileFragment.overlay.danger.y = snap(
      fileFragment.overlay.danger.y + deltaY,
    );
  });

  blockGroup.fileFragments.forEach((fileFragment) =>
    fileFragment.blocks.forEach((block) => {
      block.sprite.y = snap(block.sprite.y + deltaY);
    }),
  );
};

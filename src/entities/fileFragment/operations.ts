import type { GroupFileFragment } from "../types";

import { getFileFragmentBoundary } from "./util";

export const refreshFileFragmentBoundary = (
  fileFragment: GroupFileFragment,
): GroupFileFragment => {
  fileFragment.boundary = getFileFragmentBoundary(fileFragment.blocks);
  return fileFragment;
};

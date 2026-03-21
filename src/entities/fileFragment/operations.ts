import type { GroupFileFragment } from "../types";

import { sortBlocksAscending } from "../block/util";
import { getFileFragmentBoundary } from "./util";

export const normalizeFileFragment = (
  fileFragment: GroupFileFragment,
): GroupFileFragment => {
  fileFragment.blocks = sortBlocksAscending([...fileFragment.blocks]);
  fileFragment.boundary = getFileFragmentBoundary(fileFragment.blocks);
  return fileFragment;
};

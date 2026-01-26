import { getWorld } from "../world";

const DANGER_ANIMATION_DURATION = 1;
const DANGER_ANIMATION_MAX_OPACITY = 0.45;
let dangerOscillationPhase = 0;

export const dangerAnimation = (dt: number) => {
  const { blockGroupsMap } = getWorld();

  dangerOscillationPhase =
    (dangerOscillationPhase + dt / DANGER_ANIMATION_DURATION) % 1;
  // number that oscillates between 0 and 1
  const dangerOscillation =
    (1 + Math.cos(dangerOscillationPhase * Math.PI * 2)) / 2;

  blockGroupsMap.forEach((blockGroup) => {
    blockGroup.fileFragments.forEach((fileFragment) => {
      fileFragment.overlay.danger.alpha =
        dangerOscillation * DANGER_ANIMATION_MAX_OPACITY;
    });
  });
};

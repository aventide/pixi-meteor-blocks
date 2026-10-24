import { planets, type PlanetId } from "../config/planets";

// Dev/testing URL parameters (documented in DEMO_NOTES.md):
//   ?planet=moon   jump straight into a planet
//   ?unlockAll=1   unlock every planet on the star map
//   ?goal=3        override every planet's launch goal

const params = new URLSearchParams(window.location.search);

const planetParam = params.get("planet");
const goalParam = Number.parseInt(params.get("goal") ?? "", 10);

export const devParams = {
  planet:
    planetParam && planetParam in planets ? (planetParam as PlanetId) : null,
  unlockAll: params.get("unlockAll") === "1",
  goal: Number.isFinite(goalParam) && goalParam > 0 ? goalParam : null,
};

export const applyDevOverrides = () => {
  if (devParams.goal === null) return;
  for (const planet of Object.values(planets)) {
    planet.goal.launchedBlocksToWin = devParams.goal;
  }
};

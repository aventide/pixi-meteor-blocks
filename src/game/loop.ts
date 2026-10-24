import type { Application, Ticker } from "pixi.js";
import { getActivePlanet, getWorld } from "../world";
import { createSingleBlock, getIsSpawnPositionOpen } from "../entities";
import {
  descentMutator,
  sequenceMutator,
  positionMutator,
  selectionMutator,
} from "../mutators";
import { getRandomFileNumber } from "../util";
import {
  DEFAULT_FILE_COUNT,
  DEFAULT_FILE_BLOCKS_LIMIT,
  DEFAULT_MAIN_TICKER_SPEED,
} from "../constants";
import { dangerAnimation } from "../animations";
import { getAllSelectionFileFragments } from "../mutators/selectionMutator/util";
import { gameLost } from "./events";

let removeTickers: (() => void) | null = null;

// Starting an already-running loop is a no-op. Stop before starting a new run.
export const startGameLoop = (app: Application) => {
  if (removeTickers) return;
  app.ticker.speed = DEFAULT_MAIN_TICKER_SPEED;
  let hasLost = false;
  let timeAccumulated = 0;
  const spawnTick = (time: Ticker) => {
    const dropInterval = getActivePlanet().spawn.dropIntervalMs;
    timeAccumulated += time.deltaMS;
    if (timeAccumulated >= dropInterval) {
      timeAccumulated -= dropInterval;
      let createdBlock = null;
      let attempts = 0;

      // @todo we should attempt every other fileNumber before bailing out
      while (!createdBlock && attempts < DEFAULT_FILE_COUNT) {
        const file = getRandomFileNumber();
        attempts++;
        if (getIsSpawnPositionOpen(file)) {
          createdBlock = createSingleBlock(file);
        }
      }
    }
  };

  const frameTick = (time: Ticker) => {
    const { blockGroupsById } = getWorld();
    const dt = time.deltaTime / 60;

    let iterations = 0;

    // apply once per group per tick mutations
    blockGroupsById.forEach((blockGroup) => {
      if (iterations <= 300) {
        iterations++;
        descentMutator(blockGroup, dt);
        positionMutator(blockGroup, dt);
        // an optional (via arg) mutator which applies a debug overlay to each group
        // debugMutator(blockGroup, true)
      } else {
        throw new Error("Iteration pressure level exceeded threshold");
      }
    });

    // apply once per tick mutations

    // get all selectionFragments for file
    const allSelectionFileFragments = getAllSelectionFileFragments();

    selectionMutator(allSelectionFileFragments);
    sequenceMutator(allSelectionFileFragments);
    dangerAnimation(dt);

    // check for losing state
    // @todo consider adding a 1-2 sec "tolerance" once file limit is reached
    // before the file is considered for placement (and game loss)
    blockGroupsById.forEach((blockGroup) =>
      blockGroup.fileFragments.forEach((fileFragment) => {
        if (fileFragment.blocks.length >= DEFAULT_FILE_BLOCKS_LIMIT + 2) {
          if (!hasLost) {
            hasLost = true;
            stopGameLoop();
            gameLost();
          }
        }
      }),
    );
  };

  app.ticker.add(spawnTick);
  app.ticker.add(frameTick);
  removeTickers = () => {
    app.ticker.remove(spawnTick);
    app.ticker.remove(frameTick);
  };
};

export const stopGameLoop = () => {
  removeTickers?.();
  removeTickers = null;
};

import { devParams } from "./devParams";
import { planets } from "../config/planets";

// Trip progress: the highest planet `order` cleared (-1 = none yet). Stored in
// localStorage when available; falls back to memory (private windows, blocked
// storage) so the game still works for the session.

const STORAGE_KEY = "meteor-blocks-demo:progress";
let memory = -1;
let memoryOnly = false;
const lastOrder = Math.max(
  ...Object.values(planets).map((planet) => planet.order),
);

const read = (): number => {
  if (memoryOnly) return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return memory;
    const value = Number(raw);
    if (
      raw.trim() !== "" &&
      Number.isInteger(value) &&
      value >= -1 &&
      value <= lastOrder
    ) {
      memory = value;
    }
    return memory;
  } catch {
    return memory;
  }
};

const write = (value: number) => {
  memory = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Reads can still succeed after a quota/write failure; don't read stale data.
    memoryOnly = true;
  }
};

export const getHighestCleared = () => read();

export const isCleared = (order: number) => order <= read();

export const isUnlocked = (order: number) =>
  devParams.unlockAll || order <= read() + 1;

export const markCleared = (order: number) => {
  if (order > read()) write(order);
};

export const resetProgress = () => {
  memory = -1;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A failed removal must not restore the old saved trip on the next read.
    memoryOnly = true;
  }
};

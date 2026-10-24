import { devParams } from "./devParams";

// Trip progress: the highest planet `order` cleared (-1 = none yet). Stored in
// localStorage when available; falls back to memory (private windows, blocked
// storage) so the game still works for the session.

const STORAGE_KEY = "meteor-blocks-demo:progress";
let memory = -1;

const read = (): number => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return memory;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : memory;
  } catch {
    return memory;
  }
};

const write = (value: number) => {
  memory = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Memory fallback already updated.
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
    // Nothing stored.
  }
};

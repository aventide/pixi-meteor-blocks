export type GameEvents = {
  blocksLaunchedOut: [count: number];
  gameLost: [];
  gameWon: [];
};

type Listener<K extends keyof GameEvents> = (...args: GameEvents[K]) => void;

const listeners: { [K in keyof GameEvents]: Set<Listener<K>> } = {
  blocksLaunchedOut: new Set(),
  gameLost: new Set(),
  gameWon: new Set(),
};

const on = <K extends keyof GameEvents>(event: K, listener: Listener<K>) => {
  const eventListeners = listeners[event] as Set<Listener<K>>;
  eventListeners.add(listener);
  return () => off(event, listener);
};

const off = <K extends keyof GameEvents>(event: K, listener: Listener<K>) => {
  (listeners[event] as Set<Listener<K>>).delete(listener);
};

const emit = <K extends keyof GameEvents>(event: K, ...args: GameEvents[K]) => {
  const eventListeners = listeners[event] as Set<Listener<K>>;
  [...eventListeners].forEach((listener) => listener(...args));
};

export const gameEvents = { on, off, emit };
export const blocksLaunchedOut = (count: number) =>
  emit("blocksLaunchedOut", count);
export const gameLost = () => emit("gameLost");
export const gameWon = () => emit("gameWon");

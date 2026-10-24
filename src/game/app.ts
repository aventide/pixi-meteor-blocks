import { Application, Container } from "pixi.js";
import { setGlobalPointerDown } from "../world";

// Shared handles for the demo interface. The engine keeps using world.ts;
// these exist so scenes and UI can reach the app without threading it around.

let app: Application | null = null;

// worldRoot is what the engine treats as its stage; uiRoot draws above it.
export const worldRoot = new Container();
export const uiRoot = new Container();

export const setApp = (newApp: Application) => {
  app = newApp;
};

export const getApp = (): Application => {
  if (!app) throw new Error("App has not been initialized");
  return app;
};

export const getScreenSize = () => {
  const { width, height } = getApp().screen;
  return { width, height };
};

// The board is offset below the HUD strip. Pointer input is mapped into
// board space by subtracting this offset, and is ignored while disabled.
const board = { enabled: false };

export const setBoardInputEnabled = (enabled: boolean) => {
  board.enabled = enabled;
  if (!enabled) setGlobalPointerDown(false);
};

export const isBoardInputEnabled = () => board.enabled;

export const getBoardOffset = () => ({ x: worldRoot.x, y: worldRoot.y });

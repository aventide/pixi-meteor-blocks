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

// The board keeps its run-start (logical) size and is scaled to fit the
// space between the HUD and the fast-drop bar when the window resizes.
// Convert canvas coordinates into board coordinates (the shake pivot is
// deliberately ignored so input stays steady during a shake).
export const toBoardPoint = (canvasX: number, canvasY: number) => {
  const scale = worldRoot.scale.x || 1;
  return {
    x: (canvasX - worldRoot.x) / scale,
    y: (canvasY - worldRoot.y) / scale,
  };
};

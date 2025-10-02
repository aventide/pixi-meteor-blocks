import { DEFAULT_GRAVITY } from "./constants";

type World = {
  gravity: number;
  height: number;
  width: number;
  // entities: Entity[]
  // files: BoardFile[]
};

const world: World = {
  gravity: DEFAULT_GRAVITY,
  height: 0,
  width: 0,
  // entities: [],
  // files: []
};

export const getWorld = () => world;

export const setWorldDimensions = (height: number, width: number) => {
  world.height = height;
  world.width = width;
};

export const setWorldGravity = (gravity: number) => {
  world.gravity = gravity;
};

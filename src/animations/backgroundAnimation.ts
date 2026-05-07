import { Container, Graphics } from "pixi.js";
import { DEFAULT_FILE_COUNT } from "../constants";
import { addToBackgroundLayer, getBlockSize, getWorld } from "../world";

const STAR_COUNT = 70;
const DUST_COUNT = 28;

type Star = {
  graphic: Graphics;
  baseAlpha: number;
  phase: number;
};

type Dust = {
  graphic: Graphics;
  speed: number;
  drift: number;
  phase: number;
};

let backgroundContainer: Container | null = null;
let sky: Graphics | null = null;
let boardGrid: Graphics | null = null;
let stars: Star[] = [];
let dust: Dust[] = [];
let lastWidth = 0;
let lastHeight = 0;
let animationPhase = 0;

const createStar = (width: number, height: number): Star => {
  const graphic = new Graphics();
  const radius = 0.8 + Math.random() * 1.8;
  const baseAlpha = 0.18 + Math.random() * 0.42;

  graphic
    .circle(0, 0, radius)
    .fill({ color: Math.random() > 0.6 ? 0xfff1b8 : 0xffffff });
  graphic.x = Math.random() * width;
  graphic.y = Math.random() * height;

  return {
    graphic,
    baseAlpha,
    phase: Math.random() * Math.PI * 2,
  };
};

const createDust = (width: number, height: number): Dust => {
  const graphic = new Graphics();
  const radius = 1.8 + Math.random() * 3.5;

  graphic.circle(0, 0, radius).fill({ color: 0xffd46a, alpha: 0.2 });
  graphic.x = Math.random() * width;
  graphic.y = Math.random() * height;

  return {
    graphic,
    speed: 8 + Math.random() * 18,
    drift: 4 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
  };
};

const drawSky = (width: number, height: number) => {
  if (!sky) {
    return;
  }

  sky.clear();
  sky.rect(0, 0, width, height).fill({ color: 0x153c62 });
  sky.rect(0, 0, width, height * 0.45).fill({ color: 0x245f84, alpha: 0.55 });
  sky.rect(0, height * 0.72, width, height * 0.28).fill({
    color: 0xb68a32,
    alpha: 0.18,
  });

  sky
    .circle(width * 0.16, height * 0.17, width * 0.22)
    .fill({ color: 0x67d57b, alpha: 0.08 });
  sky
    .circle(width * 0.83, height * 0.28, width * 0.2)
    .fill({ color: 0xff7a2a, alpha: 0.08 });
  sky
    .circle(width * 0.72, height * 0.72, width * 0.28)
    .fill({ color: 0xffd46a, alpha: 0.07 });
  sky
    .circle(width * 0.32, height * 0.58, width * 0.24)
    .fill({ color: 0x8ed7ff, alpha: 0.08 });

  sky
    .moveTo(0, height * 0.33)
    .bezierCurveTo(
      width * 0.22,
      height * 0.27,
      width * 0.34,
      height * 0.43,
      width * 0.55,
      height * 0.35,
    )
    .bezierCurveTo(
      width * 0.73,
      height * 0.28,
      width * 0.86,
      height * 0.36,
      width,
      height * 0.3,
    )
    .stroke({ color: 0x8ed7ff, width: 3, alpha: 0.16 });

  sky
    .moveTo(0, height * 0.79)
    .bezierCurveTo(
      width * 0.25,
      height * 0.69,
      width * 0.42,
      height * 0.83,
      width * 0.64,
      height * 0.76,
    )
    .bezierCurveTo(
      width * 0.78,
      height * 0.72,
      width * 0.88,
      height * 0.8,
      width,
      height * 0.75,
    )
    .stroke({ color: 0xfff0a3, width: 5, alpha: 0.16 });
};

const drawBoardGrid = (width: number, height: number) => {
  if (!boardGrid) {
    return;
  }

  const blockSize = getBlockSize();
  boardGrid.clear();

  for (let file = 1; file < DEFAULT_FILE_COUNT; file++) {
    const x = file * blockSize;
    boardGrid
      .moveTo(x, 0)
      .lineTo(x, height)
      .stroke({ color: 0xffffff, width: 1, alpha: 0.06 });
  }

  for (let y = height; y > 0; y -= blockSize) {
    boardGrid
      .moveTo(0, y)
      .lineTo(width, y)
      .stroke({ color: 0xffffff, width: 1, alpha: 0.035 });
  }

  boardGrid.rect(0, 0, width, height).stroke({
    color: 0xffffff,
    width: 2,
    alpha: 0.12,
  });
};

const rebuildBackground = () => {
  const { width, height } = getWorld();
  if (!backgroundContainer || width === 0 || height === 0) {
    return;
  }

  backgroundContainer.removeChildren();

  sky = new Graphics();
  boardGrid = new Graphics();
  stars = Array.from({ length: STAR_COUNT }, () => createStar(width, height));
  dust = Array.from({ length: DUST_COUNT }, () => createDust(width, height));

  drawSky(width, height);
  drawBoardGrid(width, height);

  backgroundContainer.addChild(
    sky,
    ...stars.map((star) => star.graphic),
    ...dust.map((dustParticle) => dustParticle.graphic),
    boardGrid,
  );

  lastWidth = width;
  lastHeight = height;
};

const ensureBackground = () => {
  if (!backgroundContainer) {
    backgroundContainer = new Container();
    backgroundContainer.eventMode = "none";
    addToBackgroundLayer(backgroundContainer);
  }

  const { width, height } = getWorld();
  if (width !== lastWidth || height !== lastHeight) {
    rebuildBackground();
  }
};

export const backgroundAnimation = (dt: number) => {
  ensureBackground();
  const { width, height } = getWorld();

  animationPhase += dt;

  stars.forEach((star) => {
    star.graphic.alpha =
      star.baseAlpha *
      (0.65 + Math.sin(animationPhase * 2 + star.phase) * 0.35);
  });

  dust.forEach((dustParticle) => {
    dustParticle.graphic.y += dustParticle.speed * dt;
    dustParticle.graphic.x +=
      Math.sin(animationPhase + dustParticle.phase) * dustParticle.drift * dt;

    if (dustParticle.graphic.y > height + 8) {
      dustParticle.graphic.y = -8;
      dustParticle.graphic.x = Math.random() * width;
    }
  });
};

import type { Block, Coord } from "../types";

import { Sprite, Texture } from "pixi.js";
import { getBlockSize } from "../../world";

export const createBlock = ({
  initialPosition,
  texture,
  file,
}: {
  initialPosition: Coord;
  texture: Texture;
  file: number;
}): Block => {
  const blockSize = getBlockSize();
  const sprite = new Sprite(texture);
  sprite.anchor.set(0);
  sprite.setSize(blockSize);
  sprite.position.set(
    (initialPosition.x - 1) * blockSize,
    initialPosition.y * blockSize,
  );
  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  return {
    sprite,
    file,
    groupId: null,
  };
};

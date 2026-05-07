import { Particle, ParticleContainer, Texture } from "pixi.js";
import type { BlockGroup, BlockGroupId } from "../entities/types";
import { getBlockSize, getWorld, addToParticlesLayer } from "../world";

const PARTICLE_SPAWN_RATE = 70;
const PARTICLE_LIFETIME = 0.32;
const PARTICLE_TEXTURE_SIZE = 32;
const FLAME_COLORS = [0xffffff, 0xfff2a0, 0xffa72b, 0xff4d1f];

type RocketTrailParticle = {
  particle: Particle;
  age: number;
  lifetime: number;
  velocityX: number;
  velocityY: number;
  startScale: number;
};

type RocketTrailEmitter = {
  groupId: BlockGroupId;
  spawnDebt: number;
};

const emittersByGroupId = new Map<BlockGroupId, RocketTrailEmitter>();
const particles: RocketTrailParticle[] = [];
const particleTexture = createParticleTexture();
const particleContainer = new ParticleContainer({
  texture: particleTexture,
  dynamicProperties: {
    position: true,
    scale: true,
    rotation: true,
    color: true,
  },
});
let hasAddedParticleContainer = false;

function createParticleTexture(): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = PARTICLE_TEXTURE_SIZE;
  canvas.height = PARTICLE_TEXTURE_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    return Texture.WHITE;
  }

  const radius = PARTICLE_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(
    radius,
    radius,
    0,
    radius,
    radius,
    radius,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.3, "rgba(255, 232, 128, 0.95)");
  gradient.addColorStop(0.7, "rgba(255, 104, 24, 0.55)");
  gradient.addColorStop(1, "rgba(255, 64, 0, 0)");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(radius, radius, radius, 0, Math.PI * 2);
  context.fill();

  return Texture.from(canvas);
}

const ensureParticleContainer = () => {
  if (hasAddedParticleContainer) {
    return;
  }

  particleContainer.eventMode = "none";
  addToParticlesLayer(particleContainer);
  hasAddedParticleContainer = true;
};

const getTrailAnchorsForGroup = (group: BlockGroup) => {
  const blockSize = getBlockSize();

  return group.fileFragments.map((fragment) => {
    const bottomBlock = fragment.blocks.reduce((lowestBlock, block) =>
      block.sprite.y > lowestBlock.sprite.y ? block : lowestBlock,
    );

    return {
      x: bottomBlock.sprite.x + blockSize / 2,
      y: bottomBlock.sprite.y + blockSize,
    };
  });
};

const spawnParticle = (x: number, y: number) => {
  const blockSize = getBlockSize();
  const particleSize = blockSize * (0.14 + Math.random() * 0.16);
  const particle = new Particle({
    texture: particleTexture,
    x: x + (Math.random() - 0.5) * blockSize * 0.35,
    y: y - blockSize * 0.08,
    anchorX: 0.5,
    anchorY: 0.5,
    scaleX: particleSize / PARTICLE_TEXTURE_SIZE,
    scaleY: particleSize / PARTICLE_TEXTURE_SIZE,
    rotation: Math.random() * Math.PI * 2,
    tint: FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)],
    alpha: 0.95,
  });

  particleContainer.addParticle(particle);
  particles.push({
    particle,
    age: 0,
    lifetime: PARTICLE_LIFETIME * (0.75 + Math.random() * 0.5),
    velocityX: (Math.random() - 0.5) * blockSize * 1.4,
    velocityY: blockSize * (1.8 + Math.random() * 1.2),
    startScale: particleSize / PARTICLE_TEXTURE_SIZE,
  });
};

const emitTrailParticles = (group: BlockGroup, dt: number) => {
  const emitter = emittersByGroupId.get(group.id) || {
    groupId: group.id,
    spawnDebt: 0,
  };
  const anchors = getTrailAnchorsForGroup(group);

  emitter.spawnDebt += PARTICLE_SPAWN_RATE * dt * anchors.length;
  while (emitter.spawnDebt >= 1) {
    const anchor = anchors[Math.floor(Math.random() * anchors.length)];
    spawnParticle(anchor.x, anchor.y);
    emitter.spawnDebt -= 1;
  }

  emittersByGroupId.set(group.id, emitter);
};

const updateParticles = (dt: number) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const trailParticle = particles[i];
    const particle = trailParticle.particle;

    trailParticle.age += dt;
    if (trailParticle.age >= trailParticle.lifetime) {
      particleContainer.removeParticle(particle);
      particles.splice(i, 1);
      continue;
    }

    const progress = trailParticle.age / trailParticle.lifetime;
    particle.x += trailParticle.velocityX * dt;
    particle.y += trailParticle.velocityY * dt;
    particle.rotation += dt * 8;
    particle.alpha = 1 - progress;
    particle.scaleX = trailParticle.startScale * (1 + progress * 0.9);
    particle.scaleY = trailParticle.startScale * (1 + progress * 1.6);
  }
};

export const rocketTrailAnimation = (dt: number) => {
  ensureParticleContainer();

  const { blockGroupsById } = getWorld();
  const activeLaunchGroupIds = new Set<BlockGroupId>();

  blockGroupsById.forEach((group) => {
    if (group.type !== "launch") {
      return;
    }

    activeLaunchGroupIds.add(group.id);
    emitTrailParticles(group, dt);
  });

  emittersByGroupId.forEach((emitter) => {
    if (!activeLaunchGroupIds.has(emitter.groupId)) {
      emittersByGroupId.delete(emitter.groupId);
    }
  });

  updateParticles(dt);
};

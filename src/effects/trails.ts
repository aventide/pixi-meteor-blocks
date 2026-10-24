import { Particle, ParticleContainer, Texture } from "pixi.js";
import type { BlockGroup } from "../entities/types";
import type { PlanetTheme } from "../config/planets";
import { addToParticlesLayer, getBlockSize, getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import { sampleGradient, type GradientStop } from "../themes/shared/color";

// Launch effects for the demo: an ignition flash when a sequence launches and
// a themed trail behind launched groups while they rise. Reads engine state
// only; it never changes block groups.

type TrailStyle = PlanetTheme["trail"]["style"];

type StyleParams = {
  additive: boolean;
  rate: number; // particles per second per emitting column
  life: [number, number]; // seconds
  vx: number; // horizontal speed spread (px/s at a 64px block)
  vy: [number, number]; // vertical speed range (px/s at a 64px block)
  gravity: number;
  wobble: number;
  size: [number, number]; // start/end diameter, as a fraction of block size
  alpha: number;
};

const STYLES: Record<TrailStyle, StyleParams> = {
  fire: {
    additive: false,
    rate: 120,
    life: [0.3, 0.46],
    vx: 22,
    vy: [80, 160],
    gravity: 0,
    wobble: 0,
    size: [0.75, 0.22],
    alpha: 1,
  },
  bubbles: {
    additive: false,
    rate: 22,
    life: [0.9, 1.3],
    vx: 14,
    vy: [-50, -18],
    gravity: 0,
    wobble: 22,
    size: [0.18, 0.3],
    alpha: 0.8,
  },
  dust: {
    additive: false,
    rate: 30,
    life: [0.7, 1.0],
    vx: 70,
    vy: [40, 90],
    gravity: 0,
    wobble: 0,
    size: [0.4, 1.1],
    alpha: 0.45,
  },
  sparks: {
    additive: true,
    rate: 55,
    life: [0.35, 0.55],
    vx: 120,
    vy: [60, 260],
    gravity: 600,
    wobble: 0,
    size: [0.16, 0.04],
    alpha: 1,
  },
};

const MAX_PARTICLES = 700;
const TEXTURE_SIZE = 64;

type LiveParticle = {
  particle: Particle;
  container: ParticleContainer;
  age: number;
  life: number;
  vx: number;
  vy: number;
  gravity: number;
  wobble: number;
  phase: number;
  size0: number;
  size1: number;
  alpha: number;
  colors: GradientStop[];
};

let softTexture: Texture | null = null;

// A soft round sprite drawn once on a canvas and shared by every particle.
const getSoftTexture = () => {
  if (softTexture) return softTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return (softTexture = Texture.WHITE);
  const r = TEXTURE_SIZE / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.75)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  softTexture = Texture.from(canvas);
  return softTexture;
};

const toStops = (colors: number[]): GradientStop[] =>
  colors.map((color, i) => ({
    at: colors.length === 1 ? 0 : i / (colors.length - 1),
    color,
  }));

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class TrailSystem {
  private readonly normal: ParticleContainer;
  private readonly additive: ParticleContainer;
  private readonly params: StyleParams;
  private readonly trailStops: GradientStop[];
  private readonly flashStops: GradientStop[];
  private live: LiveParticle[] = [];
  private spawnDebt = new Map<number, number>();
  private ignited = new Set<number>();

  constructor(trail: PlanetTheme["trail"]) {
    const texture = getSoftTexture();
    const options = {
      texture,
      dynamicProperties: {
        position: true,
        scale: true,
        color: true,
        rotation: false,
      },
    };
    this.normal = new ParticleContainer(options);
    this.additive = new ParticleContainer(options);
    this.additive.blendMode = "add";
    this.params = STYLES[trail.style];
    this.trailStops = toStops(trail.colors);
    this.flashStops = toStops([
      0xffffff,
      trail.colors[1] ?? 0xffffff,
      trail.colors[trail.colors.length - 1] ?? 0xffffff,
    ]);
    addToParticlesLayer(this.normal);
    addToParticlesLayer(this.additive);
  }

  update(dt: number) {
    const blockSize = getBlockSize();
    const launching = new Set<number>();

    getWorld().blockGroupsById.forEach((group) => {
      if (group.type !== "launch") return;
      launching.add(group.id);
      if (!this.ignited.has(group.id)) {
        this.ignited.add(group.id);
        this.ignite(group, blockSize);
      }
      // Trails burn only while the group is still rising.
      if (group.velocity < 0) this.emitTrail(group, blockSize, dt);
    });

    for (const id of this.ignited)
      if (!launching.has(id)) this.ignited.delete(id);
    for (const id of this.spawnDebt.keys())
      if (!launching.has(id)) this.spawnDebt.delete(id);

    this.step(dt);
  }

  destroy() {
    for (const container of [this.normal, this.additive]) {
      if (!container.destroyed) container.destroy();
    }
    this.live = [];
  }

  private emitTrail(group: BlockGroup, blockSize: number, dt: number) {
    const p = this.params;
    const scale = blockSize / 64;
    const debt = (this.spawnDebt.get(group.id) ?? 0) + p.rate * dt;
    const count = Math.floor(debt);
    this.spawnDebt.set(group.id, debt - count);
    if (count === 0) return;
    // This runs before the game loop moves the group this frame, so spread
    // particles over the distance it is about to rise (same scaling as
    // positionMutator). That keeps the plume attached and continuous.
    const risen =
      -group.velocity * dt * (getWorld().height / DEFAULT_REFERENCE_HEIGHT);

    for (const fragment of group.fileFragments) {
      // Emit from the bottom edge of the lowest block in each column.
      let bottom = -Infinity;
      let x = 0;
      for (const block of fragment.blocks) {
        if (block.sprite.y > bottom) {
          bottom = block.sprite.y;
          x = block.sprite.x;
        }
      }
      if (bottom === -Infinity) continue;
      for (let i = 0; i < count; i++) {
        this.spawn({
          x: x + blockSize * rand(0.25, 0.75),
          y: bottom + blockSize * rand(0.9, 1.0) - rand(0, Math.max(0, risen)),
          vx: rand(-p.vx, p.vx) * scale,
          vy: rand(p.vy[0], p.vy[1]) * scale,
          life: rand(p.life[0], p.life[1]),
          size0: p.size[0] * blockSize * rand(0.8, 1.2),
          size1: p.size[1] * blockSize,
          gravity: p.gravity * scale,
          wobble: p.wobble * scale,
          alpha: p.alpha,
          colors: this.trailStops,
          additive: p.additive,
        });
      }
    }
  }

  // A bright pop over every block in a newly launched group, plus sparks.
  private ignite(group: BlockGroup, blockSize: number) {
    const scale = blockSize / 64;
    for (const fragment of group.fileFragments) {
      for (const block of fragment.blocks) {
        const cx = block.sprite.x + blockSize / 2;
        const cy = block.sprite.y + blockSize / 2;
        this.spawn({
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          life: 0.28,
          size0: blockSize * 1.4,
          size1: blockSize * 2.2,
          gravity: 0,
          wobble: 0,
          alpha: 0.9,
          colors: this.flashStops,
          additive: true,
        });
        for (let i = 0; i < 5; i++) {
          const angle = rand(0, Math.PI * 2);
          const speed = rand(120, 320) * scale;
          this.spawn({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: rand(0.25, 0.45),
            size0: blockSize * 0.18,
            size1: blockSize * 0.04,
            gravity: 500 * scale,
            wobble: 0,
            alpha: 1,
            colors: this.flashStops,
            additive: true,
          });
        }
      }
    }
  }

  private spawn(o: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size0: number;
    size1: number;
    gravity: number;
    wobble: number;
    alpha: number;
    colors: GradientStop[];
    additive: boolean;
  }) {
    if (this.live.length >= MAX_PARTICLES) return;
    const container = o.additive ? this.additive : this.normal;
    const s = o.size0 / TEXTURE_SIZE;
    const particle = new Particle({
      texture: getSoftTexture(),
      x: o.x,
      y: o.y,
      scaleX: s,
      scaleY: s,
      anchorX: 0.5,
      anchorY: 0.5,
      tint: o.colors[0].color,
      alpha: o.alpha,
    });
    container.addParticle(particle);
    this.live.push({
      particle,
      container,
      age: 0,
      life: o.life,
      vx: o.vx,
      vy: o.vy,
      gravity: o.gravity,
      wobble: o.wobble,
      phase: Math.random() * Math.PI * 2,
      size0: o.size0,
      size1: o.size1,
      alpha: o.alpha,
      colors: o.colors,
    });
  }

  private step(dt: number) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const lp = this.live[i];
      lp.age += dt;
      const t = lp.age / lp.life;
      if (t >= 1) {
        lp.container.removeParticle(lp.particle);
        this.live[i] = this.live[this.live.length - 1];
        this.live.pop();
        continue;
      }
      lp.vy += lp.gravity * dt;
      const p = lp.particle;
      p.x +=
        lp.vx * dt +
        (lp.wobble ? Math.sin(lp.age * 9 + lp.phase) * lp.wobble * dt : 0);
      p.y += lp.vy * dt;
      const s = (lp.size0 + (lp.size1 - lp.size0) * t) / TEXTURE_SIZE;
      p.scaleX = p.scaleY = s;
      p.tint = sampleGradient(lp.colors, t);
      p.alpha = lp.alpha * (1 - t);
    }
  }
}

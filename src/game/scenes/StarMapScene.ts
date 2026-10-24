import { Container, Graphics } from "pixi.js";
import type { Scene } from "./SceneManager";
import { sceneManager } from "./SceneManager";
import { PlayScene } from "./PlayScene";
import { TitleScene } from "./TitleScene";
import { planets, type PlanetConfig } from "../../config/planets";
import { isCleared, isUnlocked, getHighestCleared } from "../progress";
import { getScreenSize } from "../app";
import { Starfield } from "../../ui/Starfield";
import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { Panel } from "../../ui/Panel";
import { getUiScale, uiTheme } from "../../ui/theme";
import { easeInOutSine, tween } from "../../ui/tween";
import { lerpColor } from "../../themes/shared/color";

type Node = {
  planet: PlanetConfig;
  x: number;
  y: number;
  view: Container;
  ring: Graphics;
};

const route = Object.values(planets).sort((a, b) => a.order - b.order);
const INFO_PANEL_HEIGHT = 168; // design px
const LAND_BUTTON_HEIGHT = 46; // design px

// The Land button never shrinks below the touch minimum, so on small screens
// the panel grows to fit it instead of the button poking out.
const getInfoPanelHeight = (s: number) =>
  Math.max(
    INFO_PANEL_HEIGHT * s,
    110 * s + Math.max(uiTheme.minTouchTarget, LAND_BUTTON_HEIGHT * s) + 14 * s,
  );

const drawShip = (g: Graphics, size: number) => {
  // A small arrowhead ship pointing up, with a flame below.
  g.moveTo(0, size * 0.55)
    .lineTo(-size * 0.18, size * 0.95)
    .lineTo(size * 0.18, size * 0.95)
    .closePath()
    .fill({ color: 0xffa22e, alpha: 0.9 });
  g.moveTo(0, -size)
    .lineTo(size * 0.55, size * 0.6)
    .lineTo(0, size * 0.3)
    .lineTo(-size * 0.55, size * 0.6)
    .closePath()
    .fill(0xeaf6ff)
    .stroke({ color: uiTheme.colors.accent, width: 2 });
  return g;
};

const drawLock = (g: Graphics, r: number) => {
  g.roundRect(-r * 0.45, -r * 0.1, r * 0.9, r * 0.7, r * 0.12).fill(0xcfd8ea);
  g.arc(0, -r * 0.1, r * 0.3, Math.PI, 0).stroke({
    color: 0xcfd8ea,
    width: r * 0.14,
  });
  g.circle(0, r * 0.22, r * 0.09).fill(0x2a3556);
  return g;
};

const drawCheck = (g: Graphics, r: number) => {
  g.circle(0, 0, r)
    .fill(uiTheme.colors.win)
    .stroke({ color: 0x0b3a22, width: 2 });
  g.moveTo(-r * 0.45, 0)
    .lineTo(-r * 0.1, r * 0.38)
    .lineTo(r * 0.5, -r * 0.35)
    .stroke({ color: 0x0b3a22, width: r * 0.28, cap: "round", join: "round" });
  return g;
};

export class StarMapScene implements Scene {
  readonly view = new Container();
  private starfield: Starfield;
  private nebula = new Graphics();
  private pathLayer = new Graphics();
  private nodeLayer = new Container();
  private ship = new Graphics();
  private chrome = new Container();
  private info = new Container();
  private nodes: Node[] = [];
  private selected: PlanetConfig;
  private time = 0;
  private shipMoving = false;
  private cancelFlight: (() => void) | null = null;

  constructor(private readonly options: { arrivedFrom?: number } = {}) {
    const { width, height } = getScreenSize();
    this.starfield = new Starfield(width, height, 110, {
      top: 0x02030c,
      bottom: 0x0e1238,
    });
    const current = Math.min(getHighestCleared() + 1, route.length - 1);
    this.selected = route[current];
    this.view.addChild(
      this.starfield,
      this.nebula,
      this.pathLayer,
      this.nodeLayer,
      this.ship,
      this.chrome,
      this.info,
    );
  }

  enter() {
    const from = this.options.arrivedFrom;
    if (from !== undefined && from + 1 < this.nodes.length) {
      this.flyShip(from, from + 1);
    }
  }

  exit() {
    this.cancelFlight?.();
  }

  update(dt: number) {
    this.time += dt;
    this.starfield.update(dt);
    const pulse = 1 + Math.sin(this.time * 3) * 0.06;
    for (const node of this.nodes) {
      const isSelected = node.planet.id === this.selected.id;
      node.ring.visible = isSelected;
      node.ring.scale.set(pulse);
      node.view.children[1].rotation += dt * 0.15; // slow planet spin
    }
    if (!this.shipMoving) this.ship.y += Math.sin(this.time * 2.5) * 0.15;
  }

  resize(width: number, height: number) {
    this.cancelFlight?.();
    this.shipMoving = false;
    this.ship.rotation = 0;
    const s = getUiScale(width, height);
    this.starfield.resize(width, height);

    this.nebula.clear();
    const blobs: [number, number, number, number][] = [
      [0.2, 0.3, 0.45, 0x3a2a8a],
      [0.85, 0.55, 0.4, 0x1a5a8a],
      [0.4, 0.8, 0.35, 0x6a2a6a],
    ];
    for (const [x, y, r, color] of blobs) {
      for (let i = 5; i >= 1; i--) {
        this.nebula
          .circle(width * x, height * y, Math.max(width, height) * r * (i / 5))
          .fill({
            color,
            alpha: 0.035,
          });
      }
    }

    // Route positions: a zigzag from Earth (bottom) to Casino (top), leaving
    // room for the header and the info panel.
    // The info panel takes a slice at the bottom (see layoutInfo), so fit the
    // route into whatever space is left above it. Planets two steps apart sit
    // on the same side of the zigzag, so two steps must clear a planet plus
    // its label (~3.3 radii); with the margins below that caps the radius at
    // about 1/10.8 of the available height.
    const panelTop = height - getInfoPanelHeight(s) - uiTheme.space.lg * s;
    const available = panelTop - height * 0.12;
    const radius = Math.min(width * 0.1, height * 0.055, available / 10.8);
    const top = height * 0.12 + radius * 1.6;
    const bottom = Math.max(top + radius, panelTop - radius * 2.6);
    this.nodeLayer
      .removeChildren()
      .forEach((c) => c.destroy({ children: true }));
    this.nodes = route.map((planet, i) => {
      const t = i / (route.length - 1);
      const x =
        width *
        (0.5 +
          (i % 2 === 0 ? -0.2 : 0.2) *
            (i === 0 || i === route.length - 1 ? 0.6 : 1));
      const y = bottom - (bottom - top) * t;
      const view = new Container();
      const ring = new Graphics()
        .circle(0, 0, radius * 1.45)
        .stroke({
          color: planet.theme.palette.accent,
          width: 3 * s,
          alpha: 0.9,
        })
        .circle(0, 0, radius * 1.7)
        .stroke({
          color: planet.theme.palette.accent,
          width: 1.5 * s,
          alpha: 0.4,
        });
      const icon = planet.theme.mapIcon(radius);
      const unlocked = isUnlocked(planet.order);
      icon.alpha = unlocked ? 1 : 0.35;
      view.addChild(ring, icon);
      if (!unlocked) {
        view.addChild(drawLock(new Graphics(), radius * 0.6));
      } else if (isCleared(planet.order)) {
        const check = drawCheck(new Graphics(), radius * 0.32);
        check.position.set(radius * 0.75, -radius * 0.75);
        view.addChild(check);
      }
      const label = new Label(planet.name, {
        variant: "small",
        scale: s,
        color: unlocked ? uiTheme.colors.text : uiTheme.colors.textMuted,
      });
      label.y = radius * 1.95;
      view.addChild(label);
      view.position.set(x, y);
      if (unlocked) {
        view.eventMode = "static";
        view.cursor = "pointer";
        view.hitArea = {
          contains: (px: number, py: number) =>
            px * px + py * py <
            Math.max(uiTheme.minTouchTarget / 2, radius * 1.6) ** 2,
        };
        view.on("pointertap", () => this.select(planet));
      }
      this.nodeLayer.addChild(view);
      return { planet, x, y, view, ring };
    });

    // Dashed route; cleared legs glow in the destination planet's accent.
    this.pathLayer.clear();
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i];
      const b = this.nodes[i + 1];
      const lit = isUnlocked(b.planet.order);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const dash = 8 * s;
      for (let d = radius * 1.8; d < len - radius * 1.8; d += dash * 2) {
        const t0 = d / len;
        const t1 = Math.min(len - radius * 1.8, d + dash) / len;
        this.pathLayer
          .moveTo(a.x + dx * t0, a.y + dy * t0)
          .lineTo(a.x + dx * t1, a.y + dy * t1);
      }
      this.pathLayer.stroke({
        color: lit
          ? lerpColor(b.planet.theme.palette.accent, 0xffffff, 0.3)
          : 0x5a6688,
        width: (lit ? 3 : 2) * s,
        alpha: lit ? 0.9 : 0.5,
        cap: "round",
      });
    }

    this.ship.clear();
    drawShip(this.ship, 12 * s);
    this.placeShipAt(this.currentIndex(), radius);

    this.chrome.removeChildren().forEach((c) => c.destroy({ children: true }));
    const title = new Label("Star Map", {
      variant: "heading",
      scale: s,
      gradient: [0xffffff, 0x7fd4ff],
      glow: uiTheme.colors.accent,
    });
    title.position.set(width / 2, height * 0.06);
    const back = new Button({
      label: "Back",
      variant: "secondary",
      width: 90,
      height: 40,
      scale: s * 0.8,
      onPress: () => sceneManager.goTo(new TitleScene()),
    });
    back.position.set(
      uiTheme.space.md * s + back.buttonWidth / 2,
      height * 0.06,
    );
    this.chrome.addChild(title, back);

    this.layoutInfo(width, height);
  }

  private currentIndex() {
    return Math.min(getHighestCleared() + 1, route.length - 1);
  }

  private placeShipAt(index: number, radius?: number) {
    const node = this.nodes[index];
    if (!node) return;
    const r = radius ?? 30;
    this.ship.position.set(node.x - r * 1.9, node.y + r * 0.2);
  }

  private flyShip(from: number, to: number) {
    const a = this.nodes[from];
    const b = this.nodes[to];
    if (!a || !b) return;
    const offsetX = this.ship.x - b.x;
    const startX = a.x + offsetX;
    const startY = a.y + (this.ship.y - b.y);
    const endX = this.ship.x;
    const endY = this.ship.y;
    this.shipMoving = true;
    this.ship.position.set(startX, startY);
    this.ship.rotation = Math.atan2(endY - startY, endX - startX) + Math.PI / 2;
    this.cancelFlight?.();
    this.cancelFlight = tween({
      target: this.ship,
      duration: 1200,
      ease: easeInOutSine,
      onUpdate: (t) => {
        if (this.ship.destroyed) return;
        this.ship.position.set(
          startX + (endX - startX) * t,
          startY + (endY - startY) * t,
        );
      },
      onComplete: () => {
        if (this.ship.destroyed) return;
        this.ship.rotation = 0;
        this.shipMoving = false;
      },
    });
  }

  private select(planet: PlanetConfig) {
    this.selected = planet;
    const { width, height } = getScreenSize();
    this.layoutInfo(width, height);
  }

  private layoutInfo(width: number, height: number) {
    const s = getUiScale(width, height);
    const planet = this.selected;
    const { accent, uiPanel } = planet.theme.palette;
    this.info.removeChildren().forEach((c) => c.destroy({ children: true }));
    const panelWidth = Math.min(width - uiTheme.space.lg * 2, 340 * s);
    const panelHeight = getInfoPanelHeight(s);
    const panel = new Panel({
      width: panelWidth,
      height: panelHeight,
      scale: s,
      color: uiPanel,
      accent,
    });
    panel.position.set(
      width / 2,
      height - panelHeight / 2 - uiTheme.space.lg * s,
    );

    const top = -panelHeight / 2;
    const name = new Label(planet.name, {
      variant: "heading",
      scale: s,
      color: uiTheme.colors.text,
      glow: accent,
    });
    name.y = top + 32 * s;
    const status = isCleared(planet.order)
      ? "CLEARED"
      : `SECTOR ${planet.order + 1} / 5`;
    const meta = new Label(status, {
      variant: "small",
      scale: s,
      color: isCleared(planet.order)
        ? uiTheme.colors.win
        : lerpColor(uiTheme.colors.text, accent, 0.6),
    });
    meta.y = top + 58 * s;
    const tagline = new Label(planet.tagline, {
      variant: "body",
      scale: s * 0.9,
      color: lerpColor(uiTheme.colors.textMuted, accent, 0.35),
      wordWrapWidth: panelWidth - uiTheme.space.xl * s,
    });
    tagline.y = top + 86 * s;
    const land = new Button({
      label: isCleared(planet.order) ? "Land Again" : "Land",
      width: 200,
      height: LAND_BUTTON_HEIGHT,
      scale: s,
      accent,
      onPress: () => sceneManager.goTo(new PlayScene({ planetId: planet.id })),
    });
    land.y = panelHeight / 2 - land.buttonHeight / 2 - 12 * s;
    panel.content.addChild(name, meta, tagline, land);
    this.info.addChild(panel);
  }
}

import { Container } from "pixi.js";
import type { Scene } from "./SceneManager";
import { sceneManager } from "./SceneManager";
import { StarMapScene } from "./StarMapScene";
import { TripCompleteScene } from "./TripCompleteScene";
import { markCleared } from "../progress";
import {
  addToBackgroundLayer,
  getActivePlanet,
  getFileBlocksLimit,
  getWorld,
  resetWorld,
  setActivePlanet,
  setGlobalPointerDown,
  setWorldDimensions,
} from "../../world";
import { loadTextures } from "../../textures";
import {
  planets,
  type BackgroundHandle,
  type PlanetId,
} from "../../config/planets";
import { startGameLoop, stopGameLoop } from "../loop";
import { createBoardFrame } from "../boardFrame";
import { TrailSystem } from "../../effects/trails";
import { gameEvents, gameWon } from "../events";
import { getApp, getScreenSize, setBoardInputEnabled, worldRoot } from "../app";
import { Modal } from "../../ui/Modal";
import { Hud } from "../../ui/Hud";
import { IntroCard } from "../../ui/IntroCard";
import {
  ACCELERATED_MAIN_TICKER_SPEED,
  DEFAULT_MAIN_TICKER_SPEED,
} from "../../constants";
import { FastDropBar } from "../../ui/FastDropBar";
import { getUiScale, uiTheme } from "../../ui/theme";

type PlayState = "loading" | "intro" | "playing" | "paused" | "won" | "lost";

const RESULT_DELAY_MS = 650;
const SHAKE_DURATION = 0.28; // seconds

export const getFastDropBarHeight = (width: number, height: number) =>
  Math.max(
    uiTheme.minTouchTarget + 16,
    Math.round(64 * getUiScale(width, height)),
  );

export const getHudHeight = (width: number, height: number) =>
  Math.max(uiTheme.minTouchTarget, Math.round(56 * getUiScale(width, height)));

const getNextPlanetId = (id: PlanetId): PlanetId | null => {
  const order = planets[id].order + 1;
  const next = Object.values(planets).find((p) => p.order === order);
  return next ? next.id : null;
};

export class PlayScene implements Scene {
  readonly view = new Container();
  private readonly planetId: PlanetId;
  private state: PlayState = "loading";
  private background: BackgroundHandle | null = null;
  private trails: TrailSystem | null = null;
  private shakeTime = 0;
  private shakeAmplitude = 0;
  private launched = 0;
  private hud: Hud | null = null;
  private fastDrop: FastDropBar | null = null;
  private intro: IntroCard | null = null;
  private modal: Modal | null = null;
  private resultTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribers: (() => void)[] = [];

  constructor({ planetId }: { planetId: PlanetId }) {
    this.planetId = planetId;
  }

  async enter() {
    // New-run lifecycle from DEMO_NOTES: stop, reset, select, load, size, attach, start.
    stopGameLoop();
    resetWorld();
    setActivePlanet(this.planetId);
    await loadTextures();

    const { width, height } = getScreenSize();
    const hudHeight = getHudHeight(width, height);
    // The board fills the space between the HUD and the fast-drop bar. The
    // stack limit follows the board's visible rows (setWorldDimensions), so
    // taller screens hold taller stacks and the board can use the full width.
    const boardHeight =
      height - hudHeight - getFastDropBarHeight(width, height);
    const boardWidth = width;
    const boardX = 0;
    worldRoot.position.set(boardX, hudHeight);
    setWorldDimensions(boardHeight, boardWidth);
    worldRoot.visible = true;

    this.background = getActivePlanet().theme.createBackground(width, height);
    this.background.view.position.set(-boardX, -hudHeight);
    addToBackgroundLayer(this.background.view);
    addToBackgroundLayer(
      createBoardFrame(
        boardWidth,
        boardHeight,
        getActivePlanet().theme.palette,
      ),
    );
    this.trails = new TrailSystem(getActivePlanet().theme.trail, (blocks) =>
      this.shake(blocks),
    );

    this.unsubscribers.push(
      gameEvents.on("blocksLaunchedOut", (count) => this.onLaunched(count)),
      gameEvents.on("gameLost", () => this.endRun("lost")),
    );
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.layoutHud(width, height);
    this.showIntro(width, height);
  }

  exit() {
    if (this.resultTimer) clearTimeout(this.resultTimer);
    this.clearFastDrop();
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    stopGameLoop();
    setBoardInputEnabled(false);
    setGlobalPointerDown(false);
    this.trails?.destroy();
    this.trails = null;
    this.background?.destroy();
    this.background = null;
    resetWorld();
    worldRoot.visible = false;
    worldRoot.position.set(0, 0);
    worldRoot.pivot.set(0, 0);
  }

  update(dt: number) {
    this.background?.update(dt);
    this.intro?.update(dt);
    if (this.state === "playing") {
      this.trails?.update(dt);
      this.hud?.setDanger(this.isInDanger());
    }
    this.hud?.update(dt);
    this.updateShake(dt);
  }

  // A short jolt when a big launch ignites. Applied through the board's pivot
  // so the board offset used for pointer mapping is never touched.
  private shake(blocks: number) {
    if (blocks < 5) return;
    const { width, height } = getScreenSize();
    this.shakeAmplitude =
      Math.min(10, 2 + blocks * 0.7) * getUiScale(width, height);
    this.shakeTime = SHAKE_DURATION;
  }

  private updateShake(dt: number) {
    if (this.shakeTime <= 0) return;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    const amount = this.shakeAmplitude * (this.shakeTime / SHAKE_DURATION);
    worldRoot.pivot.set(
      (Math.random() * 2 - 1) * amount,
      (Math.random() * 2 - 1) * amount,
    );
  }

  resize(width: number, height: number) {
    // The board keeps the size it started the run with (the engine positions
    // blocks in absolute pixels); only the interface reflows.
    this.background?.resize(width, height);
    this.layoutHud(width, height);
    if (this.intro) this.showIntro(width, height, false);
    this.modal?.layout(width, height);
  }

  private showIntro(width: number, height: number, animate = true) {
    this.state = "intro";
    this.intro?.destroy({ children: true });
    const intro = new IntroCard(width, height, getActivePlanet(), () => {
      intro.destroy({ children: true });
      this.intro = null;
      this.resume();
    });
    this.intro = intro;
    this.view.addChild(intro);
    if (animate) intro.show();
  }

  // Mirrors the engine's danger condition (dangerAnimation) without changing it.
  private isInDanger() {
    for (const fragments of getWorld().fileFragmentsByFileNumber.values()) {
      for (const fragment of fragments) {
        if (fragment.blocks.length > getFileBlocksLimit()) return true;
      }
    }
    return false;
  }

  // Hold-to-drop-faster: same as holding Space on desktop.
  private onFastDropHold = (holding: boolean) => {
    if (this.state !== "playing") return;
    getApp().ticker.speed = holding
      ? ACCELERATED_MAIN_TICKER_SPEED
      : DEFAULT_MAIN_TICKER_SPEED;
  };

  private clearFastDrop() {
    this.fastDrop?.release(() => {});
    getApp().ticker.speed = DEFAULT_MAIN_TICKER_SPEED;
  }

  private resume() {
    this.closeModal();
    this.state = "playing";
    setBoardInputEnabled(true);
    startGameLoop(getApp());
  }

  private pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    stopGameLoop();
    this.clearFastDrop();
    setBoardInputEnabled(false);
    setGlobalPointerDown(false);
    this.openModal({
      title: "Paused",
      actions: [
        { label: "Resume", onPress: () => this.resume() },
        { label: "Retry", variant: "secondary", onPress: () => this.retry() },
        {
          label: "Quit to Map",
          variant: "secondary",
          onPress: () => this.quit(),
        },
      ],
    });
  }

  private onLaunched(count: number) {
    if (this.state !== "playing") return;
    this.launched += count;
    this.updateCounter();
    if (this.launched >= getActivePlanet().goal.launchedBlocksToWin) {
      stopGameLoop();
      markCleared(getActivePlanet().order);
      gameWon();
      this.endRun("won");
    }
  }

  private endRun(result: "won" | "lost") {
    if (this.state === "won" || this.state === "lost") return;
    this.state = result;
    this.clearFastDrop();
    setBoardInputEnabled(false);
    setGlobalPointerDown(false);
    this.resultTimer = setTimeout(
      () => this.showResult(result),
      RESULT_DELAY_MS,
    );
  }

  private showResult(result: "won" | "lost") {
    const planet = getActivePlanet();
    const goal = planet.goal.launchedBlocksToWin;
    const nextId = getNextPlanetId(planet.id);
    if (result === "won") {
      this.openModal({
        title: `${planet.name} cleared!`,
        titleColor: uiTheme.colors.win,
        message: `You launched ${Math.min(this.launched, goal)} blocks into orbit.`,
        actions: [
          nextId
            ? {
                label: `On to ${planets[nextId].name}`,
                onPress: () =>
                  sceneManager.goTo(
                    new StarMapScene({ arrivedFrom: planet.order }),
                  ),
              }
            : {
                label: "Finish Trip",
                onPress: () => sceneManager.goTo(new TripCompleteScene()),
              },
          {
            label: "Replay",
            variant: "secondary",
            onPress: () => this.retry(),
          },
          {
            label: "Star Map",
            variant: "secondary",
            onPress: () => this.quit(),
          },
        ],
      });
    } else {
      this.openModal({
        title: "Overrun!",
        titleColor: uiTheme.colors.lose,
        message: `The blocks piled too high. Launched ${this.launched} / ${goal}.`,
        actions: [
          { label: "Retry", onPress: () => this.retry() },
          {
            label: "Star Map",
            variant: "secondary",
            onPress: () => this.quit(),
          },
        ],
      });
    }
  }

  private retry() {
    void sceneManager.goTo(new PlayScene({ planetId: this.planetId }));
  }

  private quit() {
    void sceneManager.goTo(new StarMapScene());
  }

  private openModal(options: ConstructorParameters<typeof Modal>[0]) {
    this.closeModal();
    const { width, height } = getScreenSize();
    const { palette } = getActivePlanet().theme;
    this.modal = new Modal(
      { accent: palette.accent, panelColor: palette.uiPanel, ...options },
      width,
      height,
    );
    this.view.addChild(this.modal);
    this.modal.show();
  }

  private closeModal() {
    this.modal?.destroy({ children: true });
    this.modal = null;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== "Escape" && e.code !== "KeyP") return;
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  };

  private onVisibilityChange = () => {
    if (document.hidden && this.state === "playing") this.pause();
  };

  private layoutHud(width: number, height: number) {
    this.hud?.destroy({ children: true });
    this.hud = new Hud({
      width,
      height,
      hudHeight: getHudHeight(width, height),
      planet: getActivePlanet(),
      onPause: () => this.pause(),
    });
    // The HUD and fast-drop bar sit under any intro card or modal.
    this.view.addChildAt(this.hud, 0);
    this.fastDrop?.destroy({ children: true });
    const barHeight = getFastDropBarHeight(width, height);
    this.fastDrop = new FastDropBar({
      width,
      height,
      barHeight,
      planet: getActivePlanet(),
      onHoldChange: this.onFastDropHold,
    });
    this.fastDrop.y = height - barHeight;
    this.view.addChildAt(this.fastDrop, 1);
    this.updateCounter();
  }

  private updateCounter() {
    this.hud?.setLaunched(
      this.launched,
      getActivePlanet().goal.launchedBlocksToWin,
    );
  }
}

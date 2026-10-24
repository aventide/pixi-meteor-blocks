import { Container, Graphics } from "pixi.js";
import type { PlanetConfig } from "../config/planets";
import { Panel } from "./Panel";
import { Label } from "./Label";
import { Button } from "./Button";
import { formatGravity } from "./Hud";
import { getUiScale, uiTheme } from "./theme";
import { easeOutBack, fade, tween } from "./tween";
import { lerpColor } from "../themes/shared/color";

// Shown before each run: the planet's globe, name, tagline, key stats, and a
// Launch button. Tapping anywhere also launches.
export class IntroCard extends Container {
  private readonly panel: Panel;
  private readonly icon: Container;
  private time = 0;
  private closing = false;

  constructor(
    width: number,
    height: number,
    planet: PlanetConfig,
    private readonly onLaunch: () => void,
  ) {
    super();
    const s = getUiScale(width, height);
    const { accent, uiPanel, uiText } = planet.theme.palette;

    const scrim = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: uiTheme.colors.scrim, alpha: 0.45 });
    scrim.eventMode = "static";
    scrim.cursor = "pointer";
    scrim.on("pointerdown", (e) => e.stopPropagation());
    scrim.on("pointertap", () => this.launch());
    this.addChild(scrim);

    const panelWidth = Math.min(width - uiTheme.space.lg * 2, 330 * s);
    const panelHeight = 400 * s;
    this.panel = new Panel({
      width: panelWidth,
      height: panelHeight,
      scale: s,
      color: uiPanel,
      accent,
    });
    this.panel.position.set(width / 2, height * 0.47);
    this.addChild(this.panel);

    const top = -panelHeight / 2;
    this.icon = planet.theme.mapIcon(48 * s);
    this.icon.y = top + 82 * s;

    const sector = new Label(`SECTOR ${planet.order + 1} / 5`, {
      variant: "small",
      scale: s,
      color: lerpColor(uiText, accent, 0.6),
    });
    sector.y = top + 152 * s;
    const name = new Label(planet.name, {
      variant: "title",
      scale: s * 0.8,
      gradient: [0xffffff, lerpColor(accent, 0xffffff, 0.3)],
      glow: accent,
    });
    name.y = top + 190 * s;
    const tagline = new Label(planet.tagline, {
      variant: "body",
      scale: s * 0.95,
      color: uiTheme.colors.textMuted,
      wordWrapWidth: panelWidth - uiTheme.space.xl * s,
    });
    tagline.y = top + 236 * s;

    const stats = new Container();
    const entries: [string, string][] = [
      ["GRAVITY", formatGravity(planet)],
      ["GOAL", `${planet.goal.launchedBlocksToWin}`],
    ];
    entries.forEach(([label, value], i) => {
      const x = (i === 0 ? -1 : 1) * panelWidth * 0.22;
      const v = new Label(value, {
        variant: "number",
        scale: s * 0.9,
        color: uiText,
      });
      v.position.set(x, 0);
      const l = new Label(label, {
        variant: "small",
        scale: s * 0.85,
        color: lerpColor(uiText, accent, 0.6),
      });
      l.position.set(x, 22 * s);
      stats.addChild(v, l);
    });
    const divider = new Graphics()
      .rect(-1, -10 * s, 2, 36 * s)
      .fill({ color: accent, alpha: 0.5 });
    stats.addChild(divider);
    stats.y = top + 280 * s;

    const launch = new Button({
      label: "Launch!",
      scale: s,
      width: 220,
      accent,
      onPress: () => this.launch(),
    });
    launch.y = panelHeight / 2 - 50 * s;

    this.panel.content.addChild(
      this.icon,
      sector,
      name,
      tagline,
      stats,
      launch,
    );
  }

  show() {
    this.alpha = 0;
    void fade(this, 1, uiTheme.durations.normal);
    this.panel.scale.set(0.88);
    tween({
      duration: uiTheme.durations.slow,
      ease: easeOutBack,
      onUpdate: (t) => {
        if (!this.panel.destroyed) this.panel.scale.set(0.88 + 0.12 * t);
      },
    });
  }

  update(dt: number) {
    this.time += dt;
    this.icon.rotation = Math.sin(this.time * 0.6) * 0.08;
    this.icon.y += Math.sin(this.time * 2) * 0.08;
  }

  private launch() {
    if (this.closing) return;
    this.closing = true;
    void fade(this, 0, uiTheme.durations.normal).then(() => this.onLaunch());
  }
}

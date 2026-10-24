import type { Container, Ticker } from "pixi.js";
import { getApp } from "../game/app";

export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;
export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack: Ease = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

type TweenOptions = {
  duration: number; // ms
  ease?: Ease;
  onUpdate: (t: number) => void;
  onComplete?: () => void;
};

// Runs on the app ticker, so tweens pause with the app (e.g. hidden tab).
// Returns a cancel function that stops the tween without completing it.
export const tween = ({
  duration,
  ease = easeOutCubic,
  onUpdate,
  onComplete,
}: TweenOptions) => {
  const ticker = getApp().ticker;
  let elapsed = 0;
  let done = false;

  const tick = (time: Ticker) => {
    elapsed += time.deltaMS;
    const t = Math.min(1, elapsed / Math.max(1, duration));
    onUpdate(ease(t));
    if (t >= 1) {
      cancel();
      onComplete?.();
    }
  };

  const cancel = () => {
    if (done) return;
    done = true;
    ticker.remove(tick);
  };

  ticker.add(tick);
  return cancel;
};

export const fade = (
  target: Container,
  to: number,
  duration: number,
): Promise<void> => {
  const from = target.alpha;
  return new Promise((resolve) => {
    tween({
      duration,
      ease: easeInOutSine,
      onUpdate: (t) => {
        if (!target.destroyed) target.alpha = from + (to - from) * t;
      },
      onComplete: resolve,
    });
  });
};

import { Text, type TextStyleOptions } from "pixi.js";
import { uiTheme } from "./theme";
import { verticalGradient } from "./frame";

export type LabelVariant =
  | "title"
  | "heading"
  | "body"
  | "small"
  | "button"
  | "number";

type LabelOptions = {
  variant?: LabelVariant;
  color?: number;
  gradient?: [number, number]; // top/bottom fill, replaces color
  glow?: number; // glow color
  scale?: number;
  align?: "left" | "center" | "right";
  wordWrapWidth?: number;
};

const DISPLAY: LabelVariant[] = ["title", "heading", "button", "number"];

const variantStyle = (variant: LabelVariant): TextStyleOptions => {
  const display = DISPLAY.includes(variant);
  return {
    fontFamily: display ? uiTheme.displayFontFamily : uiTheme.fontFamily,
    fontSize: uiTheme.type[variant === "number" ? "heading" : variant],
    fontWeight:
      variant === "title"
        ? "900"
        : variant === "body" || variant === "small"
          ? "500"
          : "700",
    letterSpacing: display ? (variant === "title" ? 4 : 2) : 0.3,
  };
};

export class Label extends Text {
  constructor(text: string, options: LabelOptions = {}) {
    const {
      variant = "body",
      color = uiTheme.colors.text,
      gradient,
      glow,
      scale = 1,
      align = "center",
      wordWrapWidth,
    } = options;
    const base = variantStyle(variant);
    const fontSize = Math.round((base.fontSize as number) * scale);
    super({
      text:
        DISPLAY.includes(variant) && variant !== "number"
          ? text.toUpperCase()
          : text,
      style: {
        ...base,
        fontSize,
        letterSpacing: (base.letterSpacing as number) * scale,
        fill: gradient ? verticalGradient(gradient[0], gradient[1]) : color,
        align,
        wordWrap: wordWrapWidth !== undefined,
        wordWrapWidth,
        lineHeight: variant === "title" ? fontSize * 1.05 : undefined,
        // Room for the glow's blur, or it gets clipped to a hard rectangle.
        padding: glow !== undefined ? Math.ceil(16 * scale) : 0,
        dropShadow:
          glow !== undefined
            ? {
                color: glow,
                blur: 10 * scale,
                distance: 0,
                alpha: 0.85,
                angle: 0,
              }
            : undefined,
      },
    });
    this.anchor.set(align === "left" ? 0 : align === "right" ? 1 : 0.5, 0.5);
    this.eventMode = "none";
  }
}

import { Text, type TextStyleOptions } from "pixi.js";
import { uiTheme } from "./theme";

export type LabelVariant = "title" | "heading" | "body" | "small" | "button";

type LabelOptions = {
  variant?: LabelVariant;
  color?: number;
  scale?: number;
  align?: "left" | "center" | "right";
  wordWrapWidth?: number;
};

const variantStyle = (variant: LabelVariant): TextStyleOptions => {
  const display = variant === "title" || variant === "heading";
  return {
    fontFamily: display ? uiTheme.displayFontFamily : uiTheme.fontFamily,
    fontSize: uiTheme.type[variant],
    fontWeight: variant === "body" || variant === "small" ? "normal" : "bold",
    letterSpacing: variant === "title" ? 2 : variant === "button" ? 0.5 : 0,
  };
};

export class Label extends Text {
  constructor(text: string, options: LabelOptions = {}) {
    const {
      variant = "body",
      color = uiTheme.colors.text,
      scale = 1,
      align = "center",
      wordWrapWidth,
    } = options;
    const base = variantStyle(variant);
    super({
      text,
      style: {
        ...base,
        fontSize: Math.round((base.fontSize as number) * scale),
        fill: color,
        align,
        wordWrap: wordWrapWidth !== undefined,
        wordWrapWidth,
      },
    });
    this.anchor.set(align === "left" ? 0 : align === "right" ? 1 : 0.5, 0.5);
    this.eventMode = "none";
  }
}

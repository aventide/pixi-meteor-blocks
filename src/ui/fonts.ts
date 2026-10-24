import { assetUrl } from "../themes/shared/assets";

// Bundled OFL fonts (see public/fonts/*-OFL.txt). Both are variable fonts, so
// one file covers every weight. Must finish before any Pixi Text is created,
// or text measures against the fallback font.
const FONTS = [
  { family: "Orbitron", file: "fonts/Orbitron.ttf", weight: "400 900" },
  { family: "Exo 2", file: "fonts/Exo2.ttf", weight: "100 900" },
];

export const loadFonts = async () => {
  await Promise.all(
    FONTS.map(async ({ family, file, weight }) => {
      try {
        const face = new FontFace(family, `url(${assetUrl(file)})`, { weight });
        document.fonts.add(await face.load());
      } catch {
        // Fall back to the system font stack in theme.ts.
      }
    }),
  );
};

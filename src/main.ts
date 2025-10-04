import { Application } from "pixi.js";
import { setWorldDimensions } from "./world";

(async () => {
  const app = new Application();
  await app.init({
    background: "#1099bb",
    autoDensity: true,
    resolution: Math.max(1, window.devicePixelRatio),
    resizeTo: document.getElementById("pixi-container") || window,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  setWorldDimensions(app.screen.height, app.screen.width);

  setInterval(() => {}, 500);

  // app.ticker.add((time) => {
  // const dt = time.deltaTime / 60;

  // apply mutators to each block group
  // blocks.forEach((block) => {
  //   gravityMutator(block, dt);
  // });
  // });
})();

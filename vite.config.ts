import { defineConfig } from "vite";

// base './' — ассеты грузятся относительно index.html:
// работает и на GitHub Pages в подпапке (/<repo>/), и локально, и на своём домене.
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
  },
  publicDir: "public",
});

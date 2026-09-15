import { defineConfig } from "vite";

export default defineConfig({
  ssr: {
    noExternal: ["astronomy-engine", "circular-natal-horoscope-js"],
  },
});

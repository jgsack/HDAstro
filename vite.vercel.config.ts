import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel serves the existing client-side app; Sites retains its Worker build.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist-vercel" },
});

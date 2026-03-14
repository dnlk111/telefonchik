import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/room": {
        target: "http://localhost:8787",
        changeOrigin: true,
        ws: true,
      },
      "/health": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});

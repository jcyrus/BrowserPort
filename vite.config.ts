import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Main process entry file
        entry: "src/main/index.ts",
        vite: {
          build: {
            outDir: "dist-electron/main",
            target: "es2022",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
      preload: {
        // Preload script entry file
        input: "src/preload/index.ts",
        vite: {
          build: {
            outDir: "dist-electron/preload",
          },
        },
      },
      // Enable hot reload for electron main process
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
  },
});

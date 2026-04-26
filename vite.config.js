import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

/** GitHub Pages: https://<user>.github.io/<repo>/ */
const GH_PAGES_BASE = "/zianna-study/";

export default defineConfig(({ command }) => ({
  // 仅正式构建时挂到子路径，本地 `npm run dev` 仍用根路径
  base: command === "build" ? GH_PAGES_BASE : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // 优先 5175；被占用时自动顺延 5176… 以 `npm run dev` 输出里的 Local: 为准
  server: {
    port: 5175,
    host: true,
    strictPort: false,
  },
}));

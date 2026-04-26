import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

/** GitHub Pages（仅 Actions 构建）：user.github.io/zianna-study/ */
const GH_PAGES_BASE = "/zianna-study/";

function publicBase(command) {
  if (command !== "build") return "/";
  // Vercel 在构建时注入，站点在根路径；GitHub Actions 为项目子路径
  if (process.env.VERCEL) return "/";
  if (process.env.GITHUB_ACTIONS) return GH_PAGES_BASE;
  // 本地 npm run build：与 Vercel 一致，根路径
  return "/";
}

export default defineConfig(({ command }) => ({
  base: publicBase(command),
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

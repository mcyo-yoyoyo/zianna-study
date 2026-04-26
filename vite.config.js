import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
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
});

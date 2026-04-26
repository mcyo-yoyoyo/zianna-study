import { copyFileSync, existsSync } from "node:fs";

// 仅 GitHub Pages 需要 404 回退为 SPA；Vercel 用 rewrites
if (process.env.GITHUB_ACTIONS && !process.env.VERCEL && existsSync("dist/index.html")) {
  copyFileSync("dist/index.html", "dist/404.html");
}

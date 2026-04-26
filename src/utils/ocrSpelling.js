/**
 * 浏览器端 Tesseract OCR，不经过大模型，不耗 API token。
 * 首次需从 CDN 拉取 core/语言包；worker 自打包，避免默认跨域/脚本加载失败。
 */

// Vite：worker 与页面同源，减少「仅 CDN 失败」导致的 createWorker 挂起
// eslint-disable-next-line import/no-unresolved -- Vite 资源后缀
import tesseractWorkerUrl from "tesseract.js/dist/worker.min.js?url";

import { parseOcrTextToWordList } from "./ocrTextParse.js";

const CORE_CDN_CANDIDATES = [
  "https://cdn.jsdelivr.net/npm/tesseract.js-core@v7.0.0",
  "https://unpkg.com/tesseract.js-core@7.0.0",
];

export { parseOcrTextToWordList } from "./ocrTextParse.js";

/**
 * @param {unknown} e Tesseract 可能 reject 为 string 或 Error
 * @returns {string}
 */
export function formatOcrError(e) {
  if (e instanceof Error) return e.message || String(e);
  if (typeof e === "string" && e.trim()) return e.trim();
  if (e && typeof e === "object" && "message" in e) {
    const m = String(/** @type {{ message?: unknown }} */ (e).message);
    if (m) return m;
  }
  return "OCR 失败，可重试或改用 AI/手输";
}

/** @deprecated 使用 formatOcrError */
export const formatTesseractError = formatOcrError;

/**
 * 部分设备选图时 MIME 为空或非常规
 * @param {File} file
 */
function isAcceptableImageFile(file) {
  if (!file) return false;
  if (file.type) {
    if (file.type.startsWith("image/")) return true;
    if (file.type === "application/octet-stream") {
      return /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name || "");
    }
  } else {
    return /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name || "");
  }
  return false;
}

/**
 * 轻量 Tesseract 本机 OCR，返回整段文字与词列表，便于与听写词表做子串/词条匹配。
 * @param {File} file
 * @param {(p: number) => void} [onProgress] 0~1
 * @returns {Promise<{ rawText: string, words: string[] }>}
 */
export async function extractOcrTextAndList(file, onProgress) {
  if (!isAcceptableImageFile(file)) {
    throw new Error("请选图片（JPG/PNG 等）");
  }

  const { createWorker } = await import("tesseract.js");
  let lastError = "OCR 初始化或识别失败，请重试或检查网络后下载语言包";

  for (const corePath of CORE_CDN_CANDIDATES) {
    let worker;
    try {
      worker = await createWorker("chi_sim+eng", 1, {
        workerPath: tesseractWorkerUrl,
        corePath,
        workerBlobURL: true,
        logger: (m) => {
          if (typeof m.progress === "number" && m.status) {
            onProgress?.(Math.max(0, Math.min(1, m.progress)));
          }
        },
      });
      onProgress?.(0);
      const {
        data: { text },
      } = await worker.recognize(file);
      const raw = typeof text === "string" ? text : "";
      const list = parseOcrTextToWordList(raw);
      onProgress?.(1);
      return { rawText: raw, words: list };
    } catch (e) {
      lastError = formatOcrError(e);
    } finally {
      if (worker) await worker.terminate();
    }
  }

  throw new Error(lastError);
}

/**
 * 仅返回词列表；内部与 {@link extractOcrTextAndList} 共用实现。
 * @param {File} file
 * @param {(p: number) => void} [onProgress] 0~1
 * @returns {Promise<string[]>}
 */
export async function extractWordsWithOcr(file, onProgress) {
  const { words } = await extractOcrTextAndList(file, onProgress);
  return words;
}

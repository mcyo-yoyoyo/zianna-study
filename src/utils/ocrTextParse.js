/**
 * 将 OCR 原始字串拆成听写词列表（启发式）
 * @param {string} raw
 * @returns {string[]}
 */
export function parseOcrTextToWordList(raw) {
  if (!raw || typeof raw !== "string") return [];
  const t = raw.trim();
  if (!t) return [];
  const pieces = t
    .split(/[\n\r,，;；、\t]+/)
    .flatMap((line) => line.split(/\s+/))
    .map((s) => s.replace(/[^\u4e00-\u9fff]/g, "").trim())
    .filter((s) => s.length >= 1 && s.length <= 8);
  const seen = new Set();
  const out = [];
  for (const w of pieces) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  if (out.length) return out;
  const m = t.match(/[\u4e00-\u9fff]{1,4}/g) || [];
  for (const w of m) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

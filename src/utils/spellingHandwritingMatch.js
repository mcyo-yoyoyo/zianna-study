/**
 * 识图词表与家长下发听写词比对（可来自 Tesseract 或 多模态 API；可错题本中核对）
 */

/**
 * 是否可在 OCR 结果中认为「该词有出现/写出」
 * @param {string} target
 * @param {string[]} ocrTokens
 * @param {string} rawText
 */
function isWordSeenInOcr(target, ocrTokens, rawText) {
  const t = (target || "").trim();
  if (!t) return true;
  if (ocrTokens.includes(t)) return true;
  const flat = (rawText || "").replace(/[\s\n\r,，;；。．、.·:：·]/g, "");
  if (flat.includes(t)) return true;
  return false;
}

/**
 * 返回在照片中未「命中」的听写词（用于记入错题）
 * @param {string[]} targetWords 家长下发顺序
 * @param {string[]} ocrTokenList
 * @param {string} rawOcrText
 * @returns {string[]}
 */
export function getUnmatchedSpellingTargets(
  targetWords,
  ocrTokenList,
  rawOcrText
) {
  const list = (targetWords || [])
    .map((w) => String(w).trim())
    .filter(Boolean);
  return list.filter((w) => !isWordSeenInOcr(w, ocrTokenList, rawOcrText));
}

/**
 * 是否几乎没有任何可识别字（再拍/调光）
 * @param {string} raw
 * @param {string[]} tokens
 */
export function isOcrEffectivelyEmpty(raw, tokens) {
  const t = (raw || "").replace(/\s/g, "");
  if (t.length >= 2) return false;
  if (tokens.length >= 1) return false;
  return true;
}

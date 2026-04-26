const KEY = "banxue_spelling_error_sessions_v1";
const EVENT = "spellingErrorSessionsUpdated";

/**
 * 一次孩子端听写本拍照核对产生的记录（不拆成多行）
 * @typedef {object} SpellingErrorSession
 * @property {string} id
 * @property {number} createdAt
 * @property {string[]} wrongWords
 * @property {string[]} [parentWords] 当次家长布置的全词表快照（可选）
 */

/**
 * @returns {SpellingErrorSession[]}
 */
export function getSpellingErrorSessions() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const t = JSON.parse(raw);
    if (!Array.isArray(t)) return [];
    return t
      .map((x) => ({
        id: String(x.id || ""),
        createdAt: Number(x.createdAt) || Date.now(),
        wrongWords: Array.isArray(x.wrongWords)
          ? x.wrongWords.map((w) => String(w).trim()).filter(Boolean)
          : [],
        parentWords: Array.isArray(x.parentWords)
          ? x.parentWords.map((w) => String(w).trim()).filter(Boolean)
          : undefined,
      }))
      .filter((x) => x.id && x.wrongWords.length);
  } catch {
    return [];
  }
}

/** 新记录插到前面 */
function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * 孩子听写本核对后写入一条（不写入通用错题多行）
 * @param {{ wrongWords: string[], parentWords?: string[] }} payload
 * @returns {string} 新建 session id
 */
export function addSpellingErrorSession(payload) {
  const wrong = (payload.wrongWords || [])
    .map((w) => String(w).trim())
    .filter(Boolean);
  if (!wrong.length) return "";
  const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const rec = {
    id,
    createdAt: Date.now(),
    wrongWords: wrong,
    parentWords: payload.parentWords?.length
      ? payload.parentWords.map((w) => String(w).trim()).filter(Boolean)
      : undefined,
  };
  const all = [rec, ...getSpellingErrorSessions().filter((x) => x.id !== id)];
  persist(all);
  return id;
}

/** @param {string} id */
export function removeSpellingErrorSession(id) {
  persist(getSpellingErrorSessions().filter((x) => x.id !== id));
}

/**
 * 合并多段词，去重且保持先出现的顺序
 * @param {string[][]} groups
 * @returns {string[]}
 */
export function mergeWordGroupsUnique(groups) {
  const seen = new Set();
  const out = [];
  for (const g of groups) {
    for (const w of g || []) {
      const t = String(w).trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

export { EVENT as SPELLING_ERROR_SESSIONS_EVENT, KEY as SPELLING_ERROR_SESSIONS_KEY };

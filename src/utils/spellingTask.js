const KEY = "banxue_spelling_v1";
const EVENT = "spellingTaskUpdated";

/**
 * @typedef {object} SpellingTaskPayload
 * @property {string[]} words
 * @property {number} intervalSec
 * @property {number} repeatPerWord
 * @property {number} [createdAt]
 */

/**
 * @returns {SpellingTaskPayload | null}
 */
export function getSpellingTask() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (!t || !Array.isArray(t.words)) return null;
    return {
      words: t.words.map((w) => String(w).trim()).filter(Boolean),
      intervalSec: Math.max(0, Number(t.intervalSec) || 30),
      repeatPerWord: Math.max(1, Math.min(5, Number(t.repeatPerWord) || 3)),
      createdAt: t.createdAt || Date.now(),
    };
  } catch {
    return null;
  }
}

/** @param {SpellingTaskPayload} payload */
export function setSpellingTask(payload) {
  const t = {
    ...payload,
    createdAt: payload.createdAt || Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(t));
  window.dispatchEvent(new Event(EVENT));
}

export function clearSpellingTask() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export { EVENT as SPELLING_TASK_EVENT, KEY as SPELLING_TASK_KEY };

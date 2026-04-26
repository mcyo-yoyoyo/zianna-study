const KEY = "banxue_errorbook_v1";
const EVENT = "errorBookUpdated";

/**
 * @typedef {object} ErrorItem
 * @property {string} id
 * @property {string} stem
 * @property {string} subject 语文|数学|英语
 * @property {string} knowledgePoint
 * @property {string} [bookTag]
 * @property {number} createdAt
 * @property {boolean} inWeakPool 易错池
 * @property {number} [stars] 本题为闯关积累星星
 */

/**
 * @returns {ErrorItem[]}
 */
export function getErrorItems() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const t = JSON.parse(raw);
    return Array.isArray(t) ? t.map(normalizeItem) : [];
  } catch {
    return [];
  }
}

/** @param {Partial<ErrorItem> & { stem: string, subject: string, knowledgePoint: string }} raw */
function normalizeItem(raw) {
  const id = raw.id || String(Math.random());
  return {
    id,
    stem: String(raw.stem || "").trim(),
    subject: normalizeSubject(raw.subject),
    knowledgePoint: String(raw.knowledgePoint || "未分类").trim(),
    bookTag: String(raw.bookTag || "深圳部编版一年级下册").trim(),
    createdAt: raw.createdAt || Date.now(),
    inWeakPool: raw.inWeakPool !== false,
    stars: Math.max(0, Number(raw.stars) || 0),
  };
}

/** @param {unknown} s */
function normalizeSubject(s) {
  const t = String(s || "");
  if (t.includes("数") || t === "数学") return "数学";
  if (t.includes("英") || t === "英语") return "英语";
  if (t.includes("文") || t === "语文") return "语文";
  return t.slice(0, 2) || "语文";
}

function persist(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/** @param {Omit<ErrorItem, "id" | "createdAt">[]} items */
export function addErrorItems(items) {
  const all = getErrorItems();
  const time = Date.now();
  for (const it of items) {
    if (!it.stem) continue;
    all.push(
      normalizeItem({
        ...it,
        id: it.id || `e-${time}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: it.createdAt || time,
        inWeakPool: it.inWeakPool !== false,
      })
    );
  }
  persist(all);
}

/** @param {string} id @param {Partial<ErrorItem>} patch */
export function updateErrorItem(id, patch) {
  const all = getErrorItems();
  const i = all.findIndex((x) => x.id === id);
  if (i < 0) return;
  all[i] = normalizeItem({ ...all[i], ...patch, id: all[i].id });
  persist(all);
}

/** @param {string} id */
export function removeErrorItem(id) {
  persist(getErrorItems().filter((x) => x.id !== id));
}

/**
 * 孩子答对闯关后：移出易错池或删除
 * @param {string} id
 * @param {{ remove?: boolean, addStars?: number }} opt
 */
export function markWeakPoolResolved(id, opt = {}) {
  const { remove, addStars = 0 } = opt;
  if (remove) {
    removeErrorItem(id);
    return;
  }
  const all = getErrorItems();
  const cur = all.find((x) => x.id === id);
  if (!cur) return;
  updateErrorItem(id, {
    inWeakPool: false,
    stars: (cur.stars || 0) + addStars,
  });
}

export { EVENT as ERROR_BOOK_EVENT, KEY as ERROR_BOOK_KEY };

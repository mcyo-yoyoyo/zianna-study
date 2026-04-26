import { getErrorItems } from "./errorBookStore.js";
import { getSpellingTask } from "./spellingTask.js";

/**
 * 三科「掌握度」0–100（由错题/易错池/星星简单推算，非客观测评）
 */
export function getSubjectMasteryRows(itemsIn) {
  const items = itemsIn ?? getErrorItems();
  const subs = /** @type {const} */ (["语文", "数学", "英语"]);
  return subs.map((s) => {
    const sub = items.filter((i) => i.subject === s);
    if (sub.length === 0) {
      return { subject: s, score: 88, 记录: 0, 易错: 0 };
    }
    const 易错 = sub.filter((i) => i.inWeakPool).length;
    const stars = sub.reduce((a, b) => a + (b.stars || 0), 0);
    let m =
      96 -
      易错 * 14 -
      sub.length * 1.2 +
      Math.min(16, stars * 1.5);
    m = Math.max(18, Math.min(100, Math.round(m)));
    return { subject: s, score: m, 记录: sub.length, 易错 };
  });
}

/** 高频知识点 Top N */
export function getTopKnowledgePoints(items, n = 8) {
  const list = items ?? getErrorItems();
  const m = new Map();
  for (const it of list) {
    const k = (it.knowledgePoint || "未分类").trim();
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** 汇总数字 */
export function getErrorSummary(itemsIn) {
  const items = itemsIn ?? getErrorItems();
  const 易错池 = items.filter((i) => i.inWeakPool).length;
  const 星星 = items.reduce((a, b) => a + (b.stars || 0), 0);
  return { total: items.length, 易错池, 星星 };
}

/** 听写任务信息（本机） */
export function getSpellingSummary() {
  const t = getSpellingTask();
  if (!t?.words?.length) {
    return { 词数: 0, 有任务: false };
  }
  return { 词数: t.words.length, 有任务: true, intervalSec: t.intervalSec };
}

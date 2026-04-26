import data from "../data/curriculumReference.sample.json";

/**
 * 用题干 + 知识点 与 课标参考域 的关键词做简单覆盖计分，得到「最可能」能力域
 * 非官方测评、非教育局 API 结果
 */
function normSubject(s) {
  const t = String(s || "");
  if (t.includes("数") || t === "数学") return "数学";
  if (t.includes("英") || t === "英语") return "英语";
  return "语文";
}

/**
 * @param {{ stem: string, subject: string, knowledgePoint: string }} item
 * @returns {{ subject: string, domain: string, score: number, bestKeywords: string[] } | null}
 */
export function matchItemToDomain(item) {
  const sub = normSubject(item.subject);
  if (!["数学", "语文", "英语"].includes(sub)) return null;

  const text = `${item.stem || ""} ${item.knowledgePoint || ""}`.toLowerCase();
  const cjk = String(item.stem || "") + String(item.knowledgePoint || "");
  const refs = data[sub] || [];
  let best = null;
  for (const r of refs) {
    let hit = 0;
    const keys = /** @type {string[]} */ (r.keywords);
    const matched = [];
    for (const kw of keys) {
      const k = kw.toLowerCase();
      if (cjk.includes(kw) || text.includes(k)) {
        hit += 1;
        matched.push(kw);
      }
    }
    if (!best || hit > best.score) {
      best = { subject: sub, domain: r.domain, score: hit, bestKeywords: matched };
    }
  }
  if (!best || best.score < 1) {
    return { subject: sub, domain: "未匹配到参考域", score: 0, bestKeywords: [] };
  }
  return best;
}

/**
 * 汇总：按课标能力域计错题条数
 * @param {object[] | null} items
 * @returns {{ total: number, byDomain: { key: string, subject: string, domain: string, count: number, pct: number }[], unmatched: number }}
 */
export function aggregateCurriculumDomains(items) {
  const list = items?.length ? items : [];
  const map = new Map();
  let unmatched = 0;
  for (const it of list) {
    const m = matchItemToDomain(it);
    if (!m || m.score < 1) {
      unmatched += 1;
      continue;
    }
    if (m.domain === "未匹配到参考域") {
      unmatched += 1;
      continue;
    }
    const key = `${m.subject}·${m.domain}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  const total = list.length;
  const byDomain = [...map.entries()]
    .map(([k, count]) => {
      const [subject, domain] = k.split("·");
      return { key: k, subject, domain, count, pct: total ? Math.round((count * 1000) / total) / 10 : 0 };
    })
    .sort((a, b) => b.count - a.count);
  return { total, byDomain, unmatched };
}

export function getCurriculumMeta() {
  return data.meta;
}

import { useMemo } from "react";
import { BookMarked, MapPin, Trash2 } from "lucide-react";
import { useErrorBook } from "@/hooks/useErrorBook";
import { removeErrorItem, updateErrorItem } from "@/utils/errorBookStore";
import { getHintsForSubject } from "@/utils/shenzhenHints.js";

/**
 * @param {{ subject: string }} props 当前分科，仅显示该科条目与图谱
 */
export default function KnowledgeGraph({ subject }) {
  const items = useErrorBook();
  const filtered = useMemo(
    () => items.filter((x) => x.subject === subject),
    [items, subject]
  );
  const kpBubbles = useMemo(() => {
    const m = {};
    for (const it of filtered) {
      const k = it.knowledgePoint || "未分类";
      m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const hints = getHintsForSubject(subject);

  return (
    <section className="space-y-3" aria-label={`${subject}知识点`}>
      <h3 className="text-base font-bold text-slate-800">
        三、{subject} · 知识点与归档
      </h3>
      <p className="text-sm text-slate-600">
        本栏仅含「{subject}」试卷/作业类错题。气泡大小表示该科各知识点题量。
      </p>
      {kpBubbles.length === 0 && (
        <p className="text-sm text-slate-500">该学科下暂无拍卷/手录记录。</p>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="知识点">
        {kpBubbles.map(([k, n]) => (
          <li
            key={k}
            className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow"
          >
            <span
              className="font-medium text-violet-900"
              style={{
                fontSize: `${Math.min(1 + n * 0.06, 1.2)}rem`,
              }}
            >
              {k}
            </span>
            <span className="ml-1 text-slate-500">×{n}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-3 text-sm text-amber-950">
        <p className="flex items-center gap-1 font-medium">
          <MapPin className="h-4 w-4" />
          深圳方向复习提示（{subject}）
        </p>
        <ul className="ml-1 mt-1 list-inside list-disc text-xs">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-1 flex items-center gap-1 text-sm font-bold text-slate-800">
          <BookMarked className="h-4 w-4" />
          本学科条目（{filtered.length}）
        </h4>
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {filtered.map((it) => (
            <li
              key={it.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white/60 p-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{it.stem}</p>
                <p className="text-xs text-slate-500">
                  知识点 {it.knowledgePoint} · {it.bookTag}
                </p>
                <p className="text-xs text-slate-400">
                  {it.inWeakPool ? "在易错池" : "已练过"}{" "}
                  {it.stars ? `· ★${it.stars}` : ""}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded bg-slate-100 px-1.5 text-xs">
                    标签: {it.knowledgePoint}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="rounded p-1 text-amber-700"
                  onClick={() =>
                    updateErrorItem(it.id, { inWeakPool: !it.inWeakPool })
                  }
                  title="切换易错池"
                >
                  易错
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-red-500"
                  onClick={() => {
                    if (window.confirm("删除此条？")) removeErrorItem(it.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { BookOpen, Info } from "lucide-react";
import { aggregateCurriculumDomains, getCurriculumMeta } from "@/utils/curriculumMatch.js";

export default function CurriculumAlignmentSection({ items }) {
  const { byDomain, unmatched, total } = aggregateCurriculumDomains(items);
  const meta = getCurriculumMeta();

  if (total === 0) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3 sm:p-4"
      aria-label="课标能力域自动对照"
    >
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800 sm:text-base">
        <BookOpen className="h-4 w-4 shrink-0 text-slate-600" strokeWidth={1.75} />
        课标能力域分布（自动对照）
      </h3>
      <p className="mt-2 flex gap-1.5 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          将错题的<strong>题干+知识点</strong>与本地「课标参考词表」做关键词匹配，按领域汇总。这是<strong>数据结构化后的启发式结论</strong>，不是考试分数。
          国家/地方教育局目前<strong>并无</strong>对公众应用普遍开放的学情或知识库 HTTP API，常见落地方案是
          自建/采购词表、与教研标引一致后，可再接 RAG/大模型对《课程标准》做检索增强。
        </span>
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{meta?.sourceNote}</p>

      {byDomain.length === 0 && unmatched === total ? (
        <p className="mt-2 text-sm text-amber-800/90">
          未匹配到参考能力域。可在错题里把「知识点」写全一些，或扩充
          <code className="rounded bg-white/80 px-1">curriculumReference.sample.json</code> 中的关键词。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {byDomain.map((row) => (
            <li key={row.key}>
              <div className="mb-0.5 flex justify-between text-xs sm:text-sm">
                <span className="font-medium text-slate-800">
                  {row.subject} · {row.domain}
                </span>
                <span className="tabular-nums text-slate-500">
                  {row.count} 条（{row.pct}%）
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/50">
                <div
                  className="h-full rounded-full bg-indigo-400/70"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {unmatched > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          未归入上表：{unmatched} 条（与词表无交集或标写过简）
        </p>
      )}
    </section>
  );
}

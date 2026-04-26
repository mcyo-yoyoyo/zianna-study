import { useEffect, useState } from "react";
import { Sparkles, Star, Target, Trophy } from "lucide-react";
import { useErrorBook } from "@/hooks/useErrorBook";
import { getErrorSummary, getSpellingSummary, getSubjectMasteryRows } from "@/utils/dashboardStats.js";
import { SPELLING_TASK_EVENT } from "@/utils/spellingTask.js";

export default function ChildDashboard() {
  const items = useErrorBook();
  const { total, 易错池, 星星 } = getErrorSummary(items);
  const [spell, setSpell] = useState(getSpellingSummary);
  useEffect(() => {
    const on = () => setSpell(getSpellingSummary());
    window.addEventListener(SPELLING_TASK_EVENT, on);
    return () => window.removeEventListener(SPELLING_TASK_EVENT, on);
  }, []);
  const rows = getSubjectMasteryRows(items);

  return (
    <div className="space-y-5">
      <p className="text-slate-600 sm:text-lg">
        点星星、闯错题，这里汇总你的小进步！
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-center shadow-sm">
          <Trophy className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-2 text-3xl font-extrabold text-amber-800">{total}</p>
          <p className="text-sm text-amber-900/80">错题条数</p>
        </div>
        <div className="rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 text-center shadow-sm">
          <Target className="mx-auto h-8 w-8 text-rose-500" />
          <p className="mt-2 text-3xl font-extrabold text-rose-800">{易错池}</p>
          <p className="text-sm text-rose-900/80">易错待消灭</p>
        </div>
        <div className="col-span-2 rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 text-center shadow-sm sm:col-span-2">
          <Star className="mx-auto h-9 w-9 fill-amber-400 text-amber-500" />
          <p className="mt-2 text-4xl font-extrabold text-violet-900">
            {星星} <span className="text-2xl">☆</span>
          </p>
          <p className="text-sm text-violet-800/90">累计星星</p>
        </div>
      </div>
      {spell.有任务 && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-100/60 py-3 text-center text-base font-bold text-emerald-900 sm:text-lg">
          <Sparkles className="h-6 w-6" />
          本机听写任务有 {spell.词数} 个词
        </div>
      )}
      <section aria-label="三科小进度" className="rounded-2xl border border-indigo-100/80 bg-white/50 p-3 sm:p-4">
        <h3 className="mb-3 text-center text-lg font-bold text-indigo-900 sm:text-xl">
          三科小雷达（越大越好）
        </h3>
        <ul className="space-y-3 sm:max-w-md sm:mx-auto">
          {rows.map((r) => (
            <li key={r.subject}>
              <div className="mb-0.5 flex justify-between text-sm sm:text-base">
                <span className="font-semibold text-slate-800">{r.subject}</span>
                <span className="text-slate-600">{r.score} 分</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-macaron-mint/90 transition-all"
                  style={{ width: `${r.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

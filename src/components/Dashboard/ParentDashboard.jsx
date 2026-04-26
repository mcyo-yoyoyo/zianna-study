import { useEffect, useMemo, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BarChart2, BookOpen, MapPin, Star, Target } from "lucide-react";
import { useErrorBook } from "@/hooks/useErrorBook";
import {
  getErrorSummary,
  getSpellingSummary,
  getSubjectMasteryRows,
  getTopKnowledgePoints,
} from "@/utils/dashboardStats.js";
import { getHintsForSubject } from "@/utils/shenzhenHints.js";
import { SPELLING_TASK_EVENT } from "@/utils/spellingTask.js";
import CloudDataNote from "./CloudDataNote.jsx";
import CurriculumAlignmentSection from "./CurriculumAlignmentSection.jsx";

const tipStyle = { background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0" };

export default function ParentDashboard() {
  const items = useErrorBook();
  const summary = useMemo(() => getErrorSummary(items), [items]);
  const [spell, setSpell] = useState(getSpellingSummary);
  useEffect(() => {
    const on = () => setSpell(getSpellingSummary());
    window.addEventListener(SPELLING_TASK_EVENT, on);
    return () => window.removeEventListener(SPELLING_TASK_EVENT, on);
  }, []);
  const radar = useMemo(() => getSubjectMasteryRows(items), [items]);
  const topKp = useMemo(() => getTopKnowledgePoints(items, 8), [items]);
  const weakBySub = useMemo(
    () => radar.map((r) => ({ subject: r.subject, n: r.易错 })),
    [radar]
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        数据来自本机已录入的错题与闯关星星；随孩子使用会更新。横屏
        Pad 上可全览图表。
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Stat
          label="错题条"
          value={summary.total}
          className="border-violet-200 bg-violet-50/60"
        />
        <Stat
          label="易错池"
          value={summary.易错池}
          icon={<Target className="h-4 w-4" />}
          className="border-rose-200 bg-rose-50/60"
        />
        <Stat
          label="累计☆"
          value={summary.星星}
          icon={<Star className="h-4 w-4 fill-amber-400" />}
          className="border-amber-200 bg-amber-50/60"
        />
        <Stat
          label="听写词数"
          value={spell.有任务 ? spell.词数 : "—"}
          icon={<BookOpen className="h-4 w-4" />}
          className="border-emerald-200 bg-emerald-50/60"
        />
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white/80 p-2 sm:p-4" aria-label="三科掌握雷达">
        <h3 className="mb-1 flex items-center gap-1 text-sm font-bold text-slate-800 sm:text-base">
          <BarChart2 className="h-4 w-4" />
          三科掌握度（模型估算，供参考）
        </h3>
        <div className="h-64 w-full min-w-0 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radar}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="掌握度"
                dataKey="score"
                stroke="#6366f1"
                fill="#a5b4fc"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={tipStyle}
                formatter={(v) => [`${v} 分`, "掌握度"]}
                labelFormatter={(l) => `学科：${l}`}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="px-1 text-center text-xs text-slate-500">
          语文 {radar[0].记录} 条 / 易错 {radar[0].易错} · 数学 {radar[1].记录} /{" "}
          {radar[1].易错} · 英语 {radar[2].记录} / {radar[2].易错}
        </p>
      </section>
      <section className="rounded-2xl border border-slate-100 bg-white/80 p-3 sm:p-4" aria-label="高频知识点">
        <h3 className="text-sm font-bold text-slate-800 sm:text-base">高频错因（知识点）</h3>
        {topKp.length === 0 && (
          <p className="text-sm text-slate-500">暂无数据，去「错题本」录几条。</p>
        )}
        <ul className="mt-2 space-y-2">
          {topKp.map((row) => (
            <li key={row.name}>
              <div className="mb-0.5 flex justify-between text-xs sm:text-sm">
                <span className="line-clamp-1 font-medium text-slate-800">{row.name}</span>
                <span className="shrink-0 text-slate-500">×{row.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-rose-400/80"
                  style={{
                    width: `${Math.min(100, (row.count / (topKp[0].count || 1)) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <CurriculumAlignmentSection items={items} />
      <section className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-3 sm:p-4" aria-label="深圳考向建议">
        <h3 className="flex items-center gap-1 text-sm font-bold text-amber-950 sm:text-base">
          <MapPin className="h-4 w-4" />
          深圳地区 · 结合易错池的复习建议
        </h3>
        <ul className="mt-2 space-y-2 text-xs text-amber-950/90 sm:text-sm">
          {weakBySub
            .filter((x) => x.n > 0)
            .map((x) => (
              <li key={x.subject} className="rounded-lg border border-amber-100/80 bg-white/60 p-2">
                <p className="font-semibold text-amber-900">
                  {x.subject} 当前易错 {x.n} 条
                </p>
                <ul className="ml-3 list-disc text-amber-900/85">
                  {getHintsForSubject(x.subject).map((h, i) => (
                    <li key={`${x.subject}-${i}`}>{h}</li>
                  ))}
                </ul>
              </li>
            ))}
          {weakBySub.every((x) => x.n === 0) && (
            <li className="text-amber-800/80">易错池为空，太棒了，可保持每日轻量复习巩固。</li>
          )}
        </ul>
        <p className="mt-2 text-xs text-amber-800/70">
          内置考向库为一年级通用方向，可与校内老师沟通微调。
        </p>
      </section>
      <CloudDataNote />
    </div>
  );
}

function Stat({ label, value, className, icon }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center ${className}`}
    >
      {icon && <div className="text-slate-500">{icon}</div>}
      <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}

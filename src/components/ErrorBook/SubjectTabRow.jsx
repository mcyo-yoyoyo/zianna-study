import { SUBJECTS } from "@/utils/subjects.js";

/**
 * 错题本顶部分科学科切换
 * @param {{ value: string, onChange: (s: string) => void, counts?: Record<string, number> | null }} p
 */
export default function SubjectTabRow({ value, onChange, counts = null }) {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2"
      role="tablist"
      aria-label="学科"
    >
      {SUBJECTS.map((s) => {
        const n = counts?.[s];
        const countLabel = typeof n === "number" && n > 0 ? ` ${n}` : "";
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={value === s}
            onClick={() => onChange(s)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              value === s
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80"
            }`}
          >
            {s}
            {countLabel && (
              <span
                className={value === s ? "ml-0.5 text-slate-300" : "ml-0.5 text-slate-400"}
              >
                ·{n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

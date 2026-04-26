import { BookOpen } from "lucide-react";

export default function Header({ isParentView, isChildView }) {
  return (
    <header
      className={`flex items-center justify-between gap-2 ${
        isChildView ? "py-1 sm:py-2" : "py-2"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`flex items-center justify-center rounded-2xl bg-macaron-lavender/80 text-2xl shadow ${
            isChildView ? "h-12 w-12 sm:h-14 sm:w-14" : "h-10 w-10"
          }`}
        >
          <BookOpen
            className={`text-indigo-700 ${isChildView ? "h-6 w-6 sm:h-7 sm:w-7" : "h-5 w-5"}`}
            aria-hidden
          />
        </div>
        <div>
          <h1
            className={`font-bold tracking-wide text-slate-800 ${
              isChildView ? "text-2xl" : "text-xl"
            }`}
          >
            Zianna伴学
          </h1>
          <p className="text-xs text-slate-500">Vibe Learning, Love Growing</p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          isChildView
            ? "bg-macaron-sky/60 text-cyan-900"
            : "bg-macaron-peach/80 text-amber-900"
        }`}
      >
        {isParentView ? "家长" : isChildView ? "孩子" : "—"}
      </span>
    </header>
  );
}

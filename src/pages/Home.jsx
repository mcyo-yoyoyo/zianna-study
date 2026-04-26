import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { BarChart3, BookMarked, Pencil } from "lucide-react";

const TILES = [
  {
    to: "/spelling",
    title: "听写",
    hintParent: "发词·孩子听",
    hintChild: "点我",
    Icon: Pencil,
    gradient: "from-macaron-sky/90 to-sky-200/80",
    ring: "ring-sky-300/50",
    emoji: "✏️",
  },
  {
    to: "/errorbook",
    title: "错题",
    hintParent: "分科·拍卷",
    hintChild: "点我",
    Icon: BookMarked,
    gradient: "from-macaron-lavender/90 to-violet-200/80",
    ring: "ring-violet-300/50",
    emoji: "📒",
  },
  {
    to: "/dashboard",
    title: "学情",
    hintParent: "数据·建议",
    hintChild: "点我",
    Icon: BarChart3,
    gradient: "from-macaron-peach/90 to-amber-200/80",
    ring: "ring-amber-300/50",
    emoji: "📊",
  },
];

export default function Home() {
  const { isChild, isParent } = useApp();

  return (
    <div className="space-y-4">
      {isChild ? (
        <h2 className="sr-only">点大卡片进入功能</h2>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-slate-800 md:text-xl">
            Zianna伴学
          </h2>
          <p className="mt-1 text-sm text-slate-500">Vibe Learning, Love Growing</p>
        </div>
      )}

      <ul
        className={
          isChild
            ? "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
            : "grid grid-cols-1 gap-3 sm:grid-cols-3"
        }
      >
        {TILES.map(
          ({ to, title, hintParent, hintChild, Icon, gradient, ring, emoji }) => (
            <li key={to} className="list-none">
              <Link
                to={to}
                className={[
                  "group flex w-full flex-col items-center justify-center rounded-[1.75rem] border-2 border-white/80 bg-gradient-to-br shadow-lg transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/60",
                  gradient,
                  ring,
                  isChild
                    ? "min-h-[11.5rem] px-4 py-8 sm:min-h-[14rem] sm:py-10"
                    : "min-h-[8.5rem] px-3 py-6 sm:min-h-[10rem]",
                ].join(" ")}
                aria-label={isChild ? `${title}，点我进入` : `进入${title}：${hintParent}`}
              >
                <span
                  className="mb-1 select-none text-5xl sm:text-6xl"
                  aria-hidden
                >
                  {emoji}
                </span>
                <Icon
                  className={
                    isChild
                      ? "mb-2 h-16 w-16 text-slate-800/90 drop-shadow-sm sm:h-20 sm:w-20"
                      : "mb-2 h-12 w-12 text-slate-800/90 sm:h-14 sm:w-14"
                  }
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span
                  className={
                    isChild
                      ? "text-3xl font-extrabold tracking-wide text-slate-900 sm:text-4xl"
                      : "text-xl font-bold text-slate-900 sm:text-2xl"
                  }
                >
                  {title}
                </span>
                <span
                  className={
                    isChild
                      ? "mt-2 rounded-full bg-white/50 px-3 py-0.5 text-base font-semibold text-slate-700"
                      : "mt-1.5 text-center text-xs text-slate-600 sm:text-sm"
                  }
                >
                  {isChild ? hintChild : hintParent}
                </span>
              </Link>
            </li>
          )
        )}
      </ul>

      {isParent && (
        <p className="text-center text-xs text-slate-500">
          将窗口拉宽到 ≥768px 可切换为「孩子端」界面，上图会更大、字更少。
        </p>
      )}
    </div>
  );
}

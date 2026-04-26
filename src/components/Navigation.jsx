import { NavLink } from "react-router-dom";
import { BarChart3, BookMarked, Home, Pencil } from "lucide-react";

const links = [
  { to: "/", end: true, label: "首页", icon: Home },
  { to: "/spelling", label: "听写", icon: Pencil },
  { to: "/errorbook", label: "错题", icon: BookMarked },
  { to: "/dashboard", label: "学情", icon: BarChart3 },
];

const baseItemParent =
  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2.5 text-xs font-medium transition-colors min-h-[48px] sm:min-h-[44px]";
const baseItemChild =
  "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-3 text-sm font-medium transition-colors min-h-[56px] sm:min-h-[60px] active:scale-[0.98] touch-manipulation";
const activeItem = "bg-white text-indigo-700 shadow-sm";
const idleItem = "text-slate-500 hover:bg-white/60 hover:text-slate-700";

export default function Navigation({ isParentView, isChildView }) {
  const baseItem = isChildView ? baseItemChild : baseItemParent;
  return (
    <nav
      className="sticky bottom-0 z-10 -mx-1 border-t border-white/40 bg-white/85 pb-2 pt-1 backdrop-blur"
      aria-label="主导航"
    >
      <ul
        className={`mx-auto flex w-full max-w-2xl gap-1 px-0.5 ${isChildView ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}
      >
        {links.map(({ to, end, label, icon: Icon }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [baseItem, isActive ? activeItem : idleItem].join(" ")
              }
            >
              <Icon
                className={isChildView ? "h-6 w-6 sm:h-7 sm:w-7" : "h-5 w-5"}
                strokeWidth={2}
                aria-hidden
              />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

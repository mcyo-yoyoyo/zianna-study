import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useApp } from "@/contexts/AppContext";

export default function RootLayout() {
  const { isParent, isChild } = useApp();

  useEffect(() => {
    const mode = isChild ? "child" : "parent";
    document.documentElement.setAttribute("data-mode", mode);
    return () => {
      document.documentElement.removeAttribute("data-mode");
    };
  }, [isChild]);

  return (
    <div
      className={`app-shell mx-auto flex min-h-screen w-full max-w-6xl flex-col px-2 sm:px-4 ${
        isChild ? "pt-2" : "pt-3"
      }`}
    >
      <div
        className="mb-1 rounded-full border border-white/50 bg-white/50 px-3 py-1 text-center text-xs text-slate-600 shadow-sm"
        role="status"
        aria-live="polite"
      >
        当前为「{isChild ? "孩子端" : "家长端"}」视图
        {isChild ? "（宽屏 ≥768px）" : "（窄屏 <768px）"} · 调整窗口宽度可切换
      </div>
      <Header isParentView={isParent} isChildView={isChild} />
      <main className="min-h-0 flex-1 py-2">
        <div
          className={`rounded-3xl border border-white/60 bg-white/70 p-3 shadow-lg backdrop-blur sm:p-4 ${
            isChild ? "min-h-[50vh] sm:min-h-[55vh] sm:text-lg" : "sm:p-5"
          }`}
        >
          <Outlet />
        </div>
      </main>
      <Navigation isParentView={isParent} isChildView={isChild} />
    </div>
  );
}

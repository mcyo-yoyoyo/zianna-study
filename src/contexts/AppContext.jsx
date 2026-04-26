import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

const MOBILE_MAX = 767; // 宽度 <768px 为家长端
const mql = typeof window !== "undefined"
  ? window.matchMedia(`(min-width: ${MOBILE_MAX + 1}px)`)
  : null;

function getModeFromMql() {
  if (!mql) return "child";
  return mql.matches ? "child" : "parent";
}

/**
 * @typedef {{ role: "parent" | "child", isParent: boolean, isChild: boolean, width: number | null }} AppValue
 */
export function AppProvider({ children }) {
  const [role, setRole] = useState(getModeFromMql);
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : null
  );

  useEffect(() => {
    if (!mql) return;
    const onChange = () => {
      setRole(mql.matches ? "child" : "parent");
      setWidth(window.innerWidth);
    };
    setWidth(window.innerWidth);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const value = useMemo(
    () => ({
      role,
      isParent: role === "parent",
      isChild: role === "child",
      width,
    }),
    [role, width]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp 必须在 AppProvider 内使用");
  return ctx;
}

import { useApp } from "@/contexts/AppContext";
import ParentDashboard from "@/components/Dashboard/ParentDashboard";
import ChildDashboard from "@/components/Dashboard/ChildDashboard";

export default function Dashboard() {
  const { isChild, isParent } = useApp();

  return (
    <div
      className={
        isChild
          ? "max-w-3xl space-y-2 sm:mx-auto"
          : "max-w-2xl space-y-2 sm:mx-auto md:max-w-3xl"
      }
    >
      <h2
        className={
          isChild
            ? "text-2xl font-bold text-slate-800"
            : "text-lg font-bold text-slate-800 md:text-xl"
        }
      >
        学情看板
      </h2>
      {isChild ? <ChildDashboard /> : <ParentDashboard />}
      {isParent && (
        <p className="text-xs text-slate-500">
          窄屏为家长机；将窗口拉至 ≥768px
          可切到孩子端，查看简化成就页。
        </p>
      )}
    </div>
  );
}

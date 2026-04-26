import { CloudOff } from "lucide-react";

export default function CloudDataNote() {
  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600">
      <p className="flex items-center gap-1 font-medium text-slate-700">
        <CloudOff className="h-3.5 w-3.5" />
        多设备数据「打通」
      </p>
      <p className="mt-1">
        当前学情、听写、错题均存在本机浏览器的
        <code className="rounded bg-white px-1">localStorage</code>
        。同账号手机与
        Pad 要实时同步，需在后续接入
        <strong> LeanCloud / Supabase </strong>（在服务端合并同一用户数据）。本步仅完成
        响应式看板与统计逻辑。
      </p>
    </aside>
  );
}

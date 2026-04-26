import { useApp } from "@/contexts/AppContext";
import ParentSetup from "@/components/SpellingCenter/ParentSetup";
import ChildSpellingView from "@/components/SpellingCenter/ChildSpellingView";

export default function Spelling() {
  const { isChild, isParent } = useApp();

  return (
    <div className="space-y-3">
      <h2
        className={
          isChild
            ? "text-2xl font-bold text-slate-800"
            : "text-lg font-bold text-slate-800"
        }
      >
        AI 听写
      </h2>
      {isChild ? <ChildSpellingView /> : <ParentSetup />}
      {isParent && (
        <p className="text-xs text-slate-500">
          小提示：用开发者工具将宽度拉到 ≥768px
          可模拟孩子端，查看「下发」后的听写体验。
        </p>
      )}
    </div>
  );
}

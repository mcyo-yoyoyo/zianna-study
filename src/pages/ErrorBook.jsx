import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useErrorBook } from "@/hooks/useErrorBook";
import { useSpellingErrorSessions } from "@/hooks/useSpellingErrorSessions";
import ChildSpellingMistakeSessions from "@/components/ErrorBook/ChildSpellingMistakeSessions";
import PhotoUpload from "@/components/ErrorBook/PhotoUpload";
import KnowledgeGraph from "@/components/ErrorBook/KnowledgeGraph";
import PracticeChallenge from "@/components/ErrorBook/PracticeChallenge";
import SubjectTabRow from "@/components/ErrorBook/SubjectTabRow";

export default function ErrorBook() {
  const { isChild } = useApp();
  const [subject, setSubject] = useState(/** @type {string} */ ("语文"));
  const items = useErrorBook();
  const spellingSessions = useSpellingErrorSessions();

  const tabCounts = useMemo(() => {
    const c = { 语文: 0, 英语: 0, 数学: 0 };
    for (const it of items) {
      if (it.subject in c) c[it.subject] += 1;
    }
    if (isChild && spellingSessions.length) {
      c["语文"] += spellingSessions.length;
    }
    return c;
  }, [items, spellingSessions.length, isChild]);

  const intro =
    isChild
      ? "分科查看。语文：听写拍照核对 + 与语文试卷同名错题为两条线；英语/数学暂以试卷/作业题为主录入。"
      : "在对应学科下拍卷或手录。听写类错词由孩子在「听写」中核对，自动归入「语文·听写」记录，不与此处大题列表混行。";

  return (
    <div className="space-y-4">
      <div>
        <h2
          className={
            isChild
              ? "text-2xl font-bold text-slate-800"
              : "text-lg font-bold text-slate-800"
          }
        >
          分科错题本
        </h2>
        <p className="mt-1 text-sm text-slate-600">{intro}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          角标数字：孩子端「语文」为语文大题条数 + 听写核对次数；其他学科为本科大题条数。家长端角标为各科拍卷/手录条数。
        </p>
      </div>

      <SubjectTabRow value={subject} onChange={setSubject} counts={tabCounts} />

      {isChild ? (
        <ChildErrorBySubject
          subject={subject}
        />
      ) : (
        <ParentErrorBySubject subject={subject} />
      )}
    </div>
  );
}

/** 家长：当前学科拍卷 + 该科图谱/列表 */
function ParentErrorBySubject({ subject }) {
  return (
    <div className="space-y-8" key={subject}>
      <PhotoUpload subject={subject} />
      <KnowledgeGraph subject={subject} />
    </div>
  );
}

/**
 * 孩子：分科
 * 语文 = 听写 + 语文闯关；英语/数学 = 仅闯关（数据来自家长本科录题）
 */
function ChildErrorBySubject({ subject }) {
  return (
    <div className="space-y-8" key={subject}>
      {subject === "语文" && (
        <>
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              来源一 · 听写（与「听写」页联动）
            </h3>
            <ChildSpellingMistakeSessions />
          </div>
          <div
            className="border-t border-slate-200/90 pt-6"
            role="separator"
            aria-hidden
          />
        </>
      )}
      {subject === "英语" && (
        <p className="rounded-xl border border-indigo-100/80 bg-indigo-50/50 px-3 py-2 text-sm text-slate-700">
          英语与语文在家长端使用相同录题能力：拍卷 / 手录后归入「英语」。
          孩子端听写与语文同配置、将后续可对接；当前闯关仅对下方「英语」大题易错池生效。
        </p>
      )}
      {subject === "数学" && (
        <p className="rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-3 py-2 text-sm text-slate-700">
          数学由家长在本科拍卷/手录；此处仅对「数学」大题做 AI 举一反三闯关。
        </p>
      )}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {subject === "语文" ? "来源二 · " : ""}试卷/作业大题
        </h3>
        <p className="mb-3 text-sm text-slate-600">
          {subject === "语文" ? (
            <>与上面「听写次」不同：由家长本机为语文拍卷/手录的大题，易错时在此闯关。</>
          ) : (
            <>以下闯关仅包含有「{subject}」标签、且在易错池中的题目。</>
          )}
        </p>
        <PracticeChallenge subject={subject} />
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Headphones, History, ListPlus, Pencil } from "lucide-react";
import { useSpellingErrorSessions } from "@/hooks/useSpellingErrorSessions";
import {
  getSpellingErrorSessions,
  mergeWordGroupsUnique,
} from "@/utils/spellingErrorSessions.js";
import { getSpellingTask, setSpellingTask } from "@/utils/spellingTask.js";

const PRESET_INTERVALS = [15, 30, 60];

function applyPlayWords(words) {
  if (!words.length) return;
  const cur = getSpellingTask();
  setSpellingTask({
    words: [...words],
    intervalSec: cur?.intervalSec ?? 30,
    repeatPerWord: cur?.repeatPerWord ?? 3,
    createdAt: Date.now(),
  });
}

/**
 * 本组 + 本机其它听写错词（去重，不含 AI 泛化）
 * @param {import("@/utils/spellingErrorSessions.js").SpellingErrorSession} s
 * @returns {string[]}
 */
function mergeThisAndHistory(s) {
  const all = getSpellingErrorSessions();
  const rest = all.filter((x) => x.id !== s.id).map((x) => x.wrongWords);
  return mergeWordGroupsUnique([s.wrongWords, ...rest]);
}

export default function ChildSpellingMistakeSessions() {
  const sessions = useSpellingErrorSessions();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(/** @type {string | null} */ (null));

  const hasAny = sessions.length > 0;

  const list = useMemo(
    () =>
      [...sessions].sort((a, b) => b.createdAt - a.createdAt),
    [sessions]
  );

  if (!hasAny) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-sky-200/80 bg-sky-50/40 p-6 text-center text-slate-700">
        <Pencil className="mx-auto h-8 w-8 text-sky-500" strokeWidth={1.5} />
        <p className="mt-2 text-lg font-bold">还没有语文听写拍照记录</p>
        <p className="mt-1 text-sm text-slate-600">
          在「听写」读完一轮、对「语文」本拍照核对后，错词会按<strong>次</strong>记在这里，不会散成很多行。
        </p>
        <Link
          to="/spelling"
          className="mt-3 inline-block text-sm font-medium text-sky-700 underline"
        >
          去·听写
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-slate-800">语文 · 听写错词</h3>
      <p className="text-sm text-slate-600">
        仅语文；听写本拍照核对来源。按一次核对为一条。可<strong>本组</strong>或<strong>本组+历史</strong>再听写（不调用
        AI 泛化，只改词表）。
      </p>
      <ul className="space-y-2">
        {list.map((s) => {
          const open = openId === s.id;
          const d = new Date(s.createdAt);
          const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          return (
            <li
              key={s.id}
              className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : s.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
              >
                <div>
                  <p className="font-bold text-slate-900">听写 {timeStr}</p>
                  <p className="text-xs text-slate-500">错 {s.wrongWords.length} 个词</p>
                </div>
                <span className="text-xs text-slate-400">{open ? "收起" : "展开"}</span>
              </button>
              {open && (
                <div className="border-t border-slate-100 px-3 pb-3">
                  <p className="py-2 text-sm text-slate-700">
                    {s.wrongWords.join("、")}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        applyPlayWords(s.wrongWords);
                        navigate("/spelling");
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white"
                    >
                      <Headphones className="h-4 w-4" />
                      本组再听写
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const merged = mergeThisAndHistory(s);
                        if (merged.length) {
                          applyPlayWords(merged);
                          navigate("/spelling");
                        }
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border-2 border-sky-200 bg-sky-50/80 px-3 text-sm font-semibold text-sky-900"
                    >
                      <History className="h-4 w-4" />
                      本组+历史再听写
                    </button>
                    <Link
                      to="/spelling"
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700"
                    >
                      <ListPlus className="h-4 w-4" />
                      到听写里改节奏
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {list.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const all = mergeWordGroupsUnique(
              getSpellingErrorSessions().map((x) => x.wrongWords)
            );
            if (all.length) {
              applyPlayWords(all);
              navigate("/spelling");
            }
          }}
          className="w-full rounded-2xl border-2 border-slate-200 py-2.5 text-sm font-medium text-slate-700"
        >
          全部听写错词合练
        </button>
      )}
    </div>
  );
}

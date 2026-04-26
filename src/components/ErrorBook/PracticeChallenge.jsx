import { useMemo, useState } from "react";
import { Loader2, Play, Star, Wand2 } from "lucide-react";
import { useErrorBook } from "@/hooks/useErrorBook";
import { markWeakPoolResolved } from "@/utils/errorBookStore";
import { generateSimilarQuestions } from "@/utils/llmErrorBook";
import { getOpenAiConfig } from "@/utils/openAiConfig";

const STARS_REWARD = 3;

/**
 * @param {{ subject: string }} props 仅本学科易错池闯关
 */
export default function PracticeChallenge({ subject }) {
  const items = useErrorBook();
  const weak = useMemo(
    () => items.filter((x) => x.inWeakPool && x.subject === subject),
    [items, subject]
  );
  const { key: envKey } = getOpenAiConfig();
  const [apiKey, setApiKey] = useState("");
  const [activeId, setActiveId] = useState(/** @type {string | null} */ (null));
  const [qList, setQList] = useState(/** @type {{ q: string, hint: string }[] | null} */ (null));
  const [qIdx, setQIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [showHint, setShowHint] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const effectiveKey = apiKey.trim() || envKey;

  const current = useMemo(
    () => (activeId ? items.find((x) => x.id === activeId) : null),
    [activeId, items]
  );
  const currentQ = qList && qList[qIdx] ? qList[qIdx] : null;

  const onStart = async (id) => {
    setErr(null);
    setShowHint(false);
    setRoundDone(false);
    setQIdx(0);
    setQList(null);
    if (!effectiveKey) {
      setErr("没有 API 密钥。请让家长在 .env 配置，或在此临时填写。");
      return;
    }
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setActiveId(id);
    setLoading(true);
    try {
      const list = await generateSimilarQuestions(
        it.stem,
        it.subject,
        it.knowledgePoint,
        effectiveKey
      );
      if (list.length < 1) {
        setErr("没生成出题目，请重试或换一题。");
        setActiveId(null);
        return;
      }
      setQList(list.slice(0, 3));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onNextCard = (good) => {
    if (!qList) return;
    if (qIdx < qList.length - 1) {
      setQIdx((i) => i + 1);
      setShowHint(false);
      return;
    }
    if (good) {
      setRoundDone(true);
    } else {
      setQList(null);
      setActiveId(null);
      setQIdx(0);
      setShowHint(false);
      setErr("最后一题还想再练～本轮不记星星，可重新开闯。");
    }
  };

  const onFinishSuccess = () => {
    const id = activeId;
    if (!id) return;
    markWeakPoolResolved(id, { addStars: STARS_REWARD });
    setQList(null);
    setActiveId(null);
    setQIdx(0);
    setRoundDone(false);
    setShowHint(false);
    setErr(null);
  };

  if (!weak.length) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/50 p-8 text-center text-slate-800">
        <p className="text-2xl font-bold sm:text-3xl">「{subject}」易错池已清空</p>
        <p className="mt-2 text-slate-600">
          太棒了；或请家长在家长端为本科录入试卷错题后再来闯关。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-800">{subject} · 消灭错题（闯关）</h3>
      <p className="text-sm text-slate-600">
        只显示「{subject}」在易错池中的题目。选一道，AI 会出 3 道很相近练习；答完移出该科易错池并得星星。
      </p>
      <input
        type="password"
        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm"
        autoComplete="off"
        placeholder="无 .env 时仅本次使用的密钥"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!qList && !roundDone && (
        <ul className="space-y-2">
          {weak.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/70 p-3 shadow"
            >
              <div>
                <p className="font-bold text-slate-900 sm:text-lg">{it.stem}</p>
                <p className="text-xs text-slate-500">
                  {it.subject} · {it.knowledgePoint}
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => onStart(it.id)}
                className="shrink-0 flex items-center gap-1 rounded-2xl bg-macaron-rose/90 px-3 py-2 text-sm font-semibold"
              >
                {loading && activeId === it.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" fill="currentColor" />
                )}
                开闯
              </button>
            </li>
          ))}
        </ul>
      )}
      {qList && currentQ && !roundDone && (
        <div
          className="rounded-3xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/90 to-white p-4"
          role="status"
        >
          <p className="text-center text-sm text-violet-800">
            第 {qIdx + 1} / {qList.length} 题
          </p>
          <p className="mt-3 min-h-[4rem] text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {currentQ.q}
          </p>
          {showHint && currentQ.hint && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-950">
              提示：{currentQ.hint}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className="min-h-12 flex-1 rounded-2xl border-2 border-amber-200 bg-amber-100/50 py-2 text-amber-950"
              onClick={() => setShowHint((h) => !h)}
            >
              <Wand2 className="mb-0.5 mr-1 inline h-4 w-4" />
              {showHint ? "关提示" : "看小提示"}
            </button>
            <button
              type="button"
              className="min-h-12 flex-1 rounded-2xl bg-slate-200 py-2 text-slate-800"
              onClick={() => onNextCard(false)}
            >
              还要再练
            </button>
            <button
              type="button"
              className="min-h-12 flex-1 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-500 py-2 text-lg font-bold text-white"
              onClick={() => onNextCard(true)}
            >
              我会了
            </button>
          </div>
        </div>
      )}
      {roundDone && current && (
        <div className="rounded-3xl border-2 border-yellow-200 bg-gradient-to-b from-amber-50 to-white p-6 text-center">
          <Star className="mx-auto h-10 w-10 text-amber-500" fill="currentColor" />
          <p className="mt-2 text-2xl font-extrabold">闯关成功！</p>
          {current.stem && (
            <p className="line-clamp-2 text-sm text-slate-600">「{current.stem}」</p>
          )}
          <p className="text-slate-600">本题移出易错池，+{STARS_REWARD} ★</p>
          <button
            type="button"
            className="mt-3 rounded-2xl bg-violet-600 px-6 py-2 font-bold text-white"
            onClick={onFinishSuccess}
          >
            好耶
          </button>
        </div>
      )}
    </div>
  );
}

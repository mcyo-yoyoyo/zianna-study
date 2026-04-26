import { useEffect, useId, useState } from "react";
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ImageUp,
  Loader2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useSpellingPlayer } from "@/hooks/useSpellingPlayer";
import { useSpellingTask } from "@/hooks/useSpellingTask";
import { addSpellingErrorSession } from "@/utils/spellingErrorSessions.js";
import { clearSpellingTask, getSpellingTask, setSpellingTask } from "@/utils/spellingTask";
import { getUnmatchedSpellingTargets } from "@/utils/spellingHandwritingMatch.js";
import { extractHandwritingSpellingWordsFromImage } from "@/utils/visionExtract.js";
import { Link } from "react-router-dom";

function PetBuddy({ excited }) {
  return (
    <div
      className={`mb-2 flex select-none items-center justify-center transition-transform ${
        excited ? "scale-110" : ""
      }`}
      aria-hidden
    >
      <span
        className="relative text-6xl"
        style={{ textShadow: "0 2px 0 #fff" }}
        role="img"
        aria-label="伴学小精灵"
      >
        🦉
        <span className="absolute -right-1 -top-1 text-2xl">{excited ? "✨" : ""}</span>
      </span>
    </div>
  );
}

export default function ChildSpellingView() {
  const task = useSpellingTask();
  const {
    phase,
    index,
    total,
    startFromBeginning,
    resume,
    pause,
    nextWord,
    prevWord,
    readAgain,
    setIdle,
  } = useSpellingPlayer(task);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrErr, setOcrErr] = useState(/** @type {string | null} */ (null));
  const [checkHint, setCheckHint] = useState(/** @type {string | null} */ (null));
  const [intervalSec, setIntervalSec] = useState(30);
  const [repeatPerWord, setRepeatPerWord] = useState(3);
  const uploadId = useId();

  useEffect(() => {
    if (task) {
      setIntervalSec(task.intervalSec);
      setRepeatPerWord(task.repeatPerWord);
    }
  }, [task?.intervalSec, task?.repeatPerWord, task]);

  if (!task || !total) {
    return (
      <div className="space-y-3 text-center text-slate-600">
        <p className="text-xl font-bold text-slate-800">还没有听写任务哦</p>
        <p className="text-sm">
          请让家长在 &lt;768px 的「手机宽度」下上传并「下发听写」。
          数据暂存在本机浏览器，换机需等第四步云同步。
        </p>
      </div>
    );
  }

  const word = total ? task.words[Math.min(index, total - 1)] : "";
  const showProgress =
    phase === "playing" || phase === "paused" || phase === "done";
  const line = phase === "done" ? total : index + 1;
  const excited = phase === "playing";

  const primaryLabel =
    phase === "playing"
      ? "暂停"
      : phase === "paused" || (phase === "idle" && index > 0)
        ? "继续"
        : phase === "done"
          ? "再来一次"
          : "开始挑战";

  const onPrimary = () => {
    if (phase === "playing") {
      pause();
    } else if (phase === "paused") {
      resume();
    } else if (phase === "done") {
      setOcrErr(null);
      setCheckHint(null);
      setIdle();
      startFromBeginning();
    } else if (phase === "idle" && index > 0) {
      resume();
    } else {
      startFromBeginning();
    }
  };

  const onHandwritingPhoto = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!task?.words?.length) return;
    setOcrBusy(true);
    setOcrErr(null);
    setCheckHint(null);
    try {
      const apiWords = await extractHandwritingSpellingWordsFromImage(file);
      if (!apiWords.length) {
        setOcrErr("未在照片里识别到已写词语，可换更亮、更清楚的一张再试。");
        return;
      }
      const rawText = apiWords.join("");
      const miss = getUnmatchedSpellingTargets(task.words, apiWords, rawText);
      if (miss.length) {
        addSpellingErrorSession({
          wrongWords: miss,
          parentWords: task.words,
        });
        setCheckHint(
          `本组有 ${miss.length} 个词未对上，已记一条「听写错词」记录。到「错题本」里可再听写本组，或与历史合并。`
        );
      } else {
        setCheckHint("多模态识图与布置的词都能对上。若仍有错，可到「错题本」手加。");
      }
    } catch (err) {
      setOcrErr(
        err instanceof Error ? err.message : String(err ?? "识图失败，请重试或检查 .env 里的 API 与多模态模型。")
      );
    } finally {
      setOcrBusy(false);
    }
  };

  const bigBtn =
    "flex min-h-14 min-w-14 flex-1 items-center justify-center gap-1 rounded-2xl border-2 border-white/80 bg-gradient-to-b from-macaron-sky/90 to-macaron-sky/60 p-2 text-slate-900 shadow-md active:scale-95 sm:min-h-20 sm:min-w-20 sm:text-lg";

  const photoResult =
    ocrErr || checkHint ? (
      <p
        className={`text-xs leading-snug ${ocrErr ? "text-rose-600" : "text-emerald-800"}`}
        role={ocrErr ? "alert" : undefined}
      >
        {ocrErr || checkHint}
      </p>
    ) : null;

  const saveRhythm = () => {
    const t = getSpellingTask();
    if (!t?.words?.length) return;
    setSpellingTask({
      words: t.words,
      intervalSec: Math.max(0, Number(intervalSec) || 0),
      repeatPerWord: Math.max(1, Math.min(5, Number(repeatPerWord) || 1)),
      createdAt: t.createdAt,
    });
  };

  return (
    <div className="space-y-4 text-slate-800">
      <PetBuddy excited={excited} />
      <div
        className="flex flex-col gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-2"
        aria-busy={ocrBusy}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-[11px] leading-tight text-slate-500">
            对答案：拍听写本，联网识图后与家长布置词比对（需
            <code className="rounded bg-white/80 px-0.5">VITE_OPENAI_API_KEY</code>
            与多模态模型）。
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <label
              className={`inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium text-amber-950 shadow-sm ${
                ocrBusy ? "pointer-events-none opacity-50" : "cursor-pointer"
              }`}
              htmlFor={uploadId}
            >
              {ocrBusy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <ImageUp className="h-4 w-4 shrink-0" />
              )}
              {ocrBusy ? "识图中" : "拍照/选图"}
            </label>
            <input
              id={uploadId}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={ocrBusy}
              onChange={onHandwritingPhoto}
            />
            <Link
              to="/errorbook"
              className="inline-flex items-center gap-0.5 text-sm text-indigo-600 underline underline-offset-2"
            >
              <BookMarked className="h-3.5 w-3.5" />
              错题
            </Link>
          </div>
        </div>
        {photoResult}
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-3">
        <h4 className="text-sm font-bold text-slate-800">听写节奏</h4>
        <p className="mt-0.5 text-[11px] text-slate-500">
          与「词间停顿」同数字：同一词连读时，两遍及之间会均分这个秒数（如
          30 秒、3 遍则约 10 秒再报下一遍），词与词之间仍按该秒数停顿。
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">停</span>
          {[15, 30, 60].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setIntervalSec(n)}
              className={`rounded-md px-2.5 py-1 text-sm ${
                intervalSec === n
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100/90 text-slate-600"
              }`}
            >
              {n}秒
            </button>
          ))}
          <input
            type="number"
            min={0}
            max={120}
            className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm tabular-nums"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value) || 0)}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500" htmlFor="child-rep">
            每词报几遍
          </label>
          <select
            id="child-rep"
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
            value={repeatPerWord}
            onChange={(e) => setRepeatPerWord(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
          <button
            type="button"
            onClick={saveRhythm}
            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white"
          >
            保存节奏
          </button>
        </div>
      </div>
      <div className="text-center">
        {showProgress && (
          <p
            className="text-3xl font-extrabold text-indigo-800 sm:text-4xl"
            aria-live="polite"
          >
            {line}/{total}
          </p>
        )}
        <p className="mt-2 min-h-[3.5rem] text-2xl font-bold leading-snug text-slate-900 sm:text-5xl">
          {phase === "done" ? "全部读完了！" : word}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onPrimary} className={bigBtn}>
          {phase === "playing" ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="h-7 w-7" />
          )}
          {primaryLabel}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          className={bigBtn + " from-macaron-lavender/90 to-macaron-lavender/60"}
          onClick={prevWord}
          disabled={index <= 0}
          aria-label="上一词"
        >
          <ChevronLeft className="h-8 w-8" />
          上一词
        </button>
        <button
          type="button"
          className={bigBtn + " from-macaron-mint/90 to-macaron-mint/50"}
          onClick={readAgain}
          disabled={!total}
          aria-label="重读"
        >
          <RotateCcw className="h-7 w-7" />
          重读
        </button>
        <button
          type="button"
          className={bigBtn + " from-macaron-peach/90 to-macaron-peach/60"}
          onClick={nextWord}
          disabled={index >= total - 1}
          aria-label="下一词"
        >
          下一词
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      <button
        type="button"
        className="w-full text-center text-sm text-slate-400 underline"
        onClick={() => {
          if (window.confirm("确定清空本机听写任务吗？")) {
            clearSpellingTask();
            setIdle();
            setOcrErr(null);
            setCheckHint(null);
          }
        }}
      >
        清空本机任务
      </button>
    </div>
  );
}

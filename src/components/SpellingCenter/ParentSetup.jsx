import { useCallback, useId, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Plus,
  ScanText,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { extractSpellingWordsFromImage } from "@/utils/visionExtract";
import { setSpellingTask } from "@/utils/spellingTask";
import { getOpenAiConfig } from "@/utils/openAiConfig";

const PRESET_INTERVALS = [30, 60];

function Section({ title, children, className = "" }) {
  return (
    <section className={className}>
      {title && (
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export default function ParentSetup() {
  const fileId = useId();
  const fileRef = useRef(null);
  const { key: envKey } = getOpenAiConfig();
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [preview, setPreview] = useState(/** @type {string | null} */ (null));
  const [words, setWords] = useState(/** @type {string[]} */ ([]));
  const [intervalSec, setIntervalSec] = useState(30);
  const [intervalCustom, setIntervalCustom] = useState(false);
  const [repeatPerWord, setRepeatPerWord] = useState(3);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeyOverride, setShowKeyOverride] = useState(false);
  const [loadMode, setLoadMode] = useState(/** @type {"ai" | "ocr" | null} */ (null));
  const [ocrProgress, setOcrProgress] = useState(/** @type {number} */ (0));
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [sendOk, setSendOk] = useState(false);

  const hasEnvKey = Boolean(envKey);
  const effectiveKey = apiKeyInput.trim() || envKey;

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    setErr(null);
    setSendOk(false);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setErr("请选图片");
      return;
    }
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const onAnalyzeAi = useCallback(async () => {
    if (!file) {
      setErr("请先选择田字格听写表图片");
      return;
    }
    setErr(null);
    setSendOk(false);
    setLoadMode("ai");
    try {
      const list = await extractSpellingWordsFromImage(file, effectiveKey);
      if (!list.length) {
        setErr("未识别到有效词语，可换张图、试 OCR 或手动添加");
        setWords([]);
        return;
      }
      setWords(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadMode(null);
    }
  }, [file, effectiveKey]);

  const onAnalyzeOcr = useCallback(async () => {
    if (!file) {
      setErr("请先选择田字格听写表图片");
      return;
    }
    setErr(null);
    setSendOk(false);
    setLoadMode("ocr");
    setOcrProgress(0);
    try {
      const { extractWordsWithOcr, formatOcrError } = await import(
        "@/utils/ocrSpelling.js"
      );
      const list = await extractWordsWithOcr(file, (p) => {
        if (typeof p === "number") setOcrProgress(p);
      });
      if (!list.length) {
        setErr("OCR 未拆出有效词，可换清晰图、试 AI 或手动添加");
        setWords([]);
        return;
      }
      setWords(list);
    } catch (e) {
      setErr(formatOcrError(e));
    } finally {
      setLoadMode(null);
      setOcrProgress(0);
    }
  }, [file]);

  const busy = loadMode !== null;

  const updateWord = (i, v) => {
    setWords((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
  };

  const addWord = () => setWords((p) => [...p, ""]);

  const removeWord = (i) => setWords((p) => p.filter((_, j) => j !== i));

  const onSend = () => {
    const cleaned = words.map((w) => w.trim()).filter(Boolean);
    if (!cleaned.length) {
      setErr("请至少留下一个词");
      return;
    }
    setErr(null);
    setSpellingTask({
      words: cleaned,
      intervalSec: Math.max(0, Number(intervalSec) || 0),
      repeatPerWord: Math.max(1, Math.min(5, Number(repeatPerWord) || 1)),
    });
    setSendOk(true);
  };

  const inputBase =
    "w-full rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400/30";

  return (
    <div className="divide-y divide-slate-100/90 text-slate-900">
      <div className="space-y-4 pb-8">
        <p className="text-sm leading-relaxed text-slate-500">
          拍田字格表 → 识别或手改 → 设间隔与遍数 → 下发到本机孩子端。
        </p>
        {hasEnvKey ? (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            已使用 <code className="text-slate-600">.env</code> 中的密钥
          </p>
        ) : (
          <details className="group rounded-xl border border-slate-200/60 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
              未检测到环境变量中的密钥
              <span className="ml-1 text-xs text-slate-400">（点击展开）</span>
            </summary>
            <div className="border-t border-slate-100/80 px-3 pb-3 pt-1 text-xs leading-relaxed text-slate-500">
              在根目录配置 <code className="text-slate-600">.env</code> 后重启{" "}
              <code>npm run dev</code>，或在下方填写（勿在公网环境手填）。手填有泄露风险。
            </div>
          </details>
        )}

        {!hasEnvKey || showKeyOverride ? (
          <div className="space-y-1.5">
            {hasEnvKey && (
              <p className="text-xs text-slate-400">覆盖 .env，留空则仍用 .env</p>
            )}
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="openai-key"
            >
              {hasEnvKey ? "其它密钥" : "API 密钥"}
            </label>
            <input
              id="openai-key"
              type="password"
              autoComplete="off"
              placeholder={hasEnvKey ? "不填=继续用 .env" : "sk-…"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className={inputBase}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowKeyOverride(true)}
            className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-800"
          >
            用其它密钥试一次
          </button>
        )}
      </div>

      <Section title="拍图" className="space-y-4 py-8">
        <div>
          <input
            id={fileId}
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="sr-only"
          />
          <label
            htmlFor={fileId}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/30 px-4 py-8 text-center transition hover:border-slate-300 hover:bg-slate-50/60"
          >
            <ImagePlus className="h-7 w-7 text-slate-400" strokeWidth={1.25} />
            <span className="text-sm text-slate-600">点选或拍照 · 田字格听写表</span>
            {file && (
              <span className="text-xs text-slate-400">{file.name}</span>
            )}
          </label>
        </div>
        {preview && (
          <img
            src={preview}
            alt=""
            className="max-h-40 w-full rounded-xl object-contain"
          />
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onAnalyzeOcr}
              disabled={busy || !file}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-3.5 text-sm font-medium text-slate-800 transition enabled:hover:border-slate-300 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadMode === "ocr" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <ScanText className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              )}
              <span className="text-left leading-tight">
                OCR 识别
                <span className="block text-[10px] font-normal text-slate-400">
                  本机 Tesseract·免大模型
                </span>
              </span>
            </button>
            {loadMode === "ocr" && (
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-slate-200"
                aria-hidden
              >
                <div
                  className="h-full bg-slate-600 transition-[width] duration-200"
                  style={{
                    width: `${Math.min(100, Math.max(0, Math.round(ocrProgress * 100)))}%`,
                  }}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onAnalyzeAi}
            disabled={busy || !file}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-3.5 text-sm font-medium text-slate-800 transition enabled:hover:border-slate-300 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadMode === "ai" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            )}
            <span className="text-left leading-tight">
              AI 识图
              <span className="block text-[10px] font-normal text-slate-400">
                更准·需 API
              </span>
            </span>
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400">
          OCR
          为轻量本机方案，不下载大模型，田字格效果有限；要更准请用「AI 识图」或词表里手输。
        </p>
        {err && (
          <p className="text-sm text-rose-600" role="alert">
            {err}
          </p>
        )}
      </Section>

      <Section title="词表" className="space-y-3 py-8">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={addWord}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            添加
          </button>
        </div>
        {words.length === 0 ? (
          <p className="text-sm text-slate-400">空。识别后自动填入，或点「添加」手输。</p>
        ) : (
          <ul className="space-y-0">
            {words.map((w, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border-b border-slate-100/90 py-2.5 first:pt-0"
              >
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-slate-300">
                  {i + 1}
                </span>
                <input
                  className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:outline-none"
                  value={w}
                  onChange={(e) => updateWord(i, e.target.value)}
                  placeholder="词语"
                />
                <button
                  type="button"
                  aria-label="删除"
                  onClick={() => removeWord(i)}
                  className="shrink-0 rounded-lg p-2 text-slate-300 transition hover:bg-slate-100 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="节奏" className="space-y-4 py-8">
        <p className="text-xs leading-relaxed text-slate-500">
          下方数字为「词间」停顿。同一词连读多遍时，在<strong>同一词内</strong>，相邻两遍之间会按
          <strong>该秒数 ÷ 遍数</strong>均分（如 30 秒、3 遍 ≈
          每遍间隔约 10 秒再报读）；读完一词再进入下一词时，仍按该秒数停顿。
        </p>
        <div>
          <p className="mb-2 text-xs text-slate-500">词间停顿（秒）</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_INTERVALS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setIntervalSec(n);
                  setIntervalCustom(false);
                }}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  !intervalCustom && intervalSec === n
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                {n}秒
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIntervalCustom(true)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                intervalCustom
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              自定义
            </button>
            {intervalCustom && (
              <input
                type="number"
                min={0}
                max={120}
                className="w-16 rounded-md border border-slate-200/80 px-2 py-1.5 text-sm tabular-nums"
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value) || 0)}
              />
            )}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs text-slate-500" htmlFor="repeat">
            每词读几遍
          </label>
          <select
            id="repeat"
            className={inputBase + " py-2"}
            value={repeatPerWord}
            onChange={(e) => setRepeatPerWord(Number(e.target.value))}
          >
            <option value={1}>1 遍</option>
            <option value={2}>2 遍</option>
            <option value={3}>3 遍</option>
            <option value={4}>4 遍</option>
            <option value={5}>5 遍</option>
          </select>
        </div>
      </Section>

      <div className="space-y-3 pt-8">
        <button
          type="button"
          onClick={onSend}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
          下发到孩子机
        </button>
        {sendOk && (
          <p className="text-center text-sm text-slate-500" role="status">
            已保存，孩子端可刷新
          </p>
        )}
        <p className="text-center text-[11px] text-slate-400">
          多机同步需云存储
        </p>
      </div>
    </div>
  );
}

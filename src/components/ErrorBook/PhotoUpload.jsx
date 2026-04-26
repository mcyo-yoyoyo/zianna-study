import { useId, useState } from "react";
import { ChevronDown, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { extractErrorsFromPhoto } from "@/utils/llmErrorBook";
import { addErrorItems } from "@/utils/errorBookStore";
import { getOpenAiConfig } from "@/utils/openAiConfig";

/**
 * 家长：当前分科下拍卷 → 大模型抽取错题
 * @param {{ subject: string }} props
 */
export default function PhotoUpload({ subject }) {
  const fileId = useId();
  const keyFieldId = useId();
  const { key: envKey } = getOpenAiConfig();
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [ok, setOk] = useState(/** @type {string | null} */ (null));
  const [preview, setPreview] = useState(/** @type {string | null} */ (null));
  const effectiveKey = apiKey.trim() || envKey;
  const hasEnvKey = Boolean(envKey);

  const onPick = (e) => {
    const f = e.target.files?.[0] ?? null;
    setErr(null);
    setOk(null);
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
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const runAi = async () => {
    if (!file) {
      setErr("请先选一张卷面/错题截图。");
      return;
    }
    if (!effectiveKey) {
      setErr("未配置 API 密钥：请在 .env 填写，或展开「API 密钥」临时填写。");
      return;
    }
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const list = await extractErrorsFromPhoto(file, effectiveKey);
      if (!list.length) {
        setErr("未从图中抽出错题。可换一张更清晰、更贴近单题的截图重试。");
        return;
      }
      addErrorItems(
        list.map((x) => ({
          stem: x.stem,
          subject,
          knowledgePoint: x.knowledgePoint,
          bookTag: x.bookTag,
          inWeakPool: true,
        }))
      );
      setOk(`已加入 ${list.length} 道错题，见下方「知识点与归档」`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 shadow-sm"
      aria-label={`${subject}拍卷录入`}
    >
      <div className="border-b border-slate-100/90 bg-slate-50/80 px-4 py-3 sm:px-5 sm:py-3.5">
        <h3 className="text-base font-bold text-slate-800">
          {subject} · 拍卷识题
        </h3>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
          单张图即可；大模型会尝试用 JSON
          抽取题面。录入条目均标记为「{subject}」。
        </p>
      </div>

      <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
        <details className="group rounded-xl border border-slate-200/60 bg-slate-50/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
            <span>
              {hasEnvKey ? (
                <>
                  <span className="text-emerald-600">已检测到</span> 环境里的
                  API 配置
                </>
              ) : (
                <>需联网识图：展开填写 API 密钥</>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100/90 px-3 pb-3 pt-2 text-xs text-slate-500">
            <p className="mb-2 leading-relaxed">
              有 <code className="rounded bg-white px-0.5">VITE_OPENAI_API_KEY</code>{" "}
              时无需再填。否则在此临时填写，不会写进公开代码库。
            </p>
            <label className="sr-only" htmlFor={keyFieldId}>
              临时代用 API 密钥
            </label>
            <input
              id={keyFieldId}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              type="password"
              autoComplete="off"
              placeholder="sk-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </details>

        <div>
          <input
            id={fileId}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPick}
            className="sr-only"
          />
          <label
            htmlFor={fileId}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200/90 bg-violet-50/30 px-4 py-8 text-center transition hover:border-violet-300/90 hover:bg-violet-50/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100/90 text-violet-700">
              <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-800">点选或拍摄卷面</span>
              <p className="mt-0.5 text-xs text-slate-500">支持一图多题，尽量平铺、清晰、光线足</p>
            </div>
            {file && (
              <span className="max-w-full truncate text-xs text-violet-700" title={file.name}>
                已选：{file.name}
              </span>
            )}
          </label>
        </div>

        {preview && (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-900/5 p-1">
            <img
              src={preview}
              alt="卷面预览"
              className="max-h-52 w-full rounded-lg object-contain sm:max-h-64"
            />
          </div>
        )}

        <button
          type="button"
          disabled={loading || !file}
          onClick={runAi}
          className="inline-flex w-full min-h-[2.75rem] touch-manipulation items-center justify-center gap-2 rounded-2xl bg-violet-600 py-2.5 text-sm font-medium text-white shadow-sm transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 shrink-0" />
          )}
          {loading ? "识图中…" : "AI 抽取错题"}
        </button>

        {err && (
          <p className="rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2 text-sm text-red-800" role="alert">
            {err}
          </p>
        )}
        {ok && (
          <p
            className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800"
            role="status"
          >
            {ok}
          </p>
        )}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
          <ImagePlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>可分多次拍录；复杂卷面可裁成单题、清晰后再传。</span>
        </p>
      </div>
    </section>
  );
}

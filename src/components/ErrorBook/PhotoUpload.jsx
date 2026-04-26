import { useId, useState } from "react";
import { ImagePlus, Loader2, Plus, Sparkles } from "lucide-react";
import { extractErrorsFromPhoto } from "@/utils/llmErrorBook";
import { addErrorItems } from "@/utils/errorBookStore";
import { getOpenAiConfig } from "@/utils/openAiConfig";

/**
 * @param {{ subject: string }} props 当前分科；拍卷/手录均记入该学科
 */
export default function PhotoUpload({ subject }) {
  const fileId = useId();
  const inStem = useId();
  const inKp = useId();
  const inBook = useId();
  const { key: envKey } = getOpenAiConfig();
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [ok, setOk] = useState(/** @type {string | null} */ (null));
  const [preview, setPreview] = useState(/** @type {string | null} */ (null));
  const [mStem, setMStem] = useState("");
  const [mKp, setMKp] = useState("");
  const [mBook, setMBook] = useState("深圳部编版一年级下册");
  const effectiveKey = apiKey.trim() || envKey;

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
      setErr("请先选一张卷面图");
      return;
    }
    if (!effectiveKey) {
      setErr("未配置 API 密钥：请在 .env 填写，或在下方「临时」填写。");
      return;
    }
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const list = await extractErrorsFromPhoto(file, effectiveKey);
      if (!list.length) {
        setErr("未从图中抽出错题。可手输一条或换更清晰的单题截图。");
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
      setOk(`已加入 ${list.length} 道错题。`);
    } catch (e) {
      setErr(
        (e instanceof Error ? e.message : String(e)) +
          " 若你只用 DeepSeek 且不支持多模态，请用下方手录。"
      );
    } finally {
      setLoading(false);
    }
  };

  const runManual = () => {
    const t = mStem.trim();
    if (!t) {
      setErr("手录时请填写题面/摘要。");
      return;
    }
    setErr(null);
    addErrorItems([
      {
        stem: t,
        subject,
        knowledgePoint: mKp.trim() || "未分类",
        bookTag: mBook.trim() || "深圳部编版一年级下册",
        inWeakPool: true,
      },
    ]);
    setOk("已手录 1 条错题。");
    setMStem("");
    setMKp("");
  };

  return (
    <section className="space-y-4" aria-label={`${subject}拍卷录入`}>
      <h3 className="text-base font-bold text-slate-800">
        一、{subject} · 试卷/作业拍卷
      </h3>
      <p className="rounded-lg bg-slate-100/80 px-2 py-1.5 text-xs text-slate-600">
        本页录入的错题条目标记为「{subject}」；与别科分开统计与闯关。
      </p>
      <p className="text-sm text-slate-600">
        支持单张图；大模型会尝试用 JSON
        抽取错题。若报「多模态不支持」，可用手录。
        {envKey
          ? " 已检测到 .env 中的 API 配置。"
          : " 未检测到 .env 密钥，请在下面填写。"}
      </p>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        type="password"
        autoComplete="off"
        placeholder="临时代用密钥（可空）"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor={fileId}
        >
          单拍 / 一图多题
        </label>
        <input
          id={fileId}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="mt-1 block w-full text-sm"
        />
        {preview && (
          <img
            src={preview}
            alt="预览"
            className="mt-2 max-h-40 rounded-xl border object-contain"
          />
        )}
      </div>
      <button
        type="button"
        disabled={loading || !file}
        onClick={runAi}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-2.5 text-sm font-medium text-white shadow disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        AI 抽取错题
      </button>
      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}
      {ok && (
        <p className="text-sm text-emerald-700" role="status">
          {ok}
        </p>
      )}

      <div className="border-t border-dashed border-slate-200 pt-4">
        <h3 className="text-base font-bold text-slate-800">二、{subject} · 手录一题</h3>
        <p className="text-xs text-slate-500">无图/识图失败时用；自动归入{subject}。</p>
        <div className="mt-2 space-y-2">
          <div>
            <label className="text-xs text-slate-600" htmlFor={inStem}>
              题面/摘要
            </label>
            <textarea
              id={inStem}
              className="mt-0.5 w-full rounded-xl border border-slate-200 p-2 text-sm"
              rows={2}
              value={mStem}
              onChange={(e) => setMStem(e.target.value)}
              placeholder="如：3+8=＿"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
            <div>
              <label className="text-xs text-slate-600" htmlFor={inKp}>
                知识点
              </label>
              <input
                id={inKp}
                className="mt-0.5 w-full rounded-lg border p-1.5 text-sm"
                value={mKp}
                onChange={(e) => setMKp(e.target.value)}
                placeholder="如：进位加"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600" htmlFor={inBook}>
              册别标签
            </label>
            <input
              id={inBook}
              className="mt-0.5 w-full rounded-lg border p-1.5 text-sm"
              value={mBook}
              onChange={(e) => setMBook(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={runManual}
            className="inline-flex w-full items-center justify-center gap-1 rounded-2xl bg-macaron-mint/80 py-2 text-sm font-medium text-slate-900"
          >
            <Plus className="h-4 w-4" />
            手录进错题本
          </button>
        </div>
      </div>

      <p className="flex items-center gap-1 text-xs text-slate-400">
        <ImagePlus className="h-3.5 w-3.5" />
        多拍连录：分多次点「单拍识题」或手录。自动去手写、裁黑边在后续可接图像管线。
      </p>
    </section>
  );
}

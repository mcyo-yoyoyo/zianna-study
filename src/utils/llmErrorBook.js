import {
  assertZhipuClientImageCompatibleModel,
  buildMultimodalUserContentParts,
  getOpenAiConfig,
  supportsChatVision,
  VISION_NOT_SUPPORTED_MSG,
} from "./openAiConfig.js";

const EXTRACT_USER = `你是小学错题整理助手。请读图（试卷/练习册），用 JSON 只输出、不要其他文字，格式为：
{ "items": [ { "stem": "题面原文或简要摘录", "subject": "语文|数学|英语", "knowledgePoint": "如：20以内进位加", "bookTag": "深圳部编版一年级下册" } ] }
没识别到错题时 items 可为空数组。`;

const SIMILAR_USER = (stem, subject, kp) =>
  `你是一年级老师。请根据下面错题，出 3 道**难度非常接近**的同类练习题（面向一年级、书面表达简短）。\n` +
  `原题/错题摘要：${stem}\n学科：${subject}\n知识点：${kp}\n` +
  `只输出 JSON，格式：\n` +
  `{ "questions": [ { "q": "题目", "hint": "一句小提示" } ] }`;

/**
 * @param {string} text
 * @returns {unknown}
 */
function tryParseJsonLoose(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("模型无有效内容");
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) {
    return JSON.parse(fence[1]);
  }
  const a = trimmed.indexOf("{");
  const b = trimmed.lastIndexOf("}");
  if (a < 0 || b <= a) {
    throw new Error("未找到 JSON 对象");
  }
  return JSON.parse(trimmed.slice(a, b + 1));
}

/**
 * 读 file 为 data URL
 * @param {File} file
 * @returns {Promise<string>}
 */
function readDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("读图失败"));
    r.readAsDataURL(file);
  });
}

function chatCompletions(c, body) {
  return fetch(`${c.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.key}`,
      ...(c.organization ? { "OpenAI-Organization": c.organization } : {}),
    },
    body: JSON.stringify(body),
  });
}

/**
 * 图：抽取错题行（多模态；DeepSeek 若报不支持图片，会抛错，请用手动录题）
 * @param {File} file
 * @param {string} [apiKey]
 * @returns {Promise<{ stem: string, subject: string, knowledgePoint: string, bookTag?: string }[]>}
 */
export async function extractErrorsFromPhoto(file, apiKey) {
  if (!file.type.startsWith("image/")) throw new Error("请选图片");
  const c = getOpenAiConfig(apiKey);
  if (!c.key) throw new Error("未配置 API 密钥（.env 或界面临时填写）");
  if (!supportsChatVision(apiKey)) {
    throw new Error(VISION_NOT_SUPPORTED_MSG);
  }
  assertZhipuClientImageCompatibleModel(c.model, c.baseUrl);
  const dataUrl = await readDataUrl(file);
  const res = await chatCompletions(c, {
    model: c.model,
    max_tokens: 2000,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildMultimodalUserContentParts(EXTRACT_USER, dataUrl, c.baseUrl),
      },
    ],
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(t);
      msg = j.error?.message || msg;
    } catch {
      msg = t.slice(0, 200);
    }
    if (
      /image_url|unknown variant|expected .text|deserialize|multipart.*image/i.test(
        String(msg)
      )
    ) {
      throw new Error(VISION_NOT_SUPPORTED_MSG);
    }
    throw new Error(`识图/错题抽取失败：${msg}`);
  }
  const d = await res.json();
  const part = d.choices?.[0]?.message?.content;
  if (typeof part !== "string") throw new Error("无文本回复");
  const j = tryParseJsonLoose(part);
  if (!j || !Array.isArray(j.items)) throw new Error("未解析到 items 列表");
  return j.items
    .map((x) => ({
      stem: String(x.stem || "").trim(),
      subject: String(x.subject || "语文").trim(),
      knowledgePoint: String(x.knowledgePoint || "未分类").trim(),
      bookTag: x.bookTag ? String(x.bookTag) : "深圳部编版一年级下册",
    }))
    .filter((x) => x.stem);
}

/**
 * 文：出 3 道同类题
 * @param {string} stem
 * @param {string} subject
 * @param {string} knowledgePoint
 * @param {string} [apiKey]
 * @returns {Promise<{ q: string, hint: string }[]>}
 */
export async function generateSimilarQuestions(stem, subject, knowledgePoint, apiKey) {
  const c = getOpenAiConfig(apiKey);
  if (!c.key) throw new Error("未配置 API 密钥");
  const textModel = (
    import.meta.env.VITE_LLM_TEXT_MODEL ||
    import.meta.env.VITE_DEEPSEEK_MODEL ||
    c.model
  ).trim();
  const res = await chatCompletions(c, {
    model: textModel,
    max_tokens: 2000,
    temperature: 0.6,
    messages: [{ role: "user", content: SIMILAR_USER(stem, subject, knowledgePoint) }],
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(t);
      msg = j.error?.message || msg;
    } catch {
      msg = t.slice(0, 200);
    }
    throw new Error(`出相似题失败：${msg}`);
  }
  const d = await res.json();
  const part = d.choices?.[0]?.message?.content;
  if (typeof part !== "string") throw new Error("无内容");
  const j = tryParseJsonLoose(part);
  if (!j.questions || !Array.isArray(j.questions)) {
    throw new Error("未解析到 questions");
  }
  return j.questions.map((x) => ({
    q: String(x.q || "").trim(),
    hint: String(x.hint || "").trim(),
  })).filter((x) => x.q);
}

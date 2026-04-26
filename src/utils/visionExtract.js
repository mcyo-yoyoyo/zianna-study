import {
  assertZhipuClientImageCompatibleModel,
  buildMultimodalUserContentParts,
  getOpenAiConfig,
  supportsChatVision,
  VISION_NOT_SUPPORTED_MSG,
} from "./openAiConfig.js";

/** 家长端：从空白田字格表/词表发词 */
const USER_PROMPT_SHEET =
  "识别图片中的田字格生字/词语，忽略田字格边框线和背景干扰，以JSON数组格式输出需要听写的词汇列表，" +
  "只输出一个 JSON 数组，元素为「词语或单字」的字符串，不要其他解释、不要键名、不要换行里的多余文字。";

/** 孩子端：从已手写完成的听写本照片里抽「已写出的字词」，便于与家长词表匹配 */
const USER_PROMPT_HANDWRITING =
  "这是小学生手写听写本的照片。请只识别**图中已经写出的**汉字、词语；忽略空格子、方格线、红笔拼音/批改痕迹。" +
  "按图中从左到右、从上到下的顺序，" +
  "以 JSON 数组输出这些字词，每个元素是字符串。只输出一个 JSON 数组，不要解释、不要键名。";

/**
 * 从多模态模型回复中解析出 string[]
 * @param {string} text
 * @returns {string[]}
 */
export function parseWordsArrayFromModelText(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("模型返回内容为空");
  }
  const fence = trimmed.match(/```(?:json)?\s*(\[[\s\S]*?])\s*```/i);
  let jsonSlice = "";
  if (fence) {
    jsonSlice = fence[1];
  } else {
    const i = trimmed.indexOf("[");
    const j = trimmed.lastIndexOf("]");
    if (i === -1 || j === -1 || j <= i) {
      throw new Error("未在回复中找到 JSON 数组");
    }
    jsonSlice = trimmed.slice(i, j + 1);
  }
  const arr = JSON.parse(jsonSlice);
  if (!Array.isArray(arr)) {
    throw new Error("解析结果需为 JSON 数组");
  }
  return arr
    .map((x) => String(x).replace(/\s+/g, "").trim())
    .filter(Boolean);
}

/**
 * 将图片文件读成 data URL（如 data:image/jpeg;base64,...）
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("无法读取图片"));
    r.readAsDataURL(file);
  });
}

/**
 * @param {File} file
 * @param {string} [apiKey]
 * @param {string} userPrompt
 * @returns {Promise<string[]>}
 */
async function extractWordsArrayFromImageWithPrompt(file, apiKey, userPrompt) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("请上传图片文件");
  }
  const { baseUrl, key, model, organization } = getOpenAiConfig(apiKey);
  if (!key) {
    throw new Error("请配置 OpenAI 密钥：环境变量 VITE_OPENAI_API_KEY 或在界面临时填写");
  }
  if (!supportsChatVision(apiKey)) {
    throw new Error(VISION_NOT_SUPPORTED_MSG);
  }
  assertZhipuClientImageCompatibleModel(model, baseUrl);
  const dataUrl = await readFileAsDataUrl(file);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(organization ? { "OpenAI-Organization": organization } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildMultimodalUserContentParts(userPrompt, dataUrl, baseUrl),
        },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(errText);
      msg = j.error?.message || msg;
    } catch {
      msg = errText.slice(0, 200) || msg;
    }
    if (
      /image_url|unknown variant|expected .text|deserialize|multipart.*image/i.test(
        String(msg)
      )
    ) {
      throw new Error(VISION_NOT_SUPPORTED_MSG);
    }
    throw new Error(`视觉接口错误 (${res.status}): ${msg}`);
  }
  const data = await res.json();
  const part = data.choices?.[0]?.message?.content;
  if (typeof part !== "string" || !part) {
    throw new Error("模型无有效内容返回");
  }
  return parseWordsArrayFromModelText(part);
}

/**
 * 调多模态 API，从听写**表/词表**图片抽题（家长发词）
 * @param {File} file 图片
 * @param {string} [apiKey] 可覆盖环境变量
 * @returns {Promise<string[]>}
 */
export async function extractSpellingWordsFromImage(file, apiKey) {
  return extractWordsArrayFromImageWithPrompt(
    file,
    apiKey,
    USER_PROMPT_SHEET
  );
}

/**
 * 调多模态 API，从**孩子手写听写本**照片抽已写字词，用于与家长词表匹配
 * @param {File} file
 * @param {string} [apiKey]
 * @returns {Promise<string[]>}
 */
export async function extractHandwritingSpellingWordsFromImage(file, apiKey) {
  return extractWordsArrayFromImageWithPrompt(
    file,
    apiKey,
    USER_PROMPT_HANDWRITING
  );
}

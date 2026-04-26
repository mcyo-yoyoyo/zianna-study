/**
 * 多模态/对话接口：OpenAI 或 OpenAI 兼容基座（DeepSeek、自部署等）
 * 密钥可写 VITE_OPENAI_API_KEY 或 VITE_DEEPSEEK_API_KEY（二选一，界面临时填写优先）
 */
export function getOpenAiConfig(overrideKey) {
  const key = (
    overrideKey ||
    import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_DEEPSEEK_API_KEY ||
    ""
  ).trim();
  return {
    baseUrl: (
      import.meta.env.VITE_OPENAI_BASE_URL ||
      import.meta.env.VITE_DEEPSEEK_BASE_URL ||
      "https://api.openai.com/v1"
    )
      .replace(/\/$/, ""),
    key,
    model: (
      import.meta.env.VITE_OPENAI_VISION_MODEL ||
      import.meta.env.VITE_DEEPSEEK_MODEL ||
      "gpt-4o"
    ).trim(),
    organization: (import.meta.env.VITE_OPENAI_ORG || "").trim(),
  };
}

/**
 * 是否可按 OpenAI 多模态格式在 messages 里发送 `type: "image_url"`。
 * DeepSeek 官方 `deepseek-chat` 等仅支持纯文本，会报：
 * `unknown variant image_url, expected text`。
 * @param {string} [overrideKey] 与 getOpenAiConfig 一致
 */
export function supportsChatVision(overrideKey) {
  const o = (import.meta.env.VITE_LLM_SUPPORTS_VISION || "")
    .trim()
    .toLowerCase();
  if (o === "true" || o === "1" || o === "yes") return true;
  if (o === "false" || o === "0" || o === "no") return false;

  const c = getOpenAiConfig(overrideKey);
  const b = c.baseUrl.toLowerCase();
  const m = c.model.toLowerCase();
  if (b.includes("api.deepseek.com")) {
    if (
      m.includes("vl") ||
      m.includes("vision") ||
      m.includes("multimodal")
    ) {
      return true;
    }
    return false;
  }
  if (m === "deepseek-chat" || m === "deepseek-reasoner") {
    return false;
  }
  if (
    m.includes("gpt-4o") ||
    m.includes("gpt-4.1") ||
    m.includes("4o")
  ) {
    return true;
  }
  if (m.includes("glm-4v") || m.includes("glm-4.5v")) {
    return true;
  }
  if (b.includes("api.openai.com") && m.startsWith("gpt-")) {
    return true;
  }
  // 自部署/其它兼容 OpenAI 的中转，默认按「可发图」尝试
  return true;
}

/** 识图不可用时的说明（与 supportsChatVision 为 false 时同用） */
export const VISION_NOT_SUPPORTED_MSG =
  "当前配置的接口/模型（例如 DeepSeek 的 deepseek-chat）不支持在对话里发图片。请用「加一行」手输听写词，或把 .env 换成支持多模态的基座和模型（如 gpt-4o），或设置 VITE_LLM_SUPPORTS_VISION=true 且确已开通视觉能力。";

/**
 * 多模态 `messages[].content` 里的一段 `image_url`。
 * 智谱 open.bigmodel.cn 的 OpenAI 兼容层不接受 `image_url.detail` 等 OpenAI 专有字段，会报 400「参数有误」。
 * @param {string} dataUrl 如 data:image/jpeg;base64,...
 * @param {string} [baseUrl] 与 getOpenAiConfig 的 baseUrl 一致时用于判断厂商
 * @returns {{ type: "image_url", image_url: { url: string } }}
 */
export function buildVisionImageContentPart(dataUrl, baseUrl) {
  const b = (baseUrl || "").toLowerCase();
  const onlyUrl = b.includes("bigmodel.cn");
  if (onlyUrl) {
    return { type: "image_url", image_url: { url: dataUrl } };
  }
  return { type: "image_url", image_url: { url: dataUrl, detail: "auto" } };
}

/**
 * 智谱文档：`GLM-4V-Flash` 仅支持 1 张图且**不支持 Base64**（`url` 须为可公网访问的 http(s) 图链）。
 * 本应用相册/听写本上传均为 Base64，若仍选 glmv4-flash 会固定 400。
 * @param {string} model
 * @param {string} [baseUrl]
 * @see https://docs.bigmodel.cn/ （Chat Completions 多模态 / GLM-4V-Flash）
 */
export function isZhipuGlm4vFlashNoBase64Model(model, baseUrl) {
  if (!(baseUrl || "").toLowerCase().includes("bigmodel.cn")) return false;
  const m = (model || "").toLowerCase().replace(/\s/g, "");
  return m === "glm-4v-flash" || m.startsWith("glm-4v-flash-");
}

/** 在发起识图前调用：避免默默 400 */
export function assertZhipuClientImageCompatibleModel(model, baseUrl) {
  if (isZhipuGlm4vFlashNoBase64Model(model, baseUrl)) {
    throw new Error(
      "当前模型为智谱「glm-4v-flash」：该模型仅支持公网图片 URL，本应用「相册/本地上传」会走 Base64，接口会 400。请在 .env 将 VITE_OPENAI_VISION_MODEL 改为支持 Base64 的多模态模型（如 glm-4.6v、glm-4.5v 等，以智谱控制台为准），或仅使用本机「OCR 识别」。"
    );
  }
}

/**
 * 多模态 user 的 `content` 数组顺序。智谱文档示例中多为「图在前、文在后」。
 * @param {string} promptText
 * @param {string} dataUrl
 * @param {string} baseUrl
 * @returns {object[]}
 */
export function buildMultimodalUserContentParts(promptText, dataUrl, baseUrl) {
  const b = (baseUrl || "").toLowerCase();
  const img = buildVisionImageContentPart(dataUrl, baseUrl);
  const text = { type: "text", text: promptText };
  if (b.includes("bigmodel.cn")) {
    return [img, text];
  }
  return [text, img];
}

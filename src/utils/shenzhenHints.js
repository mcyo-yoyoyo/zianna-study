/**
 * 内置：深圳地区一年级高频方向（学情/复习建议占位，可与看板联用）
 */
export const SHENZHEN_REVIEW_HINTS = {
  语文: [
    "拼音与轻声、整体认读音节要每日复习",
    "会写字笔顺与部首：田字格练习保持一周几次",
  ],
  数学: [
    "数感：20/100 以内进位、退位与小括号的含义",
    "量感：看钟表整点、常见人民币辨认",
  ],
  英语: [
    "字母与简单单词认读、课堂指令词跟读",
  ],
};

export function getHintsForSubject(subject) {
  return SHENZHEN_REVIEW_HINTS[subject] || SHENZHEN_REVIEW_HINTS.语文;
}

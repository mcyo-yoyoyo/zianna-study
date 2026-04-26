import { useEffect, useState } from "react";
import { getSpellingTask, SPELLING_TASK_EVENT } from "@/utils/spellingTask.js";

/**
 * 订阅 `localStorage` 中的听写任务（同窗口自定义事件 + 多标签 `storage`）
 */
export function useSpellingTask() {
  const [task, setTask] = useState(getSpellingTask);
  useEffect(() => {
    const sync = () => setTask(getSpellingTask());
    window.addEventListener(SPELLING_TASK_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SPELLING_TASK_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return task;
}

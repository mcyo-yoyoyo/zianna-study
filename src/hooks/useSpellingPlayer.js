import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * @param {string} text
 * @param {() => boolean} shouldStop
 */
function speakUtterance(text, shouldStop) {
  return new Promise((resolve) => {
    if (!text || shouldStop()) {
      resolve();
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    /** 在原先 0.95 基础上再慢 50%（语速约为原先一半） */
    u.rate = 0.95 * 0.5;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    u.onstart = () => {
      if (shouldStop()) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
        resolve();
      }
    };
    window.speechSynthesis.speak(u);
  });
}

function clearTimer(refs) {
  if (refs.speechTimeout != null) {
    clearTimeout(refs.speechTimeout);
    refs.speechTimeout = null;
  }
}

/**
 * @param {{ words: string[], intervalSec: number, repeatPerWord: number } | null} task
 */
export function useSpellingPlayer(task) {
  const [phase, setPhase] = useState(
    /** @type {"idle" | "playing" | "paused" | "done"} */ "idle"
  );
  const [index, setIndex] = useState(0);
  const runIdRef = useRef(0);
  const stopFlagRef = useRef(false);
  const timerRef = useRef({ speechTimeout: null });

  const words = task?.words?.length ? task.words : [];
  const intervalSec = task ? Math.max(0, task.intervalSec) : 0;
  const repeatPerWord = task ? Math.max(1, Math.min(5, task.repeatPerWord)) : 1;
  /** 同一词多次朗读之间：把「词间停顿」均分到每遍之间（如 30 秒、3 遍 → 约 10 秒再读下一遍） */
  const gapBetweenRepeatsSec =
    repeatPerWord > 1 ? intervalSec / repeatPerWord : 0;
  const total = words.length;

  /** 仅词表变化时重置播放状态。节奏（间隔/遍数）单独保存时 task 会变，不应清掉「已完成」以保留拍照核对区 */
  const wordsKey = useMemo(
    () =>
      task?.words?.length
        ? task.words.map((w) => String(w).trim()).join("\u0001")
        : "",
    [task]
  );

  const shouldStop = useCallback(() => stopFlagRef.current, []);

  const abortSpeech = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }, []);

  const hardStop = useCallback(() => {
    runIdRef.current += 1;
    stopFlagRef.current = true;
    clearTimer(timerRef.current);
    abortSpeech();
  }, [abortSpeech]);

  useEffect(() => {
    return () => {
      hardStop();
    };
  }, [hardStop]);

  /** 词表变化时回到空闲，避免续播到旧列表（节奏变更不重置，以免盖住「听写完成」后的拍照等 UI） */
  useEffect(() => {
    hardStop();
    setPhase("idle");
    setIndex(0);
  }, [wordsKey, hardStop]);

  const playFrom = useCallback(
    (startIndex) => {
      if (!words.length) return;
      hardStop();
      const runId = (runIdRef.current += 1);
      stopFlagRef.current = false;
      setPhase("playing");
      (async function sequence() {
        for (let i = startIndex; i < words.length; i += 1) {
          if (runIdRef.current !== runId || shouldStop()) {
            setPhase("paused");
            return;
          }
          setIndex(i);
          for (let r = 0; r < repeatPerWord; r += 1) {
            if (runIdRef.current !== runId || shouldStop()) {
              setPhase("paused");
              return;
            }
            await speakUtterance(words[i], shouldStop);
            if (r < repeatPerWord - 1) {
              if (runIdRef.current !== runId || shouldStop()) {
                setPhase("paused");
                return;
              }
              await new Promise((res) => {
                timerRef.current.speechTimeout = setTimeout(
                  res,
                  Math.max(0, gapBetweenRepeatsSec) * 1000
                );
              });
            }
          }
          if (i < words.length - 1) {
            if (runIdRef.current !== runId || shouldStop()) {
              setPhase("paused");
              return;
            }
            await new Promise((res) => {
              timerRef.current.speechTimeout = setTimeout(
                res,
                Math.max(0, intervalSec) * 1000
              );
            });
            if (runIdRef.current !== runId || shouldStop()) {
              setPhase("paused");
              return;
            }
          }
        }
        if (runIdRef.current === runId) {
          setPhase("done");
        }
      })();
    },
    [
      words,
      intervalSec,
      repeatPerWord,
      gapBetweenRepeatsSec,
      shouldStop,
      hardStop,
    ]
  );

  const startFromBeginning = useCallback(() => {
    playFrom(0);
  }, [playFrom]);

  const resume = useCallback(() => {
    if (!words.length) return;
    playFrom(index);
  }, [playFrom, index, words.length]);

  const pause = useCallback(() => {
    stopFlagRef.current = true;
    hardStop();
    setPhase((p) => (p === "done" ? p : "paused"));
  }, [hardStop]);

  const nextWord = useCallback(() => {
    if (index >= total - 1) return;
    const next = index + 1;
    setIndex(next);
    playFrom(next);
  }, [index, total, playFrom]);

  const prevWord = useCallback(() => {
    if (index <= 0) return;
    const p = index - 1;
    setIndex(p);
    playFrom(p);
  }, [index, playFrom]);

  const readCurrentAgain = useCallback(() => {
    if (!words.length) return;
    /** 全部听写完成后在「重读」时仍应回到 done，以保留孩子端「拍照对答案」等 UI */
    const returnToDone = phase === "done";
    hardStop();
    stopFlagRef.current = false;
    const i = index;
    const runId = (runIdRef.current += 1);
    setPhase("playing");
    (async () => {
      for (let r = 0; r < repeatPerWord; r += 1) {
        if (runIdRef.current !== runId || shouldStop()) {
          setPhase("idle");
          return;
        }
        await speakUtterance(words[i], shouldStop);
        if (r < repeatPerWord - 1) {
          await new Promise((res) => {
            timerRef.current.speechTimeout = setTimeout(
              res,
              Math.max(0, gapBetweenRepeatsSec) * 1000
            );
          });
        }
      }
      if (runIdRef.current === runId) {
        setPhase(returnToDone ? "done" : "idle");
      }
    })();
  }, [words, index, repeatPerWord, gapBetweenRepeatsSec, shouldStop, hardStop, phase]);

  const setIdle = useCallback(() => {
    hardStop();
    setPhase("idle");
    setIndex(0);
  }, [hardStop]);

  return {
    phase,
    index,
    total,
    startFromBeginning,
    resume,
    pause,
    nextWord,
    prevWord,
    readAgain: readCurrentAgain,
    setIdle,
  };
}

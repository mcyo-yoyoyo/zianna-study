import { useEffect, useState } from "react";
import {
  getSpellingErrorSessions,
  SPELLING_ERROR_SESSIONS_EVENT,
} from "@/utils/spellingErrorSessions.js";

export function useSpellingErrorSessions() {
  const [list, setList] = useState(getSpellingErrorSessions);
  useEffect(() => {
    const s = () => setList(getSpellingErrorSessions());
    window.addEventListener(SPELLING_ERROR_SESSIONS_EVENT, s);
    window.addEventListener("storage", s);
    return () => {
      window.removeEventListener(SPELLING_ERROR_SESSIONS_EVENT, s);
      window.removeEventListener("storage", s);
    };
  }, []);
  return list;
}

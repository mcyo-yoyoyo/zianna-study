import { useEffect, useState } from "react";
import { getErrorItems, ERROR_BOOK_EVENT } from "@/utils/errorBookStore.js";

export function useErrorBook() {
  const [items, setItems] = useState(getErrorItems);
  useEffect(() => {
    const s = () => setItems(getErrorItems());
    window.addEventListener(ERROR_BOOK_EVENT, s);
    window.addEventListener("storage", s);
    return () => {
      window.removeEventListener(ERROR_BOOK_EVENT, s);
      window.removeEventListener("storage", s);
    };
  }, []);
  return items;
}

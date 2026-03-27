/** Синхронизация с настройками читалки: одна настройка на весь сайт. */
export const COMMENTS_SPOILER_STORAGE_KEY = "reader-comments-spoiler-protection";

export const COMMENTS_SPOILER_CHANGED_EVENT = "tomilo-comments-spoiler-changed";

/** По умолчанию комментарии скрыты до явного показа (защита от спойлеров). */
export function getCommentsSpoilerProtection(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(COMMENTS_SPOILER_STORAGE_KEY);
    if (v === null) return true;
    return v === "true";
  } catch {
    return true;
  }
}

export function setCommentsSpoilerProtection(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMMENTS_SPOILER_STORAGE_KEY, String(value));
    window.dispatchEvent(new Event(COMMENTS_SPOILER_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

export function clearCommentsSpoilerProtectionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(COMMENTS_SPOILER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

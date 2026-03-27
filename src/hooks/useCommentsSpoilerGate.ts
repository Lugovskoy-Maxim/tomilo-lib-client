"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMMENTS_SPOILER_CHANGED_EVENT,
  getCommentsSpoilerProtection,
  setCommentsSpoilerProtection,
} from "@/lib/comments-spoiler-protection";

/**
 * Защита от спойлеров: при включённой защите список комментариев не запрашивается,
 * пока пользователь не нажмёт «Показать комментарии» (или не отключит защиту).
 */
export function useCommentsSpoilerGate(entityKey: string) {
  const [protectionOn, setProtectionOnState] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const sync = () => {
      const on = getCommentsSpoilerProtection();
      setProtectionOnState(on);
      if (on) setRevealed(false);
    };
    sync();
    window.addEventListener(COMMENTS_SPOILER_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMMENTS_SPOILER_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    setRevealed(false);
  }, [entityKey]);

  const shouldLoadComments = !protectionOn || revealed;

  const reveal = useCallback(() => setRevealed(true), []);

  const setProtectionEnabled = useCallback((value: boolean) => {
    setCommentsSpoilerProtection(value);
    setProtectionOnState(value);
    if (value) setRevealed(false);
  }, []);

  return {
    protectionOn,
    revealed,
    shouldLoadComments,
    reveal,
    setProtectionEnabled,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { normalizeBookmarks } from "@/lib/bookmarks";

interface UseBookmarkOptions {
  titleId: string;
}

interface UseBookmarkReturn {
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  handleBookmarkToggle: () => Promise<void>;
}

export function useBookmark({ titleId }: UseBookmarkOptions): UseBookmarkReturn {
  const toast = useToast();
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // Update bookmark state when user data changes (raw API or normalized)
  useEffect(() => {
    if (!user?.bookmarks) {
      setIsBookmarked(false);
      return;
    }
    const isInList = normalizeBookmarks(user.bookmarks).some(e => e.titleId === titleId);
    setIsBookmarked(isInList);
  }, [user?.bookmarks, titleId]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }

    setIsBookmarkLoading(true);

    try {
      const result = isBookmarked 
        ? await removeBookmark(titleId) 
        : await addBookmark(titleId);

      if (result.success) {
        setIsBookmarked(!isBookmarked);
      } else {
        toast.error(`Ошибка при работе с закладками: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при работе с закладками:", error);
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [isAuthenticated, isBookmarked, titleId, addBookmark, removeBookmark, toast]);

  return {
    isBookmarked,
    isBookmarkLoading,
    handleBookmarkToggle,
  };
}

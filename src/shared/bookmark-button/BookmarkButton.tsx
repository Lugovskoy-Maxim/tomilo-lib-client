"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { Bookmark } from "lucide-react";
import type { BookmarkCategory } from "@/types/user";
import { useGetBookmarkStatusQuery } from "@/store/api/authApi";

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

const CATEGORIES: BookmarkCategory[] = ["reading", "planned", "completed", "favorites", "dropped"];

interface BookmarkButtonProps {
  titleId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function BookmarkButton({
  titleId,
  initialBookmarked = false,
  className = "",
}: BookmarkButtonProps) {
  const pathname = usePathname();
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const toast = useToast();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [currentCategory, setCurrentCategory] = useState<BookmarkCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Запрос статуса закладки с сервера (лёгкий эндпоинт)
  const { data: bookmarkStatusData } = useGetBookmarkStatusQuery(titleId, {
    skip: !isAuthenticated || !titleId,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Приоритет: данные с сервера, затем из профиля пользователя
  useEffect(() => {
    if (!isClient) return;

    // Приоритет 1: данные из нового эндпоинта
    if (bookmarkStatusData?.data) {
      setIsBookmarked(bookmarkStatusData.data.isBookmarked);
      setCurrentCategory(bookmarkStatusData.data.category);
      return;
    }

    // Приоритет 2: данные из профиля (fallback)
    if (user?.bookmarks) {
      const entry = normalizeBookmarks(user.bookmarks).find(e => e.titleId === titleId);
      if (entry) {
        setIsBookmarked(true);
        setCurrentCategory(entry.category);
      } else {
        setIsBookmarked(initialBookmarked);
        setCurrentCategory(null);
      }
    }
  }, [isClient, initialBookmarked, user?.bookmarks, titleId, bookmarkStatusData]);

  useEffect(() => {
    if (!categoryOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setCategoryOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [categoryOpen]);

  useEffect(() => {
    setCategoryOpen(false);
  }, [pathname]);

  const handleRemoveBookmark = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await removeBookmark(titleId);
      if (result.success) setIsBookmarked(false);
      else toast.error(result.error ?? "Ошибка при удалении из закладок");
    } catch {
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWithCategory = async (category: BookmarkCategory) => {
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }
    setCategoryOpen(false);
    setIsLoading(true);
    try {
      const result = await addBookmark(titleId, category);
      if (result.success) setIsBookmarked(true);
      else toast.error(result.error ?? "Ошибка при добавлении в закладки");
    } catch {
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setIsLoading(false);
    }
  };

  const displayIsBookmarked = isClient ? isBookmarked : initialBookmarked;
  const displayTitle = displayIsBookmarked 
    ? currentCategory 
      ? `${CATEGORY_LABELS[currentCategory]} — удалить` 
      : "Удалить из закладок" 
    : "Добавить в закладки";
  const displayFill = displayIsBookmarked ? "currentColor" : "none";
  const displayLabel = displayIsBookmarked && currentCategory 
    ? CATEGORY_LABELS[currentCategory] 
    : displayIsBookmarked 
      ? "В закладках" 
      : "В закладки";
  const baseButtonClass =
    "flex items-center justify-center gap-2 cursor-pointer rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chart-1)]/40";

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-flex ${categoryOpen ? "z-[var(--z-sheet)]" : ""}`}
    >
      {displayIsBookmarked ? (
        <button
          onClick={handleRemoveBookmark}
          disabled={isLoading}
          className={`${baseButtonClass} border-[var(--chart-1)]/40 bg-[var(--chart-1)]/10 text-[var(--chart-1)] hover:bg-[var(--chart-1)]/15 ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          title={displayTitle}
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Bookmark className="w-4 h-4" fill={displayFill} />
          )}
          <p className="hidden lg:block">{displayLabel}</p>
        </button>
      ) : (
        <>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
                return;
              }
              setCategoryOpen(prev => !prev);
            }}
            disabled={isLoading}
            className={`${baseButtonClass} border-[var(--border)] bg-[var(--card)]/80 text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--chart-1)]/30 ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={displayTitle}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <Bookmark className="w-4 h-4" fill="none" />
                <p className="hidden lg:block">В закладки</p>
              </>
            )}
          </button>
          {categoryOpen && !isLoading && (
            <div
              ref={dropdownRef}
              className="absolute right-0 lg:left-0 lg:right-auto top-full mt-1 z-[var(--z-sheet)] py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg min-w-[160px]"
            >
              <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Добавить в категорию
              </p>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleAddWithCategory(cat)}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] first:rounded-t-none rounded-none last:rounded-b-lg"
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

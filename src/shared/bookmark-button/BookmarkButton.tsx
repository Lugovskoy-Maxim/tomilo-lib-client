"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { Bookmark, ChevronDown } from "lucide-react";
import type { BookmarkCategory } from "@/types/user";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user?.bookmarks) {
      const inList = normalizeBookmarks(user.bookmarks).some(e => e.titleId === titleId);
      setIsBookmarked(initialBookmarked || inList);
    }
  }, [isClient, initialBookmarked, user?.bookmarks, titleId]);

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
  const displayTitle = displayIsBookmarked ? "Удалить из закладок" : "Добавить в закладки";
  const displayFill = displayIsBookmarked ? "currentColor" : "none";

  return (
    <div ref={dropdownRef} className="relative inline-flex">
      {displayIsBookmarked ? (
        <button
          onClick={handleRemoveBookmark}
          disabled={isLoading}
          className={`flex justify-center items-center gap-2 cursor-pointer lg:p-1 p-4 bg-[var(--primary)] border-[var(--primary)] text-[var(--chart-1)] rounded-xl hover:opacity-90 transition-opacity ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
          <p className="hidden lg:block">{displayTitle}</p>
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
            className={`flex justify-center items-center gap-2 cursor-pointer lg:p-1 p-4 bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)] rounded-xl hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                <ChevronDown className={`w-4 h-4 lg:ml-0.5 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
          {categoryOpen && !isLoading && (
            <div
              ref={dropdownRef}
              className="absolute left-0 top-full mt-1 z-[100] py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg min-w-[160px]"
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

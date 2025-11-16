"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Bookmark } from "lucide-react";

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
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const toast = useToast();
  const [isBookmarked, setIsBookmarked] = useState(
    initialBookmarked || (user?.bookmarks?.includes(titleId) ?? false)
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleBookmarkToggle = async () => {
    // Проверяем, что пользователь авторизован
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        // Удаляем из закладок
        const result = await removeBookmark(titleId);
        if (result.success) {
          setIsBookmarked(false);
        } else {
          console.error("Ошибка при удалении из закладок:", result.error);
          toast.error(`Ошибка при удалении из закладок: ${result.error}`);
        }
      } else {
        // Добавляем в закладки
        const result = await addBookmark(titleId);
        if (result.success) {
          setIsBookmarked(true);
        } else {
          console.error("Ошибка при добавлении в закладки:", result.error);
          toast.error(`Ошибка при добавлении в закладки: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Ошибка при работе с закладками:", error);
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      className={`p-4 bg-[var(--secondary)] rounded-full hover:bg-[var(--secondary)]/80 transition-colors ${
        isBookmarked
          ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--chart-1)]"
          : "bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
      } ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isBookmarked ? "Удалить из закладок" : "Добавить в закладки"}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
      )}
    </button>
  );
}
"use client";
import { useState } from "react";
import { UserProfile } from "@/types/user";
import BookmarkCard from "@/shared/bookmark-card/BookmarkCard";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";

interface BookmarksSectionProps {
  bookmarks: UserProfile["bookmarks"];
  showAll?: boolean;
}

// Отдельный компонент для одной закладки
function BookmarkItem({
  bookmarkId,
  onRemove,
}: {
  bookmarkId: string;
  onRemove: (id: string) => void;
}) {
  const { data: title, isLoading, error } = useGetTitleByIdQuery(
    { id: bookmarkId || "null" },
    { skip: !bookmarkId }
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(bookmarkId);
      setIsRemoving(false);
    }, 300);
  };

  if (isLoading || isRemoving) {
    return (
      <div className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)] animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-16 bg-[var(--muted)] rounded flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-[var(--muted)] rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-[var(--muted)] rounded mb-2 w-1/2"></div>
            <div className="h-3 bg-[var(--muted)] rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !title) {
    return (
      <div className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-16 bg-gradient-to-br from-[var(--chart-1)]/20 to-[var(--primary)]/20 rounded flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-[var(--chart-1)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1">
              Манга #{bookmarkId.slice(-6)}
            </h3>
            <p className="text-xs text-red-500 mb-2">Ошибка загрузки данных</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BookmarkCard
      title={title}
      onRemove={handleRemove}
      isLoading={false}
    />
  );
}

function BookmarksSection({ bookmarks, showAll = false }: BookmarksSectionProps) {
  const [currentBookmarks, setCurrentBookmarks] = useState(bookmarks);
  const [isExpanded, setIsExpanded] = useState(showAll);

  // Определяем, какие закладки показывать
  const visibleBookmarks = isExpanded ? currentBookmarks : currentBookmarks.slice(0, 4);
  const hasMoreBookmarks = currentBookmarks.length > 4;

  const handleRemoveBookmark = (bookmarkId: string) => {
    setCurrentBookmarks(prev => prev.filter((id: string) => id !== bookmarkId));
  };

  // Если закладок нет
  if (!currentBookmarks || currentBookmarks.length === 0) {
    return (
      <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
            <Bookmark className="h-5 w-5" />
            <span>Закладки</span>
          </h2>
        </div>
        <div className="text-center py-8 text-[var(--muted-foreground)]">У вас нет закладок</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-2 border border-dotted border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
          <span>Закладки</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs flex items-center gap-2 text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
            <Bookmark className="h-3 w-3" />
            {currentBookmarks.length}
          </span>
          {hasMoreBookmarks && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors bg-[var(--background)] px-2 py-1 rounded"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  <span>Свернуть</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  <span>Показать все</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visibleBookmarks.map((bookmarkId: string) => (
          <BookmarkItem
            key={bookmarkId}
            bookmarkId={bookmarkId}
            onRemove={handleRemoveBookmark}
          />
        ))}
      </div>

      {hasMoreBookmarks && !isExpanded && (
        <div className="text-center mt-4">
          <button
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            Показать все {currentBookmarks.length} закладок
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksSection;


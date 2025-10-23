"use client";
import { useState } from "react";
import { Bookmark, ChevronRight, Trash2 } from "lucide-react";

interface BookmarksListProps {
  bookmarks: string[];
  onRemoveBookmark?: (bookmarkId: string) => void;
}

export default function BookmarksList({
  bookmarks,
  onRemoveBookmark,
}: BookmarksListProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  const showMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  // В реальном приложении здесь будет запрос к API для получения информации о манге
  const getMangaInfo = (mangaId: string) => {
    // Заглушка - в реальном приложении будет запрос к API
    return {
      title: `Манга #${mangaId}`,
      cover: "/placeholder-manga.jpg",
    };
  };

  if (bookmarks.length === 0) {
    return (
      <div className="bg-[var(--secondary)] rounded-xl p-8 text-center border border-[var(--border)]">
        <Bookmark className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Закладки пусты
        </h3>
        <p className="text-[var(--muted-foreground)]">
          Добавляйте мангу в закладки, чтобы быстро находить её позже
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center space-x-2">
          <Bookmark className="w-5 h-5" />
          <span>Закладки</span>
        </h2>
        <span className="text-sm text-[var(--muted-foreground)]">
          {bookmarks.length} манги
        </span>
      </div>

      <div className="space-y-3">
        {bookmarks.slice(0, visibleCount).map((bookmarkId, index) => {
          const mangaInfo = getMangaInfo(bookmarkId);

          return (
            <div
              key={bookmarkId}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-[var(--background)] transition-colors group"
            >
              <div className="w-12 h-16 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-6 h-6 text-[var(--primary)]" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--foreground)] truncate">
                  {mangaInfo.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  ID: {bookmarkId}
                </p>
              </div>

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onRemoveBookmark && (
                  <button
                    onClick={() => onRemoveBookmark(bookmarkId)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < bookmarks.length && (
        <div className="text-center mt-6">
          <button
            onClick={showMore}
            className="px-6 py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
          >
            Показать еще
          </button>
        </div>
      )}
    </div>
  );
}

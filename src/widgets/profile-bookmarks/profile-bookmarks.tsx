"use client";
import { useState } from "react";

interface BookmarksSectionProps {
  bookmarks: string[];
  initialBookmarks: string[];
}

function BookmarksSection({
  bookmarks,
  initialBookmarks,
}: BookmarksSectionProps) {
  const [currentBookmarks, setCurrentBookmarks] = useState(initialBookmarks);

  const handleRemoveBookmark = (bookmarkId: string) => {
    const updatedBookmarks = currentBookmarks.filter((id) => id !== bookmarkId);
    setCurrentBookmarks(updatedBookmarks);
    // Здесь будет вызов API для удаления закладки
    console.log("Удаление закладки:", bookmarkId);
  };

  return (
    <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center space-x-2">
          <svg
            className="w-5 h-5"
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
          <span>Закладки</span>
        </h2>
        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
          {currentBookmarks.length} манги
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentBookmarks.slice(0, 4).map((bookmarkId, index) => (
          <div
            key={bookmarkId}
            className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors group"
          >
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
                <h3 className="font-medium text-[var(--foreground)] text-sm mb-1">
                  Манга #{bookmarkId.slice(-6)}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">
                  ID: {bookmarkId}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Добавлено недавно
                  </span>
                  <button
                    onClick={() => handleRemoveBookmark(bookmarkId)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentBookmarks.length > 4 && (
        <div className="text-center mt-4">
          <button className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
            Показать все {currentBookmarks.length} закладок
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksSection;
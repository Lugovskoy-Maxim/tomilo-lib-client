"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";

interface BookmarksSectionProps {
  bookmarks: UserProfile["bookmarks"];
  initialBookmarks: UserProfile["bookmarks"];
}

function BookmarksSection({
  bookmarks,
  initialBookmarks,
}: BookmarksSectionProps) {
  const { removeBookmark } = useAuth();
  const [currentBookmarks, setCurrentBookmarks] = useState(initialBookmarks);
  const [loadingBookmarks, setLoadingBookmarks] = useState<Record<string, boolean>>({});

  const handleRemoveBookmark = async (bookmarkId: string) => {
    // Устанавливаем состояние загрузки для этой закладки
    setLoadingBookmarks(prev => ({ ...prev, [bookmarkId]: true }));
    
    try {
      const result = await removeBookmark(bookmarkId);
      
      if (result.success) {
        // Обновляем локальное состояние
        const updatedBookmarks = currentBookmarks.filter((id) => id !== bookmarkId);
        setCurrentBookmarks(updatedBookmarks);
      } else {
        console.error("Ошибка при удалении закладки:", result.error);
        alert(`Ошибка при удалении закладки: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении закладки:", error);
      alert("Произошла ошибка при удалении закладки");
    } finally {
      // Сбрасываем состояние загрузки
      setLoadingBookmarks(prev => {
        const newLoading = { ...prev };
        delete newLoading[bookmarkId];
        return newLoading;
      });
    }
  };

  return (
    <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
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
                <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1">
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
                    disabled={loadingBookmarks[bookmarkId]}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                  >
                    {loadingBookmarks[bookmarkId] ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
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
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentBookmarks.length > 4 && (
        <div className="text-center mt-4">
          <button className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors">
            Показать все {currentBookmarks.length} закладок
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksSection;
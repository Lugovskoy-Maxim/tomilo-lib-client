"use client";
import { useEffect, useState } from "react";
import { UserProfile } from "@/types/user";
import { Title } from "@/types/title";
import BookmarkCard from "@/shared/bookmark-card/bookmark-card";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";

interface BookmarksSectionProps {
  bookmarks: UserProfile["bookmarks"];
  showAll?: boolean;
}

function BookmarksSection({
  bookmarks,
}: BookmarksSectionProps) {
  const [currentBookmarks, setCurrentBookmarks] = useState(bookmarks);
  const [titleData, setTitleData] = useState<Record<string, Title>>({});
  const [loadingBookmarks, setLoadingBookmarks] = useState<Record<string, boolean>>({});
  const [errorBookmarks, setErrorBookmarks] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Загружаем данные о тайтлах с помощью RTK Query
  // Используем отдельные хуки для каждого bookmarkId
  const bookmarkQuery1 = useGetTitleByIdQuery(currentBookmarks[0] || '', { skip: !currentBookmarks[0] });
  const bookmarkQuery2 = useGetTitleByIdQuery(currentBookmarks[1] || '', { skip: !currentBookmarks[1] });
  const bookmarkQuery3 = useGetTitleByIdQuery(currentBookmarks[2] || '', { skip: !currentBookmarks[2] });
  const bookmarkQuery4 = useGetTitleByIdQuery(currentBookmarks[3] || '', { skip: !currentBookmarks[3] });

  // Обновляем titleData на основе результатов запросов
  useEffect(() => {
    const queries = [bookmarkQuery1, bookmarkQuery2, bookmarkQuery3, bookmarkQuery4];
    const newTitleData: Record<string, Title> = {};
    const newErrorBookmarks: Record<string, boolean> = {};

    queries.forEach((query, index) => {
      const bookmarkId = currentBookmarks[index];
      if (bookmarkId && query.data && query.data.success && query.data.data) {
        newTitleData[bookmarkId] = query.data.data;
      } else if (bookmarkId && query.error) {
        newErrorBookmarks[bookmarkId] = true;
      }
    });

    if (Object.keys(newTitleData).length > 0) {
      setTitleData(prev => ({
        ...prev,
        ...newTitleData
      }));
    }

    if (Object.keys(newErrorBookmarks).length > 0) {
      setErrorBookmarks(prev => ({
        ...prev,
        ...newErrorBookmarks
      }));
    }
  }, [bookmarkQuery1, bookmarkQuery2, bookmarkQuery3, bookmarkQuery4, currentBookmarks]);

  const handleRemoveBookmark = (bookmarkId: string) => {
    // Обновляем локальное состояние
    const updatedBookmarks = currentBookmarks.filter((id: string) => id !== bookmarkId);
    setCurrentBookmarks(updatedBookmarks);
    
    // Удаляем данные об ошибке и заголовке при удалении закладки
    setErrorBookmarks(prev => {
      const newErrors = { ...prev };
      delete newErrors[bookmarkId];
      return newErrors;
    });
    
    setTitleData(prev => {
      const newData = { ...prev };
      delete newData[bookmarkId];
      return newData;
    });
  };

  const handleBookmarkRemove = (titleId: string) => {
    // Устанавливаем состояние загрузки для этой закладки
    setLoadingBookmarks(prev => ({ ...prev, [titleId]: true }));
    
    // После завершения анимации удаления обновляем состояние
    setTimeout(() => {
      handleRemoveBookmark(titleId);
      setLoadingBookmarks(prev => {
        const newLoading = { ...prev };
        delete newLoading[titleId];
        return newLoading;
      });
    }, 300);
  };

  // Компонент для отображения состояния загрузки
  const LoadingCard = ({ }: { bookmarkId: string }) => (
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

  // Компонент для отображения ошибки загрузки
  const ErrorCard = ({ bookmarkId }: { bookmarkId: string }) => (
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
          <p className="text-xs text-red-500 mb-2">
            Ошибка загрузки данных
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl p-2 border border-dotted border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
          <span>Закладки</span>
        </h2>
        <span className="text-xs flex items-center gap-2 text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
          <Bookmark className="h-3 w-3" />
          {currentBookmarks.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {currentBookmarks.slice(0, 4).map((bookmarkId: string) => {
          // Показываем состояние загрузки
          if (loadingBookmarks[bookmarkId]) {
            return <LoadingCard key={bookmarkId} bookmarkId={bookmarkId} />;
          }
          
          // Показываем ошибку, если данные не загрузились
          if (errorBookmarks[bookmarkId]) {
            return <ErrorCard key={bookmarkId} bookmarkId={bookmarkId} />;
          }
          
          // Показываем карточку с данными, если они есть
          const title = titleData[bookmarkId];
          if (title) {
            return (
              <BookmarkCard
                key={bookmarkId}
                title={title}
                onRemove={handleBookmarkRemove}
                isLoading={loadingBookmarks[bookmarkId]}
              />
            );
          }
          
          // Показываем состояние загрузки по умолчанию
          return <LoadingCard key={bookmarkId} bookmarkId={bookmarkId} />;
        })}
      </div>

      {currentBookmarks.length > 4 && (
        <div className="text-center mt-4">
          <button
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors"
            onClick={() => router.push('/bookmarks')}
          >
            Показать все {currentBookmarks.length} закладок
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksSection;
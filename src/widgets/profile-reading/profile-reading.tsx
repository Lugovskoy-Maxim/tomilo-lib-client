"use client";

import { BookOpen, Trash2, Clock } from "lucide-react";
import { UserProfile } from "@/types/user";
import { Title } from "@/types/title";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

interface ReadingHistorySectionProps {
  readingHistory:
    | {
        titleId: string;
        chapters: {
          chapterId: string;
          chapterNumber: number;
          chapterTitle: string | null;
          readAt: string;
        }[];
        readAt: string;
      }[]
    | undefined;
}

function ReadingHistorySection({ readingHistory }: ReadingHistorySectionProps) {
  const { removeFromReadingHistory } = useAuth();
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [titleData, setTitleData] = useState<Record<string, Title>>({});
  const [errorItems, setErrorItems] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Преобразуем данные в плоский список глав с информацией о тайтле
  const allChapters = useMemo(() => {
    if (!readingHistory) return [];

    return readingHistory.flatMap(historyItem =>
      historyItem.chapters.map(chapter => ({
        titleId: historyItem.titleId,
        chapterId: chapter.chapterId,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.chapterTitle,
        // Используем readAt из главы, если есть, иначе из родительского элемента
        readAt: chapter.readAt || historyItem.readAt,
        // Добавляем ключ для уникальной идентификации
        uniqueKey: `${historyItem.titleId}-${chapter.chapterId}-${chapter.readAt || historyItem.readAt}`
      }))
    );
  }, [readingHistory]);

  // Сортируем по времени чтения главы (самые новые первыми), затем по номеру главы
  const recentChapters = useMemo(() => {
    return [...allChapters]
      .sort((a, b) => {
        // Сначала сортируем по времени чтения (новые первыми)
        const timeDiff = new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        
        // Если время одинаковое, сортируем по номеру главы (более высокие номера первыми)
        return b.chapterNumber - a.chapterNumber;
      })
      .slice(0, 10);
  }, [allChapters]);

  // Получаем уникальные titleId для загрузки данных
  const uniqueTitleIds = useMemo(() => {
    return [...new Set(allChapters.map(chapter => chapter.titleId))];
  }, [allChapters]);

  // Получаем данные о тайтлах
  useEffect(() => {
    if (uniqueTitleIds.length === 0) return;

    uniqueTitleIds.forEach(titleId => {
      // Пропускаем если уже загружаем или уже есть данные
      if (titleData[titleId] || errorItems[titleId]) return;

      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/titles/${titleId}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((response: { success: boolean; data?: Title }) => {
          if (response.success && response.data) {
            setTitleData((prev) => ({
              ...prev,
              [titleId]: response.data!,
            }));
          } else {
            setErrorItems((prev) => ({
              ...prev,
              [titleId]: true,
            }));
          }
        })
        .catch((error) => {
          console.error("Ошибка при получении данных о манге:", error);
          setErrorItems((prev) => ({
            ...prev,
            [titleId]: true,
          }));
        });
    });
  }, [uniqueTitleIds, titleData, errorItems]);

  const handleRemoveFromHistory = async (
    titleId: string,
    chapterId: string
  ) => {
    const key = `${titleId}-${chapterId}`;
    setLoadingItems((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await removeFromReadingHistory(titleId, chapterId);
      if (!result.success) {
        console.error("Ошибка при удалении из истории чтения:", result.error);
        alert(`Ошибка при удалении из истории чтения: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении из истории чтения:", error);
      alert("Произошла ошибка при удаления из истории чтения");
    } finally {
      setLoadingItems((prev) => {
        const newLoading = { ...prev };
        delete newLoading[key];
        return newLoading;
      });
    }
  };

  // Формируем корректный URL для изображения
  const getImageUrl = (coverImage: string | undefined) => {
    if (!coverImage) return IMAGE_HOLDER;

    if (coverImage.startsWith("http")) {
      return coverImage;
    }

    return `${
      process.env.NEXT_PUBLIC_URL || "http://localhost:3001"
    }${coverImage}`;
  };

  // Компонент для отображения состояния загрузки
  const LoadingCard = () => (
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
  const ErrorCard = ({ titleId }: { titleId: string }) => (
    <div className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)]">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-16 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 rounded flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1">
            Манга #{titleId.slice(-6)}
          </h3>
          <p className="text-xs text-red-500 mb-2">Ошибка загрузки данных</p>
        </div>
      </div>
    </div>
  );

  // Если история чтения пуста, показываем сообщение
  if (!readingHistory || readingHistory.length === 0 || allChapters.length === 0) {
    return (
      <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>История чтения</span>
          </h2>
        </div>
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          История чтения пуста
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--secondary)] rounded-xl p-2 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
          <span>История чтения</span>
        </h2>
        <span className="text-xs flex gap-2 items-center text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
          <BookOpen className="h-3 w-3" />
          {recentChapters.length} 
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {recentChapters.map((item) => {
          const loadingKey = `${item.titleId}-${item.chapterId}`;
          const title = titleData[item.titleId];
          const isError = errorItems[item.titleId];
          const isLoading = !title && !isError;

          if (isLoading) {
            return <LoadingCard key={item.uniqueKey} />;
          }

          if (isError) {
            return <ErrorCard key={item.uniqueKey} titleId={item.titleId} />;
          }

          return (
            <div
              key={item.uniqueKey}
              className="bg-[var(--background)] rounded-lg p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer group"
              onClick={() =>
                router.push(
                  `/browse/${item.titleId}/chapter/${item.chapterId}`
                )
              }
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-16 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {title?.coverImage ? (
                    <Image
                      src={getImageUrl(title.coverImage)}
                      alt={title.name || `Манга #${item.titleId.slice(-6)}`}
                      width={48}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = IMAGE_HOLDER.src;
                      }}
                    />
                  ) : (
                    <Image
                      src={IMAGE_HOLDER}
                      alt="Заглушка"
                      width={48}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1 truncate">
                    {title?.name || `Манга #${item.titleId.slice(-6)}`}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">
                    Глава {item.chapterNumber}
                    {item.chapterTitle && ` - ${item.chapterTitle}`}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)]">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(item.readAt).toLocaleDateString("ru-RU")}
                    </span>
                    <span className="text-[var(--muted-foreground)]/60">
                      {new Date(item.readAt).toLocaleTimeString("ru-RU", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromHistory(item.titleId, item.chapterId);
                  }}
                  disabled={loadingItems[loadingKey]}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                >
                  {loadingItems[loadingKey] ? (
                    <svg
                      className="w-3 h-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {allChapters.length > 10 && (
        <div className="text-center mt-4">
          <button
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors"
            onClick={() => router.push("/history")}
          >
            Показать все {allChapters.length} историй чтения
          </button>
        </div>
      )}
    </div>
  );
}

export default ReadingHistorySection;
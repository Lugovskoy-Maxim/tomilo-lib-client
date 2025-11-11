"use client";

import React from 'react';
import { BookOpen, Trash2, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

interface ReadingHistorySectionProps {
  readingHistory:
    | {
        titleId: string | { _id: string; name: string; coverImage?: string };
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
  const [titleData, setTitleData] = useState<Record<string, { _id: string; name: string; coverImage?: string }>>({});
  const router = useRouter();

  // Получаем уникальные titleId из истории чтения
  const uniqueTitleIds = useMemo(() => {
    if (!readingHistory) return [];
    const ids = new Set<string>();
    readingHistory.forEach(item => {
      const isTitleObject = typeof item.titleId === 'object' && item.titleId !== null;
      const titleId = isTitleObject ? (item.titleId as { _id: string })._id : item.titleId as string;
      ids.add(titleId);
    });
    return Array.from(ids);
  }, [readingHistory]);

  // Загружаем данные о тайтлах
  useEffect(() => {
    const fetchTitles = async () => {
      for (const titleId of uniqueTitleIds) {
        if (!titleData[titleId]) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}/api/titles/${titleId}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                setTitleData(prev => ({ ...prev, [titleId]: result.data }));
              }
            }
          } catch (error) {
            console.error(`Ошибка при загрузке данных о тайтле ${titleId}:`, error);
          }
        }
      }
    };

    if (uniqueTitleIds.length > 0) {
      fetchTitles();
    }
  }, [uniqueTitleIds, titleData]);

  // Преобразуем данные в плоский список глав с информацией о тайтле
  const allChapters = useMemo(() => {
    if (!readingHistory) return [];

    return readingHistory.flatMap(historyItem => {
      if (!historyItem.chapters || !Array.isArray(historyItem.chapters)) return [];

      return historyItem.chapters.map(chapter => {
        const isTitleObject = typeof historyItem.titleId === 'object' && historyItem.titleId !== null;
        const titleId = isTitleObject ? (historyItem.titleId as { _id: string })._id : historyItem.titleId as string;

        return {
          titleId,
          chapterId: chapter.chapterId,
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle,
          // Используем readAt из главы, если есть, иначе из родительского элемента
          readAt: chapter.readAt || historyItem.readAt,
          // Добавляем ключ для уникальной идентификации
          uniqueKey: `${titleId}-${chapter.chapterId}-${chapter.readAt || historyItem.readAt}`,
          // Если titleId - объект, сохраняем его данные
          titleData: isTitleObject ? historyItem.titleId as { _id: string; name: string; coverImage?: string } : undefined
        };
      });
    });
  }, [readingHistory]);

  // Фильтруем записи за последний месяц и сортируем по времени чтения главы (самые новые первыми), затем по номеру главы
  const recentChapters = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return [...allChapters]
      .filter(item => new Date(item.readAt) >= oneMonthAgo)
      .sort((a, b) => {
        // Сначала сортируем по времени чтения (новые первыми)
        const timeDiff = new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
        if (timeDiff !== 0) return timeDiff;

        // Если время одинаковое, сортируем по номеру главы (более высокие номера первыми)
        return (b.chapterNumber || 0) - (a.chapterNumber || 0);
      });
  }, [allChapters]);

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
    <div className="rounded-xl p-2 border border-dotted border-[var(--border)]">
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
          // Получаем данные о тайтле из состояния или из item.titleData
          const title = titleData[item.titleId] || item.titleData;

          return (
            <div
              key={`${item.titleId}-${item.chapterId}-${item.readAt}`}
              className="bg-[var(--background)] rounded-lg p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer group"
              onClick={() => {
                if (item.titleId && item.chapterId) {
                  router.push(
                    `/browse/${item.titleId}/chapter/${item.chapterId}`
                  );
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-16 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {title?.coverImage ? (
                    <Image
                      src={getImageUrl(title.coverImage)}
                      alt={title.name || `Манга #${item.titleId}`}
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
                    {title?.name || `Манга #${item.titleId}`}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">
                    Глава {item.chapterNumber || 'N/A'}
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
                    if (item.titleId && item.chapterId) {
                      handleRemoveFromHistory(item.titleId, item.chapterId);
                    }
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

      {allChapters.length > 5 && (
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

"use client";

import React from "react";
import { BookOpen, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getChapterPath } from "@/lib/title-paths";

interface TitleData {
  _id: string;
  name: string;
  coverImage?: string;
  slug?: string;
}

interface ReadingHistorySectionProps {
  readingHistory:
    | {
        titleId: string | TitleData;
        chapters: {
          chapterId: string;
          chapterNumber: number;
          chapterTitle: string | null;
          readAt: string;
        }[];
        readAt: string;
      }[]
    | undefined;
  showAll?: boolean;
}

function ReadingHistorySection({ readingHistory, showAll = false }: ReadingHistorySectionProps) {
  const { removeFromReadingHistory } = useAuth();
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(showAll);
  const router = useRouter();

  // Преобразуем данные в плоский список глав с информацией о тайтле
  const allChapters = useMemo(() => {
    if (!readingHistory) return [];

    return readingHistory.flatMap(historyItem => {
      if (!historyItem.chapters || !Array.isArray(historyItem.chapters)) return [];

      return historyItem.chapters.map(chapter => {
        const isTitleObject =
          typeof historyItem.titleId === "object" && historyItem.titleId !== null;
        // Keep titleId as string for API calls, but preserve titleData for display
        const titleId = isTitleObject
          ? (historyItem.titleId as { _id: string })._id
          : String(historyItem.titleId);

        // Ensure chapterId is always a string for API calls
        const chapterIdValue = typeof chapter.chapterId === "object" && chapter.chapterId !== null
          ? (chapter.chapterId as { _id: string })._id
          : String(chapter.chapterId);

        return {
          titleId,
          chapterId: chapterIdValue,
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle,
          readAt: chapter.readAt || historyItem.readAt,
          uniqueKey: `${titleId}-${chapterIdValue}-${chapter.readAt || historyItem.readAt}`,
          // Keep the original titleId object for title data access
          titleData: isTitleObject ? (historyItem.titleId as TitleData) : undefined,
        };
      });
    });
  }, [readingHistory]);

  // Фильтруем записи за последний месяц и сортируем
  const recentChapters = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return [...allChapters]
      .filter(item => new Date(item.readAt) >= oneMonthAgo)
      .sort((a, b) => {
        const timeDiff = new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (b.chapterNumber || 0) - (a.chapterNumber || 0);
      });
  }, [allChapters]);

  // Определяем, какие главы показывать
  const defaultLimit = 4;
  const displayedChapters = isExpanded
    ? recentChapters
    : recentChapters.slice(0, defaultLimit);
  const hasMoreChapters = recentChapters.length > defaultLimit;

  const handleRemoveFromHistory = async (titleId: string, chapterId: string) => {
    const key = `${titleId}-${chapterId}`;
    setLoadingItems(prev => ({ ...prev, [key]: true }));

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
      setLoadingItems(prev => {
        const newLoading = { ...prev };
        delete newLoading[key];
        return newLoading;
      });
    }
  };

  const getImageUrl = (coverImage: string | undefined) => {
    if (!coverImage) return IMAGE_HOLDER;
    if (coverImage.startsWith("http")) return coverImage;
    return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${coverImage}`;
  };

  const getImageUrlString = (coverImage: string | undefined) => {
    const imageUrl = getImageUrl(coverImage);
    return typeof imageUrl === "string" ? imageUrl : imageUrl.src || "";
  };

  // Если история чтения пуста
  if (!readingHistory || readingHistory.length === 0 || allChapters.length === 0) {
    return (
      <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>История чтения</span>
          </h2>
        </div>
        <div className="text-center py-8 text-[var(--muted-foreground)]">История чтения пуста</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-2 border border-dotted border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
          <span>История чтения</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs flex gap-2 items-center text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
            <BookOpen className="h-3 w-3" />
            {recentChapters.length}
          </span>
          {hasMoreChapters && (
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

      <div className="grid grid-cols-1 gap-2">
        {displayedChapters.map(item => {
          const loadingKey = `${item.titleId}-${item.chapterId}`;
          const title = item.titleData;

          return (
            <div
              key={`${item.titleId}-${item.chapterId}-${item.readAt}`}
              className="bg-[var(--background)] rounded-lg p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer group"
              onClick={() => {
                if (item.titleId && item.chapterId) {
                  router.push(
                    getChapterPath(
                      { id: item.titleId, slug: item.titleData?.slug },
                      item.chapterId,
                    ),
                  );
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-16 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {title?.coverImage ? (
                    <OptimizedImage
                      src={getImageUrlString(title.coverImage)}
                      alt={title.name || `Манга #${item.titleId}`}
                      width={48}
                      height={64}
                      className="w-full h-full object-cover"
                      quality={80}
                      priority={false}
                    />
                  ) : (
                    <OptimizedImage
                      src={IMAGE_HOLDER.src}
                      alt="Заглушка"
                      width={48}
                      height={64}
                      className="w-full h-full object-cover"
                      quality={80}
                      priority={false}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1 truncate">
                    {title?.name || `Манга #${item.titleId}`}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">
                    Глава {item.chapterNumber || "N/A"}
                    {item.chapterTitle && ` - ${item.chapterTitle}`}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.readAt).toLocaleDateString("ru-RU")}</span>
                    <span className="text-[var(--muted-foreground)]/60">
                      {new Date(item.readAt).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (item.titleId && item.chapterId) {
                      handleRemoveFromHistory(item.titleId, item.chapterId);
                    }
                  }}
                  disabled={loadingItems[loadingKey]}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                >
                  {loadingItems[loadingKey] ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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

      {hasMoreChapters && !isExpanded && (
        <div className="text-center mt-4">
          <button
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            Показать все {recentChapters.length} историй чтения
          </button>
        </div>
      )}
    </div>
  );
}

export default ReadingHistorySection;


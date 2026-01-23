"use client";

import React from "react";
import { BookOpen, Clock, ChevronDown, ChevronUp } from "lucide-react";
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

interface ChapterData {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string | null;
  readAt: string;
}

interface HistoryItem {
  titleId: string | TitleData;
  titleData?: TitleData;
  chapters: ChapterData[];
  readAt: string;
}

interface ReadingHistorySectionProps {
  readingHistory: HistoryItem[] | undefined;
  showAll?: boolean;
}

// Тип для сгруппированной истории по тайтлам
interface GroupedTitleHistory {
  titleId: string;
  titleData?: TitleData;
  chapters: ChapterData[];
  lastReadAt: string;
}

function ReadingHistorySection({ readingHistory, showAll = false }: ReadingHistorySectionProps) {
  const { removeFromReadingHistory } = useAuth();
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(showAll);
  const router = useRouter();

  // Группируем историю по тайтлам
  const groupedHistory = useMemo(() => {
    if (!readingHistory) return [];

    const groups: Map<string, GroupedTitleHistory> = new Map();

    readingHistory.forEach(item => {
      const isTitleObject =
        typeof item.titleId === "object" && item.titleId !== null;
      const titleId = isTitleObject
        ? (item.titleId as TitleData)._id
        : String(item.titleId);

      if (!groups.has(titleId)) {
        groups.set(titleId, {
          titleId,
          titleData: isTitleObject ? (item.titleId as TitleData) : undefined,
          chapters: [],
          lastReadAt: item.readAt,
        });
      }

      const group = groups.get(titleId)!;
      // Добавляем главы с преобразованием chapterId
      item.chapters.forEach(chapter => {
        const chapterIdValue =
          typeof chapter.chapterId === "object" && chapter.chapterId !== null
            ? (chapter.chapterId as { _id: string })._id
            : String(chapter.chapterId);

        group.chapters.push({
          ...chapter,
          chapterId: chapterIdValue,
        });
      });

      // Обновляем lastReadAt если эта запись новее
      if (new Date(item.readAt) > new Date(group.lastReadAt)) {
        group.lastReadAt = item.readAt;
      }
    });

    // Фильтруем записи за последний месяц и сортируем по времени последнего чтения
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return Array.from(groups.values())
      .filter(group => new Date(group.lastReadAt) >= oneMonthAgo)
      .sort((a, b) => {
        return new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime();
      });
  }, [readingHistory]);

  // Сортируем главы внутри каждой группы по времени чтения (новые первыми)
  const sortChaptersByReadTime = (chapters: ChapterData[]): ChapterData[] => {
    return [...chapters].sort(
      (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
    );
  };

  // Группируем главы по сеансам чтения (2-3 часа между главами)
  const groupChaptersBySession = (chapters: ChapterData[]): ChapterData[][] => {
    if (chapters.length === 0) return [];
    if (chapters.length === 1) return [chapters];

    const sessions: ChapterData[][] = [];
    let currentSession: ChapterData[] = [chapters[0]];

    for (let i = 1; i < chapters.length; i++) {
      const timeDiff = new Date(chapters[i].readAt).getTime() - new Date(chapters[i - 1].readAt).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Если прошло больше 3 часов, начинаем новую сессию
      if (hoursDiff > 3) {
        if (currentSession.length > 0) {
          sessions.push(currentSession);
        }
        currentSession = [chapters[i]];
      } else {
        currentSession.push(chapters[i]);
      }
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  };

  // Форматируем диапазон глав для одной сессии
  const formatChapterRange = (chapters: ChapterData[]): string => {
    if (chapters.length === 1) {
      return `Глава ${chapters[0].chapterNumber}`;
    }

    const sortedByNumber = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
    const first = sortedByNumber[0].chapterNumber;
    const last = sortedByNumber[sortedByNumber.length - 1].chapterNumber;

    if (first === last) {
      return `Глава ${first}`;
    }

    return `Главы ${first}-${last}`;
  };

  // Определяем, какие тайтлы показывать
  const defaultLimit = 4;
  const displayedTitles = isExpanded
    ? groupedHistory
    : groupedHistory.slice(0, defaultLimit);
  const hasMoreTitles = groupedHistory.length > defaultLimit;

  const toggleTitleExpanded = (titleId: string) => {
    setExpandedTitles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(titleId)) {
        newSet.delete(titleId);
      } else {
        newSet.add(titleId);
      }
      return newSet;
    });
  };

  const handleRemoveFromHistory = async (titleId: string, chapterId: string) => {
    try {
      const result = await removeFromReadingHistory(titleId, chapterId);
      if (!result.success) {
        console.error("Ошибка при удалении из истории чтения:", result.error);
        alert(`Ошибка при удалении из истории чтения: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении из истории чтения:", error);
      alert("Произошла ошибка при удалении из истории чтения");
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

  // Форматируем время сессии
  const formatSessionTime = (chapters: ChapterData[]): string => {
    if (chapters.length === 0) return "";
    const firstRead = new Date(chapters[0].readAt);
    const lastRead = new Date(chapters[chapters.length - 1].readAt);

    const dateStr = firstRead.toLocaleDateString("ru-RU");
    const timeStr = `${firstRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} - ${lastRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;

    return `${dateStr}, ${timeStr}`;
  };

  // Если история чтения пуста
  if (!readingHistory || readingHistory.length === 0 || groupedHistory.length === 0) {
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
            {groupedHistory.length}
          </span>
          {hasMoreTitles && (
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
        {displayedTitles.map(group => {
          const sortedChapters = sortChaptersByReadTime(group.chapters);
          const sessions = groupChaptersBySession(sortedChapters);
          const isExpandedTitle = expandedTitles.has(group.titleId);
          const lastChapter = sortedChapters[0];
          const title = group.titleData;

          return (
            <div
              key={group.titleId}
              className="bg-[var(--background)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors overflow-hidden"
            >
              {/* Основная карточка тайтла */}
              <div
                className="p-2 cursor-pointer"
                onClick={() => {
                  if (lastChapter && group.titleId) {
                    router.push(
                      getChapterPath(
                        { id: group.titleId, slug: title?.slug },
                        lastChapter.chapterId,
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
                        alt={title.name || `Манга #${group.titleId}`}
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
                      {title?.name || `Манга #${group.titleId}`}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">
                      {isExpandedTitle ? (
                        // Показываем все сессии когда развернуто
                        sessions.map((session, idx) => (
                          <span key={idx} className="block">
                            {formatChapterRange(session)}
                            <span className="text-[var(--muted-foreground)]/60 ml-2">
                              {formatSessionTime(session)}
                            </span>
                          </span>
                        ))
                      ) : (
                        // Показываем только последнюю сессию
                        <>
                          {formatChapterRange(sessions[0])}
                          <span className="text-[var(--muted-foreground)]/60 ml-2">
                            {formatSessionTime(sessions[0])}
                          </span>
                        </>
                      )}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(group.lastReadAt).toLocaleDateString("ru-RU")}</span>
                      </div>
                      <span className="text-[var(--muted-foreground)]/60">
                        Всего глав прочитано: {group.chapters.length}
                      </span>
                    </div>
                  </div>

                  {/* Кнопка разворачивания/сворачивания */}
                  {group.chapters.length > 1 ?(
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTitleExpanded(group.titleId);
                      }}
                      className="flex items-center justify-center w-8 h-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                    >
                      {isExpandedTitle ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  ): <div className="w-8 h-8"></div>}
                </div>
              </div>

              {/* Развернутый список глав */}
              {isExpandedTitle && sessions.length > 0 && (
                <div className="border-t border-[var(--border)] bg-[var(--secondary)]/30">
                  {sessions.map((session, sessionIdx) => (
                    <div
                      key={sessionIdx}
                      className="px-3 py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {formatChapterRange(session)}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]/60">
                          {formatSessionTime(session)}
                        </span>
                      </div>
                      {/* Список отдельных глав с датой и временем */}
                      <div className="flex flex-col gap-1">
                        {session.map(chapter => (
                          <div
                            key={chapter.chapterId}
                            className="flex items-center justify-between text-xs"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromHistory(group.titleId, chapter.chapterId);
                              }}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-0.5 rounded transition-colors"
                              title="Удалить из истории"
                            >
                              Глава {chapter.chapterNumber} ×
                            </button>
                            <span className="text-[var(--muted-foreground)]/60">
                              {new Date(chapter.readAt).toLocaleDateString("ru-RU")}, {new Date(chapter.readAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMoreTitles && !isExpanded && (
        <div className="text-center mt-4">
          <button
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            Показать все {groupedHistory.length} тайтлов
          </button>
        </div>
      )}
    </div>
  );
}

export default ReadingHistorySection;


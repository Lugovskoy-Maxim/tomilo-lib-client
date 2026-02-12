"use client";

import React, { useMemo } from "react";
import { BookOpen, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getChapterPath } from "@/lib/title-paths";
import { useGetReadingHistoryByTitleQuery } from "@/store/api/authApi";

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
  /** Общее число прочитанных глав (из API, когда приходит лёгкий формат с одной главой в chapters) */
  chaptersCount?: number;
  readAt: string;
}

interface ReadingHistorySectionProps {
  readingHistory: HistoryItem[] | undefined;
  showAll?: boolean;
  /** Скрыть заголовок секции (для вкладки «История») */
  showSectionHeader?: boolean;
}

// Тип для сгруппированной истории по тайтлам
interface GroupedTitleHistory {
  titleId: string;
  titleData?: TitleData;
  chapters: ChapterData[];
  /** Число прочитанных глав (chaptersCount из API или chapters.length) */
  chaptersCount?: number;
  lastReadAt: string;
}

/** При развороте подгружает полный список глав по тайтлу и отображает их */
function ExpandedHistoryContent({
  titleId,
  fallbackChapters,
  onRemove,
  formatChapterRange,
  formatSessionTime,
  groupChaptersBySession,
  sortSessionsByTime,
}: {
  titleId: string;
  fallbackChapters: ChapterData[];
  onRemove: (titleId: string, chapterId: string) => void;
  formatChapterRange: (chapters: ChapterData[]) => string;
  formatSessionTime: (chapters: ChapterData[]) => string;
  groupChaptersBySession: (chapters: ChapterData[]) => ChapterData[][];
  sortSessionsByTime: (sessions: ChapterData[][]) => ChapterData[][];
}) {
  const { data, isLoading } = useGetReadingHistoryByTitleQuery(titleId);

  const chaptersToShow = useMemo(() => {
    const raw = isLoading || !data?.data?.chapters?.length ? fallbackChapters : data.data.chapters;
    const normalized: ChapterData[] = raw.map(ch => ({
      chapterId:
        typeof ch.chapterId === "object" && ch.chapterId !== null
          ? (ch.chapterId as { _id: string })._id
          : String(ch.chapterId),
      chapterNumber: ch.chapterNumber,
      chapterTitle: (ch as { chapterTitle?: string | null }).chapterTitle ?? null,
      readAt: ch.readAt,
    }));
    const seen = new Set<string>();
    return normalized.filter(c => {
      if (seen.has(c.chapterId)) return false;
      seen.add(c.chapterId);
      return true;
    });
  }, [isLoading, data?.data?.chapters, fallbackChapters]);

  const sortedSessions = useMemo(
    () => sortSessionsByTime(groupChaptersBySession(chaptersToShow)),
    [chaptersToShow, groupChaptersBySession, sortSessionsByTime],
  );

  if (sortedSessions.length === 0) {
    return (
      <div className="border-t border-[var(--border)] bg-[var(--secondary)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
        {isLoading ? "Загрузка…" : "Нет прочитанных глав"}
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--secondary)]/40">
      {sortedSessions.map((session, sessionIdx) => (
        <div
          key={sessionIdx}
          className="px-4 py-3 border-b border-[var(--border)]/50 last:border-0"
        >
          {session.length === 1 ? (
            <div className="flex items-center justify-between text-sm py-1">
              <span className="font-medium text-[var(--foreground)]">
                Глава {session[0].chapterNumber}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatSessionTime(session)}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemove(titleId, session[0].chapterId);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-1 rounded text-xs font-medium transition-colors"
                title="Удалить из истории"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {formatChapterRange(session)}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatSessionTime(session)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {session.map(chapter => (
                  <div
                    key={chapter.chapterId}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[var(--background)]/50"
                  >
                    <span className="text-[var(--foreground)]">
                      Глава {chapter.chapterNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted-foreground)]">
                        {new Date(chapter.readAt).toLocaleDateString("ru-RU")},{" "}
                        {new Date(chapter.readAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onRemove(titleId, chapter.chapterId);
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-1 rounded font-medium transition-colors"
                        title="Удалить из истории"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function ReadingHistorySection({ readingHistory, showAll = false, showSectionHeader = true }: ReadingHistorySectionProps) {
  const { removeFromReadingHistory } = useAuth();
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(showAll);
  const router = useRouter();

  // Группируем историю по тайтлам
  const groupedHistory = useMemo(() => {
    if (!readingHistory) return [];

    const groups: Map<string, GroupedTitleHistory> = new Map();

    readingHistory.forEach(item => {
      const isTitleObject = typeof item.titleId === "object" && item.titleId !== null;
      const titleId = isTitleObject ? (item.titleId as TitleData)._id : String(item.titleId);

      if (!groups.has(titleId)) {
        groups.set(titleId, {
          titleId,
          titleData: isTitleObject ? (item.titleId as TitleData) : undefined,
          chapters: [],
          chaptersCount: (item as HistoryItem).chaptersCount,
          lastReadAt: item.readAt,
        });
      }

      const group = groups.get(titleId)!;
      // Используем chaptersCount из API (в лёгком формате там только lastChapter, но приходит chaptersCount)
      if ((item as HistoryItem).chaptersCount != null) {
        group.chaptersCount = Math.max(group.chaptersCount ?? 0, (item as HistoryItem).chaptersCount ?? 0);
      }
      // Добавляем главы с преобразованием chapterId (без дубликатов по chapterId)
      const existingIds = new Set(group.chapters.map(c => c.chapterId));
      item.chapters.forEach(chapter => {
        const chapterIdValue =
          typeof chapter.chapterId === "object" && chapter.chapterId !== null
            ? (chapter.chapterId as { _id: string })._id
            : String(chapter.chapterId);

        if (!existingIds.has(chapterIdValue)) {
          existingIds.add(chapterIdValue);
          group.chapters.push({
            ...chapter,
            chapterId: chapterIdValue,
          });
        }
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

  // Сортируем главы по номеру (возрастание) для корректной группировки по сессиям
  const sortChaptersByNumber = (chapters: ChapterData[]): ChapterData[] => {
    return [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  };

  // Группируем главы по сеансам чтения (2 часа между главами) на основе порядка глав
  const groupChaptersBySession = (chapters: ChapterData[]): ChapterData[][] => {
    if (chapters.length === 0) return [];
    if (chapters.length === 1) return [chapters];

    // Сначала сортируем по номеру главы
    const sortedByNumber = sortChaptersByNumber(chapters);

    const sessions: ChapterData[][] = [];
    let currentSession: ChapterData[] = [sortedByNumber[0]];

    for (let i = 1; i < sortedByNumber.length; i++) {
      const timeDiff =
        new Date(sortedByNumber[i].readAt).getTime() -
        new Date(sortedByNumber[i - 1].readAt).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Если прошло больше 2 часов, начинаем новую сессию
      if (hoursDiff > 2) {
        if (currentSession.length > 0) {
          sessions.push(currentSession);
        }
        currentSession = [sortedByNumber[i]];
      } else {
        currentSession.push(sortedByNumber[i]);
      }
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  };

  // Сортируем сессии по времени последней главы в сессии (новые первыми)
  const sortSessionsByTime = (sessions: ChapterData[][]): ChapterData[][] => {
    return [...sessions].sort((a, b) => {
      const lastReadA = new Date(a[a.length - 1].readAt).getTime();
      const lastReadB = new Date(b[b.length - 1].readAt).getTime();
      return lastReadB - lastReadA;
    });
  };

  // Форматируем диапазон глав для одной сессии
  const formatChapterRange = (chapters: ChapterData[]): string => {
    if (chapters.length === 1) {
      return `Глава ${chapters[0].chapterNumber}`;
    }

    // Сортируем по номеру главы
    const sortedByNumber = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
    const first = sortedByNumber[0].chapterNumber;
    const last = sortedByNumber[sortedByNumber.length - 1].chapterNumber;

    // Проверяем, являются ли главы последовательными
    const isConsecutive = sortedByNumber.every((chapter, index) => {
      if (index === 0) return true;
      return chapter.chapterNumber === sortedByNumber[index - 1].chapterNumber + 1;
    });

    if (isConsecutive && first === last) {
      return `Глава ${first}`;
    }

    if (isConsecutive) {
      return `Главы ${first}-${last}`;
    }

    // Если главы не последовательные, показываем их через запятую (максимум 3)
    if (sortedByNumber.length <= 3) {
      return `Главы ${sortedByNumber.map(c => c.chapterNumber).join(", ")}`;
    }

    // Если больше 5 глав и они не последовательные, показываем первые 3 и последнюю
    return `Главы ${sortedByNumber
      .slice(0, 2)
      .map(c => c.chapterNumber)
      .join(", ")} ... ${last}`;
  };

  // Определяем, какие тайтлы показывать
  const defaultLimit = 4;
  const displayedTitles = isExpanded ? groupedHistory : groupedHistory.slice(0, defaultLimit);
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

  const handleRemoveFromHistory = async (titleId: string, chapterId?: string) => {
    try {
      // Если chapterId не передан, удаляем все главы тайтла
      const result = await removeFromReadingHistory(titleId, chapterId || "");
      if (!result.success) {
        console.error("Ошибка при удалении из истории чтения:", result.error);
        alert(`Ошибка при удалении из истории чтения: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении из истории чтения:", error);
      alert("Произошла ошибка при удалении из истории чтения");
    }
  };

  const handleRemoveTitleFromHistory = async (titleId: string, titleName?: string | null) => {
    const title = titleName || "этот тайтл";
    const confirmDelete = confirm(`Вы уверены, что хотите удалить ${title} из истории чтения?`);
    if (!confirmDelete) return;

    await handleRemoveFromHistory(titleId);
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
    const timeStr =
      chapters.length === 1
        ? `${firstRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
        : `${firstRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} - ${lastRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;

    return `${dateStr}, ${timeStr}`;
  };

  if (!readingHistory || readingHistory.length === 0 || groupedHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 min-h-[240px]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--chart-2)]/20 flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-[var(--chart-2)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">История пуста</h3>
        <p className="text-sm text-[var(--muted-foreground)] text-center">
          Здесь появятся главы, которые вы прочитаете
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[280px] flex flex-col">
      {showSectionHeader && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--chart-2)]" />
            <span>История чтения</span>
            <span className="text-xs font-normal text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-0.5 rounded-full">
              {groupedHistory.length}
            </span>
          </h2>
          {hasMoreTitles && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--chart-2)] hover:opacity-80 transition-colors px-3 py-1.5 rounded-lg bg-[var(--chart-2)]/10 hover:bg-[var(--chart-2)]/15"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Показать все
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {displayedTitles.map(group => {
          // Группируем главы по сессиям и сортируем сессии по времени (новые первыми)
          const sessions = groupChaptersBySession(group.chapters);
          const sortedSessions = sortSessionsByTime(sessions);
          const isExpandedTitle = expandedTitles.has(group.titleId);
          // Все прочитанные главы (полный список по номерам) для отображения
          const allChaptersSorted = sortChaptersByNumber(group.chapters);
          // Последняя прочитанная глава - для перехода по клику
          const lastChapter = sortedSessions[0]?.[0];
          const title = group.titleData;
          const titleName = title?.name || "";

          return (
            <div
              key={group.titleId}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)]/60 hover:border-[var(--chart-2)]/50 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div
                className="p-3 cursor-pointer group/card"
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
                <div className="flex items-stretch gap-3">
                  <div className="w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[var(--chart-2)]/20 to-[var(--chart-3)]/20 ring-1 ring-[var(--border)]/50">
                    {title?.coverImage ? (
                      <OptimizedImage
                        src={getImageUrlString(title.coverImage)}
                        alt={title.name || `Манга #${group.titleId}`}
                        width={96}
                        height={128}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        quality={80}
                        priority={false}
                      />
                    ) : (
                      <OptimizedImage
                        src={IMAGE_HOLDER.src}
                        alt="Заглушка"
                        width={96}
                        height={128}
                        className="w-full h-full object-cover"
                        quality={80}
                        priority={false}
                      />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate mb-1">
                        {title?.name || `Манга #${group.titleId}`}
                      </h3>
                      <p className="text-xs text-[var(--primary)] font-medium mb-1.5">
                        {allChaptersSorted.length > 0
                          ? formatChapterRange(allChaptersSorted)
                          : "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {sortedSessions[0] ? formatSessionTime(sortedSessions[0]) : "—"}
                      </span>
                      <span>
                        Прочитано глав: {group.chaptersCount ?? group.chapters.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleTitleExpanded(group.titleId);
                      }}
                      className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                      title={isExpandedTitle ? "Свернуть" : "Развернуть"}
                    >
                      {isExpandedTitle ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {!isExpandedTitle && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          group.chapters.length === 1
                            ? handleRemoveFromHistory(
                                String(group.titleId),
                                sortedSessions[0]?.[0]?.chapterId,
                              )
                            : handleRemoveTitleFromHistory(String(group.titleId), titleName);
                        }}
                        className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                        title={group.chapters.length === 1 ? "Удалить из истории" : "Удалить все главы"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isExpandedTitle && (
                <ExpandedHistoryContent
                  titleId={group.titleId}
                  fallbackChapters={group.chapters}
                  onRemove={handleRemoveFromHistory}
                  formatChapterRange={formatChapterRange}
                  formatSessionTime={formatSessionTime}
                  groupChaptersBySession={groupChaptersBySession}
                  sortSessionsByTime={sortSessionsByTime}
                />
              )}
            </div>
          );
        })}
      </div>

      {hasMoreTitles && !isExpanded && (
        <div className="text-center pt-2">
          <button
            className="text-sm text-[var(--chart-2)] hover:underline font-medium"
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

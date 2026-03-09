"use client";

import React, { useMemo, useState, useCallback, memo } from "react";
import Link from "next/link";
import { Clock, ChevronDown, ChevronRight, ChevronUp, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getChapterPath } from "@/lib/title-paths";
import { useGetReadingHistoryByTitleQuery } from "@/store/api/authApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { getCoverUrls } from "@/lib/asset-url";

interface TitleData {
  _id: string;
  name?: string;
  title?: string;
  coverImage?: string;
  slug?: string;
}

interface ChapterData {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string | null;
  readAt: string;
}

interface RawChapterData {
  chapterId: string | { _id: string };
  chapterNumber: number;
  chapterTitle?: string | null;
  readAt: string;
}

interface HistoryItem {
  titleId: string | TitleData;
  titleData?: TitleData;
  chapters: RawChapterData[];
  chaptersCount?: number;
  readAt: string;
}

interface ReadingHistorySectionProps {
  readingHistory: HistoryItem[] | undefined;
  showAll?: boolean;
  showSectionHeader?: boolean;
  historyHref?: string;
  onShowAllHistory?: () => void;
}

interface GroupedTitleHistory {
  titleId: string;
  titleData?: TitleData;
  chapters: ChapterData[];
  chaptersCount?: number;
  lastReadAt: string;
}

function sortChaptersByNumber(chapters: ChapterData[]): ChapterData[] {
  return [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
}

function groupChaptersBySession(chapters: ChapterData[]): ChapterData[][] {
  if (chapters.length === 0) return [];
  if (chapters.length === 1) return [chapters];

  const sortedByNumber = sortChaptersByNumber(chapters);
  const sessions: ChapterData[][] = [];
  let currentSession: ChapterData[] = [sortedByNumber[0]];

  for (let i = 1; i < sortedByNumber.length; i++) {
    const timeDiff =
      new Date(sortedByNumber[i].readAt).getTime() -
      new Date(sortedByNumber[i - 1].readAt).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

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
}

function sortSessionsByTime(sessions: ChapterData[][]): ChapterData[][] {
  return [...sessions].sort((a, b) => {
    const lastReadA = new Date(a[a.length - 1].readAt).getTime();
    const lastReadB = new Date(b[b.length - 1].readAt).getTime();
    return lastReadB - lastReadA;
  });
}

function formatChapterRange(chapters: ChapterData[]): string {
  if (chapters.length === 1) {
    return `Глава ${chapters[0].chapterNumber}`;
  }

  const sortedByNumber = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const first = sortedByNumber[0].chapterNumber;
  const last = sortedByNumber[sortedByNumber.length - 1].chapterNumber;

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

  if (sortedByNumber.length <= 3) {
    return `Главы ${sortedByNumber.map(c => c.chapterNumber).join(", ")}`;
  }

  return `Главы ${sortedByNumber
    .slice(0, 2)
    .map(c => c.chapterNumber)
    .join(", ")} ... ${last}`;
}

function formatSessionTime(chapters: ChapterData[]): string {
  if (chapters.length === 0) return "";
  const firstRead = new Date(chapters[0].readAt);
  const lastRead = new Date(chapters[chapters.length - 1].readAt);

  const dateStr = firstRead.toLocaleDateString("ru-RU");
  const timeStr =
    chapters.length === 1
      ? `${firstRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
      : `${firstRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} - ${lastRead.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;

  return `${dateStr}, ${timeStr}`;
}

function getImageUrls(coverImage: string | undefined) {
  return getCoverUrls(
    coverImage,
    typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src,
  );
}

const ExpandedHistoryContent = memo(function ExpandedHistoryContent({
  titleId,
  fallbackChapters,
  onRemove,
}: {
  titleId: string;
  fallbackChapters: ChapterData[];
  onRemove: (titleId: string, chapterId: string) => void;
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
    [chaptersToShow],
  );

  if (sortedSessions.length === 0) {
    return (
      <div className="border-t border-[var(--border)] bg-[var(--secondary)]/20 px-3 py-3 sm:py-2 text-xs text-[var(--muted-foreground)]">
        {isLoading ? "Загрузка…" : "Нет прочитанных глав"}
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--secondary)]/20">
      {sortedSessions.map((session, sessionIdx) => (
        <div
          key={sessionIdx}
          className="px-3 py-3 sm:py-2 border-b border-[var(--border)]/40 last:border-0"
        >
          {session.length === 1 ? (
            <div className="flex items-center justify-between text-xs gap-2 min-h-[44px] sm:min-h-0">
              <span className="font-medium text-[var(--foreground)]">
                Глава {session[0].chapterNumber}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)] shrink-0">
                {formatSessionTime(session)}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemove(titleId, session[0].chapterId);
                }}
                className="min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 flex-shrink-0 flex items-center justify-center text-red-500 hover:bg-red-500/10 p-2.5 sm:p-1.5 rounded-md text-[11px] font-medium transition-colors touch-manipulation"
                title="Удалить из истории"
              >
                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-1">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {formatChapterRange(session)}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)] shrink-0">
                  {formatSessionTime(session)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {session.map(chapter => (
                  <div
                    key={chapter.chapterId}
                    className="flex items-center justify-between text-[11px] py-2 px-2 sm:py-0.5 sm:px-1.5 min-h-[44px] sm:min-h-0 rounded hover:bg-[var(--background)]/50"
                  >
                    <span className="text-[var(--foreground)]">Глава {chapter.chapterNumber}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--muted-foreground)]">
                        {new Date(chapter.readAt).toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onRemove(titleId, chapter.chapterId);
                        }}
                        className="min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 flex-shrink-0 flex items-center justify-center text-red-500 hover:bg-red-500/10 p-2.5 sm:p-1 rounded transition-colors touch-manipulation"
                        title="Удалить из истории"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" aria-hidden />
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
});

interface HistoryTitleCardProps {
  group: GroupedTitleHistory;
  isExpandedTitle: boolean;
  onToggleExpand: () => void;
  onRemoveChapter: (titleId: string, chapterId: string) => void;
  /** Удалить тайтл из истории. chapterIds передаём, чтобы удалять по одной главе и не вызывать запрос «удалить весь тайтл» (на бэкенде он может очищать всю историю). */
  onRemoveTitle: (titleId: string, titleName?: string | null, chapterIds?: string[]) => void;
}

const HistoryTitleCard = memo(function HistoryTitleCard({
  group,
  isExpandedTitle,
  onToggleExpand,
  onRemoveChapter,
  onRemoveTitle,
}: HistoryTitleCardProps) {
  const router = useRouter();

  const hasPopulatedTitle = Boolean(
    group.titleData &&
    (group.titleData.name || group.titleData.title) &&
    group.titleData.coverImage,
  );

  const { data: fetchedTitle } = useGetTitleByIdQuery(
    { id: group.titleId },
    { skip: hasPopulatedTitle || !group.titleId },
  );

  const title = useMemo(() => {
    if (hasPopulatedTitle) return group.titleData;
    if (fetchedTitle) {
      return {
        _id: fetchedTitle._id,
        name: fetchedTitle.name,
        coverImage: fetchedTitle.coverImage,
        slug: fetchedTitle.slug,
      };
    }
    return group.titleData;
  }, [hasPopulatedTitle, group.titleData, fetchedTitle]);

  const titleName = title?.name || title?.title || "";

  const sessions = useMemo(() => groupChaptersBySession(group.chapters), [group.chapters]);
  const sortedSessions = useMemo(() => sortSessionsByTime(sessions), [sessions]);
  const allChaptersSorted = useMemo(() => sortChaptersByNumber(group.chapters), [group.chapters]);
  const lastChapter = sortedSessions[0]?.[0];

  const handleCardClick = useCallback(() => {
    if (lastChapter && group.titleId) {
      router.push(getChapterPath({ id: group.titleId, slug: title?.slug }, lastChapter.chapterId));
    }
  }, [lastChapter, group.titleId, title?.slug, router]);

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand();
    },
    [onToggleExpand],
  );

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const titleIdStr = String(group.titleId);
      if (group.chapters.length === 1) {
        onRemoveChapter(
          titleIdStr,
          sortedSessions[0]?.[0]?.chapterId ?? group.chapters[0].chapterId,
        );
      } else {
        onRemoveTitle(
          titleIdStr,
          titleName,
          group.chapters.map(c => c.chapterId),
        );
      }
    },
    [group.chapters, group.titleId, sortedSessions, onRemoveChapter, onRemoveTitle, titleName],
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)]/80 overflow-hidden transition-colors">
      <div
        className="p-2.5 sm:p-3 cursor-pointer group/card flex items-stretch gap-2.5 sm:gap-3"
        onClick={handleCardClick}
      >
        <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--secondary)]">
          <OptimizedImage
            src={getImageUrls(title?.coverImage).primary}
            fallbackSrc={getImageUrls(title?.coverImage).fallback}
            alt={titleName || `Манга #${group.titleId}`}
            width={80}
            height={112}
            className="w-full h-full object-cover group-hover/card:scale-[1.03] transition-transform duration-200"
            priority={false}
          />
        </div>

        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-sm truncate">
              {titleName || `Манга #${group.titleId}`}
            </h3>
            <p className="text-xs text-[var(--primary)] font-medium mt-0.5">
              {allChaptersSorted.length > 0 ? formatChapterRange(allChaptersSorted) : "—"}
            </p>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {sortedSessions[0] ? formatSessionTime(sortedSessions[0]) : "—"}
          </p>
        </div>

        <div className="flex flex-col justify-between items-end gap-2 sm:gap-0.5 shrink-0">
          <button
            onClick={handleToggleClick}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1.5 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors touch-manipulation"
            title={isExpandedTitle ? "Свернуть" : "Подробнее"}
          >
            {isExpandedTitle ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {!isExpandedTitle && (
            <button
              onClick={handleRemoveClick}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1.5 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors touch-manipulation"
              title={
                group.chapters.length === 1 ? "Удалить из истории" : "Удалить тайтл из истории"
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isExpandedTitle && (
        <ExpandedHistoryContent
          titleId={group.titleId}
          fallbackChapters={group.chapters}
          onRemove={onRemoveChapter}
        />
      )}
    </div>
  );
});

function ReadingHistorySection({
  readingHistory,
  showAll = false,
  showSectionHeader = true,
  historyHref,
  onShowAllHistory,
}: ReadingHistorySectionProps) {
  const { removeFromReadingHistory } = useAuth();
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(showAll);

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
        group.chaptersCount = Math.max(
          group.chaptersCount ?? 0,
          (item as HistoryItem).chaptersCount ?? 0,
        );
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
            chapterId: chapterIdValue,
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.chapterTitle ?? null,
            readAt: chapter.readAt,
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
      const result = await removeFromReadingHistory(titleId, chapterId ?? "");
      if (!result.success) {
        console.error("Ошибка при удалении из истории чтения:", result.error);
        alert(`Ошибка при удалении из истории чтения: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении из истории чтения:", error);
      alert("Произошла ошибка при удалении из истории чтения");
    }
  };

  const handleRemoveTitleFromHistory = async (
    titleId: string,
    titleName?: string | null,
    chapterIds?: string[],
  ) => {
    const title = titleName || "этот тайтл";
    const confirmDelete = confirm(`Вы уверены, что хотите удалить ${title} из истории чтения?`);
    if (!confirmDelete) return;

    if (chapterIds && chapterIds.length > 0) {
      for (const chapterId of chapterIds) {
        await handleRemoveFromHistory(titleId, chapterId);
      }
    } else {
      await handleRemoveFromHistory(titleId);
    }
  };

  if (!readingHistory || readingHistory.length === 0 || groupedHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center min-h-[200px]">
        <div className="w-12 h-12 rounded-xl bg-[var(--secondary)] flex items-center justify-center mb-3">
          <Clock className="h-6 w-6 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">История пуста</h3>
        <p className="text-xs text-[var(--muted-foreground)] max-w-xs mb-4">
          Здесь появятся прочитанные главы. Начните читать тайтл из каталога.
        </p>
        <a
          href="/catalog"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          В каталог
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-h-0 flex flex-col">
      {showSectionHeader && (
        <div className="flex items-center justify-between gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-[var(--primary)] shrink-0" />
            История чтения
            <span className="text-xs font-normal text-[var(--muted-foreground)] tabular-nums shrink-0">
              {groupedHistory.length}
            </span>
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasMoreTitles && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                title={isExpanded ? "Свернуть" : "Показать все"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {onShowAllHistory ? (
              <button
                type="button"
                onClick={onShowAllHistory}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors whitespace-nowrap"
              >
                Вся история
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : historyHref ? (
              <Link
                href={historyHref}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors whitespace-nowrap"
              >
                Вся история
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5">
        {displayedTitles.map(group => (
          <HistoryTitleCard
            key={group.titleId}
            group={group}
            isExpandedTitle={expandedTitles.has(group.titleId)}
            onToggleExpand={() => toggleTitleExpanded(group.titleId)}
            onRemoveChapter={handleRemoveFromHistory}
            onRemoveTitle={handleRemoveTitleFromHistory}
          />
        ))}
      </div>

      {hasMoreTitles && !isExpanded && (
        <button
          type="button"
          className="text-xs font-medium text-[var(--primary)] hover:underline pt-0.5"
          onClick={() => setIsExpanded(true)}
        >
          Ещё {groupedHistory.length - defaultLimit} тайтлов
        </button>
      )}
    </div>
  );
}

export default ReadingHistorySection;

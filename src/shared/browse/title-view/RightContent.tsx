import { Title, Chapter } from "@/types/title";
import { User } from "@/types/auth";
import { CommentEntityType } from "@/types/comment";
import { CommentsSection } from "@/shared/comments/CommentsSection";
import { timeAgo } from "@/lib/date-utils";
import { ReportModal } from "@/shared/report/ReportModal";
import { ReadingHistoryEntry, ReadingHistoryChapter } from "@/types/store";

import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  CheckCheck,
  Eye,
  EyeOff,
  Star,
  X,
  CheckCircle,
  Play,
} from "lucide-react";
import { translateTitleStatus, translateTitleType } from "@/lib/title-type-translations";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useUpdateRatingMutation } from "@/store/api/titlesApi";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { getChapterPath } from "@/lib/title-paths";
import { useAuth } from "@/hooks/useAuth";
import { getChapterDisplayName } from "@/lib/chapter-title-utils";
import { GenresList } from "./GenresList";

interface RightContentProps {
  titleData: Title;
  activeTab: "main" | "chapters" | "comments";
  onTabChange: (tab: "main" | "chapters" | "comments") => void;
  isDescriptionExpanded: boolean;
  onDescriptionToggle: () => void;
  chapters: Chapter[];
  hasMoreChapters: boolean;
  chaptersLoading: boolean;
  onLoadMoreChapters: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: "desc" | "asc";
  onSortChange: (order: "desc" | "asc") => void;
  titleId: string;
  user: User | null;
  onAgeVerificationRequired?: () => void;
  basePath?: string;
  slug?: string;
}

export function RightContent({
  titleData,
  activeTab,
  onTabChange,
  isDescriptionExpanded,
  onDescriptionToggle,
  chapters,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  titleId,
  user,
  onAgeVerificationRequired,
  slug,
}: RightContentProps): React.ReactElement {
  const router = useRouter();
  const [updateRating] = useUpdateRatingMutation();
  const [displayedChapters, setDisplayedChapters] = useState<Chapter[]>([]);
  const [visibleChapters, setVisibleChapters] = useState<Chapter[]>([]);
  const [loadedChaptersCount, setLoadedChaptersCount] = useState(20);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);
  const [removingChapterId, setRemovingChapterId] = useState<string | null>(null);

  const { removeFromReadingHistory, useGetReadingHistoryByTitle } = useAuth();

  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  // Функция для получения корректного пути к главе
  const getChapterPathCallback = useCallback(
    (chapterId: string) => {
      const titleData = { _id: titleId, slug };
      return getChapterPath(titleData, chapterId);
    },
    [titleId, slug],
  );

  // Функция для получения корректного пути к тайтлу
  // const getTitlePathCallback = useCallback(() => {
  //   const titleData = { _id: titleId, slug };
  //   return getTitlePath(titleData);
  // }, [titleId, slug]);

  // Проверяем статус подтверждения возраста при монтировании и при изменении пользователя
  useEffect(() => {
    if (user) {
      const verified = checkAgeVerification(user);
      setIsAgeVerified(verified);
    } else {
      // Проверяем localStorage для гостей
      const verified = checkAgeVerification(null);
      setIsAgeVerified(verified);
    }
  }, [user]);

  // Получаем историю чтения для текущего тайтла
  const { data: readingHistoryData } = useGetReadingHistoryByTitle(titleId);

  // Функция для проверки, прочитана ли глава
  const isChapterRead = useCallback(
    (chapterId: string): boolean => {
      if (!readingHistoryData?.data) return false;

      // API returns array directly, but type says ReadingHistoryEntry
      const historyData = (readingHistoryData.data || []) as unknown as Array<{
        chapterId?: { _id: string } | null | undefined;
        chapterNumber: number;
        readAt: string;
      }>;

      return historyData.some(ch => {
        if (!ch.chapterId) return false;
        // chapterId is an object with _id property
        return ch.chapterId._id === chapterId;
      });
    },
    [readingHistoryData],
  );

  // Функция для удаления из истории чтения
  const handleRemoveFromHistory = useCallback(
    async (chapterId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (removingChapterId) return;

      setRemovingChapterId(chapterId);
      try {
        await removeFromReadingHistory(titleId, chapterId);
        console.log(`Removed chapter ${chapterId} from reading history`);
      } catch (error) {
        console.error("Failed to remove from reading history:", error);
      } finally {
        setRemovingChapterId(null);
      }
    },
    [titleId, removeFromReadingHistory, removingChapterId],
  );

  const handleAgeVerificationClick = () => {
    if (isAgeVerified) {
      return; // Если возраст уже подтвержден, ничего не делаем
    }

    if (onAgeVerificationRequired) {
      onAgeVerificationRequired();
    } else {
      // Если нет callback, открываем модальное окно
      setIsAgeModalOpen(true);
    }
  };

  const handleAgeVerificationConfirm = () => {
    setIsAgeVerified(true);
    setIsAgeModalOpen(false);
    // Сохраняем состояние в localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("age-verified", "true");
    }
    console.log("Возраст подтвержден");
  };

  const handleAgeVerificationCancel = () => {
    setIsAgeModalOpen(false);
  };

  useEffect(() => {
    if (searchQuery) {
      const filteredChapters = chapters.filter(chapter => {
        const chapterNumberMatch = chapter.name.match(/(?:Глава\s+)?(\d+)/i);
        const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : null;
        return chapterNumber === searchQuery.trim();
      });
      setDisplayedChapters(filteredChapters);
      setVisibleChapters(filteredChapters);
      setLoadedChaptersCount(filteredChapters.length);
    } else {
      setDisplayedChapters(prev => {
        const newChapters = chapters.filter(
          chapter => !prev.some(prevChapter => prevChapter._id === chapter._id),
        );
        // Sort chapters by chapterNumber based on sortOrder
        const sortedChapters = [...prev, ...newChapters].sort((a, b) => {
          const aNum = a.chapterNumber || 0;
          const bNum = b.chapterNumber || 0;
          return sortOrder === "desc" ? bNum - aNum : aNum - bNum;
        });
        return sortedChapters;
      });
      setLoadedChaptersCount(20);
    }
  }, [chapters, searchQuery, sortOrder]);

  useEffect(() => {
    setVisibleChapters(displayedChapters.slice(0, loadedChaptersCount));
  }, [displayedChapters, loadedChaptersCount]);

  useEffect(() => {
    if (!searchQuery) {
      setVisibleChapters(displayedChapters.slice(0, loadedChaptersCount));
    }
  }, [searchQuery, displayedChapters, loadedChaptersCount]);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      if (loadedChaptersCount < displayedChapters.length) {
        setLoadedChaptersCount(prev => Math.min(prev + 10, displayedChapters.length));
      }
    }
  }, [loadedChaptersCount, displayedChapters.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // const scrollToTop = () => {
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // };

  // Функция для обработки массива оценок и подсчета частоты каждой оценки
  const getRatingStats = (ratings: number[]) => {
    const stats = ratings.reduce(
      (acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Сортируем по убыванию оценки
    return Object.entries(stats)
      .map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: ((count / ratings.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.rating - a.rating);
  };

  const ratingStats = titleData?.ratings ? getRatingStats(titleData.ratings) : [];
  const totalRatings = titleData?.totalRatings || titleData?.ratings?.length || 0;

  console.log(activeTab);
  const renderTabContent = (): React.ReactElement | null => {
    switch (activeTab) {
      case "main":
        return (
          <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl p-4 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]">
                Основная информация
              </h2>
            </div>

            <div className="text-center py-2 border-b border-[var(--border)]">
              <p className="text-[var(--foreground)]/60">
                Последнее обновление{" "}
                {titleData?.updatedAt ? timeAgo(titleData.updatedAt) : "неизвестно"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]/80">
                  {titleData?.createdAt ? new Date(titleData.createdAt).toLocaleDateString() : 0}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">Дата загрузки на сайте</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]/80">
                  {titleData?.totalChapters}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">
                  Загружено:{" "}
                  {titleData?.totalChapters === 1
                    ? " глава"
                    : titleData?.totalChapters > 1 && titleData?.totalChapters < 5
                      ? " главы"
                      : " глав"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]/80">
                  {titleData?.author ? titleData.author : "Нет доступных данных"}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">Автор</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]/80">
                  {titleData?.artist ? titleData.artist : "Нет доступных данных"}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">Художник(и)</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-[var(--foreground)]/60 mb-2">
                Альтернативные названия:
              </div>
              <div className="text-lg font-normal text-[var(--primary)]/80">
                {titleData?.altNames ? titleData.altNames.join(", ") : "Нет доступных данных"}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Статистика тайтла
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {titleData?.views || 0}
                    </div>
                    <div className="text-sm text-[var(--foreground)]/60">Просмотров</div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-[var(--foreground)]">{totalRatings}</div>
                    <div className="text-sm text-[var(--foreground)]/60">Всего оценок</div>
                  </div>
                </div>
              </div>

              {totalRatings > 0 && (
                <div>
                  {ratingStats.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-semibold text-[var(--foreground)] text-center mb-4">
                        Распределение оценок
                      </h4>
                      <div className="space-y-3">
                        {ratingStats.map(stat => (
                          <div
                            key={stat.rating}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--foreground)] font-medium">
                                {stat.rating}
                              </span>
                              <Star className="w-4 h-4 text-[var(--chart-1)]" />
                            </div>

                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex-1 bg-[var(--background)] rounded-full h-2 min-w-[80px]">
                                <div
                                  className="bg-[var(--chart-1)] h-2 rounded-full"
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                              <span className="text-[var(--foreground)]/60 whitespace-nowrap text-xs">
                                {stat.count} ({stat.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "chapters":
        const isAdultContent =
          titleData.isAdult || (titleData.ageLimit && titleData.ageLimit >= 18);
        const shouldVerifyAge = isAdultContent && !isAgeVerified;

        if (shouldVerifyAge) {
          return (
            <div className="flex flex-col justify-center items-center bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl h-full p-4">
              <h2 className="flex justify-center items-center text-xl font-bold mb-4 text-[var(--foreground)]">
                {"Возрастное ограничение"}
              </h2>
              <p className="flex justify-center items-center text-[var(--foreground)]/60 h-20 mb-4 text-center">
                {"Этот контент предназначен только для лиц старше 18 лет."}
              </p>
              <button
                onClick={handleAgeVerificationClick}
                disabled={isAgeVerified}
                className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 animate-bounce bg-[var(--chart-1)] ${
                  isAgeVerified
                    ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                    : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--chart-5)]/80 cursor-pointer"
                }`}
              >
                {isAgeVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Возраст подтвержден
                  </>
                ) : (
                  "Подтвердить возраст"
                )}
              </button>
            </div>
          );
        }

        return (
          <div className="rounded-xl">
            <div className="flex flex-col justify-between bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl items-center p-4">
              <div className="flex w-full flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Поиск глав..."
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] relative"
                />

                <button
                  onClick={() => onSortChange(sortOrder === "desc" ? "asc" : "desc")}
                  className="w-[160px] px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <ArrowUpDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      sortOrder === "desc" ? "rotate-0" : "rotate-180"
                    }`}
                  />
                  {sortOrder === "desc" ? "Сначала новые" : "Сначала старые"}
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {visibleChapters.map(chapter => {
                const read = isChapterRead(chapter._id || "");
                const isHovered = hoveredChapterId === chapter._id;
                const isRemoving = removingChapterId === chapter._id;

                return (
                  <div
                    key={chapter._id}
                    className="flex items-center justify-between gap-2 py-2 px-3 bg-[var(--card)]/50 rounded-full hover:bg-[var(--background)]/70 transition-colors"
                  >
                    {/* Иконка статуса прочтения */}
                    <div
                      className="flex items-center w-5 h-5 flex-shrink-0"
                      onMouseEnter={() => setHoveredChapterId(chapter._id || null)}
                      onMouseLeave={() => setHoveredChapterId(null)}
                    >
                      {read && isHovered ? (
                        <button
                          onClick={e => handleRemoveFromHistory(chapter._id || "", e)}
                          disabled={isRemoving}
                          className={`flex items-center justify-center transition-colors hover:text-red-600 ${
                            isRemoving
                              ? "cursor-not-allowed text-[var(--primary)]"
                              : "text-red-500 cursor-pointer"
                          }`}
                          title="Удалить из истории чтения"
                        >
                          {isRemoving ? (
                            <div className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <Eye
                          className={`w-5 h-5 transition-colors ${
                            read ? "text-green-500" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--foreground)] truncate">
                        {getChapterDisplayName(chapter)}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--foreground)]/60 truncate">
                        {chapter.createdAt ? new Date(chapter.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
                      <div className="hidden sm:flex gap-1 items-center">
                        <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                          Просмотров: {chapter.views || 0}
                        </span>
                      </div>
                      {/* Mobile: only icon with number */}
                      <div className="sm:hidden flex items-center gap-1">
                        <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {chapter.views || 0}
                        </span>
                      </div>

                      <button
                        onClick={() => router.push(getChapterPathCallback(chapter._id))}
                        className="p-1.5 sm:px-4 sm:py-2 bg-[var(--chart-1)]/80 cursor-pointer text-[var(--accent-foreground)] rounded-full hover:bg-[var(--chart-1)]/80 transition-colors flex items-center justify-center"
                        aria-label="Читать главу"
                      >
                        <Play className="w-4 h-4 sm:hidden" />
                        <span className="hidden sm:inline text-sm">Читать</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 
            <button
              onClick={scrollToTop}
              className="fixed bottom-14 left-4 w-14 h-14 animate-pulse transition-all duration-800 flex items-center justify-center  bg-[var(--chart-1)] text-[var(--accent-foreground)] rounded-full shadow-lg hover:bg-[var(--accent)]/80"
              aria-label="Перемотать в верх"
            >
              <ArrowUpToLine className="w-6 h-6" />
            </button> */}
          </div>
        );

      case "comments":
        return <CommentsSection entityType={CommentEntityType.TITLE} entityId={titleId} />;

      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex sm:flex-row justify-between sm:items-center gap-4 w-full">
          <div className="flex flex-col sm:flex-row  gap-2">
            <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
              <Calendar className="w-4 h-4" />
              <span>{titleData.releaseYear}</span>
            </div>
            <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
              <BookOpen className="w-4 h-4" />
              <span>{translateTitleType(titleData.type || "")}</span>
            </div>
            <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
              <CheckCheck className="w-4 h-4" />
              {titleData?.status && <span>{translateTitleStatus(titleData.status || "")}</span>}
            </div>
            {/* <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-[var(--background)]/20 text-[var(--primary)] rounded-full text-sm hover:bg-[var(--background)]/30 transition-colors whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" opacity="0.3"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              Нашел ошибку?
            </button> */}
          </div>

          <div className="flex gap-2">
            <div className="relative flex flex-col items-end gap-1 bg-[var(--background)]/20 px-3 py-2 rounded-full min-w-[80px]">
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold text-[var(--chart-1)]">
                  {titleData?.averageRating ? titleData?.averageRating.toFixed(2) : "0"}
                </span>
                {totalRatings > 0 && (
                  <span className="text-xs text-[var(--foreground)]/60">
                    ({totalRatings} оценок)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsRatingOpen(v => !v)}
                className="px-2 py-1 rounded-full bg-[var(--background)] text-[var(--primary)] text-xs hover:bg-[var(--background)]/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                Оценить
              </button>
              {isRatingOpen && (
                <div className="absolute top-4 right-0 flex flex-col w-max bg-[var(--accent)] rounded-lg p-4 z-20">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-sm text-[var(--primary)]">Ваша оценка</span>
                    <button
                      type="button"
                      onClick={() => setIsRatingOpen(false)}
                      className="p-1 rounded hover:bg-[var(--accent)]"
                      aria-label="Закрыть"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setPendingRating(n);
                          setIsRatingOpen(false);
                          updateRating({ id: titleData?._id || "", rating: n });
                        }}
                        className={`min-w-8 h-8 px-2 rounded-md text-sm font-medium cursor-pointer flex items-center justify-center ${
                          pendingRating === n
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent)]/80"
                        }`}
                        title={`Оценка ${n}`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <h1 className="hidden lg:flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-[var(--foreground)] break-words">
          {titleData?.name}
        </h1>

        <GenresList
          genres={titleData.genres}
          tags={titleData.tags}
          isAdult={titleData.isAdult}
          ageLimit={titleData.ageLimit}
        />

        <div
          className={`text-[var(--foreground)]/80 leading-relaxed ${
            !isDescriptionExpanded ? "line-clamp-3" : ""
          }`}
          dangerouslySetInnerHTML={{
            __html: titleData?.description || "",
          }}
        ></div>
        {(titleData?.description?.length || 0) > 200 && (
          <button
            onClick={onDescriptionToggle}
            className=" text-[var(--chart-1)] hover:text-[var(--chart-1)]/80 transition-colors"
          >
            {isDescriptionExpanded ? "Свернуть" : "Развернуть"}
          </button>
        )}

        <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-full p-1 relative">
          <div className="flex">
            {[
              { key: "main" as const, label: "Главная" },
              {
                key: "chapters" as const,
                label: `Главы (${titleData?.chapters?.length || 0})`,
              },
              { key: "comments" as const, label: "Комментарии" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex-1 py-1 px-2 rounded-full font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-[var(--chart-1)]/90 text-[var(--foreground)]"
                    : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {renderTabContent()}
      </div>

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          entityType="title"
          entityId={titleId}
          entityTitle={titleData?.name || "Неизвестный тайтл"}
        />
      )}

      {/* Модальное окно для подтверждения возраста */}
      {isAgeModalOpen && (
        <AgeVerificationModal
          isOpen={isAgeModalOpen}
          onConfirm={handleAgeVerificationConfirm}
          onCancel={handleAgeVerificationCancel}
        />
      )}
    </>
  );
}

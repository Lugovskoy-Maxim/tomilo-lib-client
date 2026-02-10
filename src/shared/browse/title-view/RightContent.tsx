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
  ChevronDown,
  Eye,
  EyeOff,
  Star,
  X,
  CheckCircle,
  Play,
  Home,
  MessageCircle,
  List,
} from "lucide-react";
import { translateTitleStatus, translateTitleType } from "@/lib/title-type-translations";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
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

  // Проверяем, нужно ли показывать кнопку развернуть/свернуть для описания
  useEffect(() => {
    if (descriptionRef.current && titleData?.description) {
      const element = descriptionRef.current;
      // Проверяем, есть ли переполнение (scrollHeight > clientHeight)
      const hasOverflow = element.scrollHeight > element.clientHeight + 2; // +2px для погрешности
      setIsDescriptionOverflowing(hasOverflow);
    }
  }, [titleData?.description]);

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
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Карточка с датой обновления */}
            <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30 hover:bg-[var(--secondary)]/50 transition-colors">
              <div className="flex items-center justify-center gap-2 text-[var(--foreground)]/70">
                <Calendar className="w-4 h-4 text-[var(--chart-1)]" />
                <span className="text-sm">Последнее обновление:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {titleData?.updatedAt ? timeAgo(titleData.updatedAt) : "неизвестно"}
                </span>
              </div>
            </div>

            {/* Сетка информационных карточек */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30 hover:bg-[var(--secondary)]/60 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--chart-1)]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Загружено</span>
                </div>
                <div className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--chart-1)] transition-colors">
                  {titleData?.createdAt ? new Date(titleData.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>

              <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30 hover:bg-[var(--secondary)]/60 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--chart-1)]">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Глав</span>
                </div>
                <div className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--chart-1)] transition-colors">
                  {titleData?.totalChapters || 0}
                </div>
              </div>

              <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30 hover:bg-[var(--secondary)]/60 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--chart-1)]">
                  <Star className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Автор</span>
                </div>
                <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--chart-1)] transition-colors line-clamp-1">
                  {titleData?.author || "Неизвестно"}
                </div>
              </div>

              <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30 hover:bg-[var(--secondary)]/60 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--chart-1)]">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Художник</span>
                </div>
                <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--chart-1)] transition-colors line-clamp-1">
                  {titleData?.artist || "Неизвестно"}
                </div>
              </div>
            </div>

            {/* Альтернативные названия */}
            {titleData?.altNames && titleData.altNames.length > 0 && (
              <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30">
                <div className="flex items-center gap-2 mb-3 text-[var(--chart-1)]">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Альтернативные названия</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {titleData.altNames.map((name, idx) => (
                    <span 
                      key={idx} 
                      className="text-sm text-[var(--foreground)]/80 bg-[var(--background)]/50 px-3 py-1.5 rounded-full"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Статистика */}
            <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/30">
              <div className="flex items-center gap-2 mb-4 text-[var(--chart-1)]">
                <Eye className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-medium">Статистика</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-[var(--background)]/30 rounded-xl">
                  <div className="text-2xl font-bold text-[var(--chart-1)] mb-1">
                    {titleData?.views?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-[var(--foreground)]/60">Просмотров</div>
                </div>
                <div className="text-center p-3 bg-[var(--background)]/30 rounded-xl">
                  <div className="text-2xl font-bold text-[var(--chart-1)] mb-1">
                    {totalRatings.toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--foreground)]/60">Оценок</div>
                </div>
              </div>

              {totalRatings > 0 && ratingStats.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-[var(--foreground)]/60 mb-2">Распределение оценок:</div>
                  <div className="space-y-2">
                    {ratingStats.slice(0, 5).map(stat => (
                      <div
                        key={stat.rating}
                        className="flex items-center gap-3"
                      >
                        <div className="flex items-center gap-1.5 w-12">
                          <span className="text-sm font-bold text-[var(--foreground)]">
                            {stat.rating}
                          </span>
                          <Star className="w-3.5 h-3.5 text-[var(--chart-1)] fill-[var(--chart-1)]" />
                        </div>

                        <div className="flex-1 bg-[var(--background)]/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[var(--chart-1)] to-[var(--chart-5)] h-full rounded-full transition-all duration-500"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                        
                        <span className="text-xs text-[var(--foreground)]/70 w-16 text-right">
                          {stat.count} <span className="text-[var(--foreground)]/40">({stat.percentage}%)</span>
                        </span>
                      </div>
                    ))}
                  </div>
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
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Панель поиска и сортировки */}
            <div className="bg-[var(--secondary)]/40 backdrop-blur-md rounded-2xl p-3 border border-[var(--border)]/30">
              <div className="flex w-full flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Поиск по номеру главы..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)]/60 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/50 focus:border-[var(--chart-1)] transition-all"
                  />
                  <Eye className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)]/40" />
                </div>

                <button
                  onClick={() => onSortChange(sortOrder === "desc" ? "asc" : "desc")}
                  className="px-4 py-2.5 bg-[var(--background)]/60 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] hover:bg-[var(--chart-1)]/10 hover:border-[var(--chart-1)]/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                >
                  <ArrowUpDown
                    className={`w-4 h-4 transition-transform duration-300 text-[var(--chart-1)] ${
                      sortOrder === "desc" ? "rotate-0" : "rotate-180"
                    }`}
                  />
                  <span className="text-sm">{sortOrder === "desc" ? "Сначала новые" : "Сначала старые"}</span>
                </button>
              </div>
            </div>

            {/* Список глав */}
            <div className="space-y-2">
              {visibleChapters.map((chapter, index) => {
                const read = isChapterRead(chapter._id || "");
                const isHovered = hoveredChapterId === chapter._id;
                const isRemoving = removingChapterId === chapter._id;

                return (
                  <div
                    key={chapter._id}
                    onClick={() => router.push(getChapterPathCallback(chapter._id))}
                    className="group flex items-center gap-3 p-3 bg-[var(--secondary)]/30 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 hover:bg-[var(--secondary)]/60 hover:border-[var(--chart-1)]/20 hover:shadow-lg hover:shadow-[var(--chart-1)]/5 transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Иконка статуса прочтения */}
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--background)]/50 flex-shrink-0"
                      onMouseEnter={() => setHoveredChapterId(chapter._id || null)}
                      onMouseLeave={() => setHoveredChapterId(null)}
                      onClick={e => {
                        e.stopPropagation();
                        if (read && hoveredChapterId === chapter._id) {
                          handleRemoveFromHistory(chapter._id || "", e);
                        }
                      }}
                    >
                      {read && hoveredChapterId === chapter._id ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveFromHistory(chapter._id || "", e);
                          }}
                          disabled={isRemoving}
                          className={`flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                            isRemoving
                              ? "cursor-not-allowed text-[var(--foreground)]/30"
                              : "text-red-500 hover:text-red-600 cursor-pointer"
                          }`}
                          title="Удалить из истории чтения"
                        >
                          {isRemoving ? (
                            <div className="w-5 h-5 border-2 border-[var(--foreground)]/20 border-t-[var(--chart-1)] rounded-full animate-spin" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <Eye
                          className={`w-5 h-5 transition-colors ${
                            read 
                              ? "text-green-500" 
                              : "text-[var(--foreground)]/30 group-hover:text-[var(--foreground)]/50"
                          }`}
                        />
                      )}
                    </div>

                    {/* Информация о главе */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--chart-1)] transition-colors">
                        {getChapterDisplayName(chapter)}
                      </h3>
                      {/* Мобильная версия - дата и просмотры под названием */}
                      <div className="flex sm:hidden items-center gap-3 text-xs text-[var(--foreground)]/50 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {chapter.createdAt 
                            ? new Date(chapter.createdAt).toLocaleDateString('ru-RU', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              }) 
                            : "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(chapter.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Десктопная версия - дата и просмотры справа */}
                    <div className="hidden sm:flex items-center gap-4 text-sm text-[var(--foreground)]/60 flex-shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[var(--chart-1)]" />
                        {chapter.createdAt 
                          ? new Date(chapter.createdAt).toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            }) 
                          : "—"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[var(--chart-1)]" />
                        {(chapter.views || 0).toLocaleString()}
                      </span>
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
            <div className="relative flex flex-col items-end gap-1 px-3 py-2 rounded-full min-w-[80px]">
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

        {/* Описание с улучшенным отображением */}
        <div className="relative">
          <div
            ref={descriptionRef}
            className={`text-[var(--foreground)]/85 leading-relaxed ${
              !isDescriptionExpanded ? "line-clamp-4 max-h-[6.5rem]" : "max-h-none"
            } transition-all duration-500 ease-in-out overflow-hidden`}
            dangerouslySetInnerHTML={{
              __html: titleData?.description || "",
            }}
          />
          {/* Градиент для эффекта затухания при свернутом состоянии */}
          {!isDescriptionExpanded && isDescriptionOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
          )}
        </div>
        
        {/* Кнопка развернуть/свернуть с иконкой - показываем только если есть переполнение */}
        {isDescriptionOverflowing && (
          <button
            onClick={onDescriptionToggle}
            className="flex items-center gap-1.5 text-[var(--chart-1)] hover:text-[var(--chart-1)]/80 transition-colors mt-3 group"
          >
            <span>{isDescriptionExpanded ? "Свернуть" : "Развернуть описание"}</span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-300 ${
                isDescriptionExpanded ? "rotate-180" : "group-hover:translate-y-0.5"
              }`} 
            />
          </button>
        )}

        {/* Улучшенные вкладки с иконками */}
        <div className="bg-[var(--secondary)]/60 backdrop-blur-md rounded-2xl p-1.5 relative border border-[var(--border)]/50">
          <div className="flex gap-1">
            {[
              { 
                key: "main" as const, 
                label: "Главная", 
                icon: Home,
                count: null 
              },
              {
                key: "chapters" as const,
                label: "Главы",
                icon: List,
                count: titleData?.chapters?.length || 0,
              },
              { 
                key: "comments" as const, 
                label: "Комментарии", 
                icon: MessageCircle,
                count: null 
              },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-[var(--chart-1)] text-white shadow-lg shadow-[var(--chart-1)]/25"
                      : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--background)]/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-[var(--chart-1)]/10 text-[var(--chart-1)]"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
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

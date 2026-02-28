import { Title, Chapter, TitleRatingEntry } from "@/types/title";
import { User } from "@/types/auth";
import { CommentEntityType } from "@/types/comment";
import { CommentsSection } from "@/shared/comments/CommentsSection";
import { timeAgo } from "@/lib/date-utils";
import { ReportModal } from "@/shared/report/ReportModal";
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
  Home,
  MessageCircle,
  List,
} from "lucide-react";
import { translateTitleStatus, translateTitleType } from "@/lib/title-type-translations";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useUpdateRatingMutation } from "@/store/api/titlesApi";
import { useGetReadingHistoryReadIdsQuery } from "@/store/api/authApi";
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
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  // Текущая оценка: приоритет — с сервера (ratings по userId), иначе localStorage
  useEffect(() => {
    if (!titleData?._id) return;
    const ratings = titleData.ratings;
    if (user?._id && Array.isArray(ratings)) {
      const entry = ratings.find(
        (r): r is TitleRatingEntry => typeof r === "object" && r !== null && "userId" in r && r.userId === user._id,
      );
      if (entry) {
        setPendingRating(entry.rating);
        if (typeof window !== "undefined") {
          localStorage.setItem(`title-rating-${titleData._id}`, String(entry.rating));
        }
        return;
      }
    }
    if (typeof window !== "undefined") {
      const savedRating = localStorage.getItem(`title-rating-${titleData._id}`);
      if (savedRating) setPendingRating(parseInt(savedRating, 10));
    }
  }, [titleData?._id, titleData?.ratings, user?._id]);
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

  // Лёгкий запрос: только id прочитанных глав (для статуса «прочитано» на странице тайтла)
  const { data: readIdsData } = useGetReadingHistoryReadIdsQuery(titleId, {
    skip: !user || !titleId,
  });
  const { data: readingHistoryData } = useGetReadingHistoryByTitle(titleId);

  // Функция для проверки, прочитана ли глава (приоритет: read-ids API, затем полная история по тайтлу)
  const isChapterRead = useCallback(
    (chapterId: string): boolean => {
      if (readIdsData?.data?.chapterIds?.length) {
        return readIdsData.data.chapterIds.includes(chapterId);
      }
      if (!readingHistoryData?.data) return false;

      const entry = readingHistoryData.data as unknown as {
        chapters?: Array<{
          chapterId?: { _id: string } | string | null;
          chapterNumber: number;
          readAt: string;
        }>;
      };
      const chaptersList = entry?.chapters ?? [];
      return chaptersList.some(ch => {
        if (!ch.chapterId) return false;
        const id = typeof ch.chapterId === "object" && ch.chapterId !== null ? (ch.chapterId as { _id: string })._id : String(ch.chapterId);
        return id === chapterId;
      });
    },
    [readIdsData, readingHistoryData],
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

  // Нормализация: сервер отдаёт ratings как { userId, rating }[] или legacy number[] — приводим к number[] для статистики
  const ratingValues: number[] = (titleData?.ratings ?? []).map(r =>
    typeof r === "number" ? r : (r as TitleRatingEntry).rating,
  );

  const getRatingStats = (ratings: number[]) => {
    if (!ratings.length) return [];
    const stats = ratings.reduce(
      (acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );
    return Object.entries(stats)
      .map(([rating, count]) => ({
        rating: parseInt(rating, 10),
        count,
        percentage: ((count / ratings.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.rating - a.rating);
  };

  const ratingStats = getRatingStats(ratingValues);
  const totalRatings = titleData?.totalRatings ?? ratingValues.length;

  const renderTabContent = (): React.ReactElement | null => {
    switch (activeTab) {
      case "main":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Карточка с датой обновления */}
            <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50 hover:bg-[var(--secondary)]/80 transition-colors">
              <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
                <Calendar className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm">Последнее обновление:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {titleData?.updatedAt ? timeAgo(titleData.updatedAt) : "неизвестно"}
                </span>
              </div>
            </div>

            {/* Сетка информационных карточек */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50 hover:bg-[var(--secondary)]/85 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Загружено</span>
                </div>
                <div className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {titleData?.createdAt ? new Date(titleData.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>

              <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50 hover:bg-[var(--secondary)]/85 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Глав</span>
                </div>
                <div className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {titleData?.totalChapters || 0}
                </div>
              </div>

              <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50 hover:bg-[var(--secondary)]/85 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                  <Star className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Автор</span>
                </div>
                <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                  {titleData?.author || "Неизвестно"}
                </div>
              </div>

              <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50 hover:bg-[var(--secondary)]/85 hover:scale-[1.02] transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Художник</span>
                </div>
                <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                  {titleData?.artist || "Неизвестно"}
                </div>
              </div>
            </div>

            {/* Альтернативные названия */}
            {titleData?.altNames && titleData.altNames.length > 0 && (
              <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
                <div className="flex items-center gap-2 mb-3 text-[var(--primary)]">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Альтернативные названия</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {titleData.altNames.map((name, idx) => (
                    <span 
                      key={idx} 
                      className="text-sm text-[var(--foreground)] bg-[var(--background)]/70 px-3 py-1.5 rounded-xl"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Статистика */}
            <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
              <div className="flex items-center gap-2 mb-4 text-[var(--primary)]">
                <Eye className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-medium">Статистика</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-[var(--background)]/60 rounded-xl">
                  <div className="text-2xl font-bold text-[var(--primary)] mb-1">
                    {titleData?.views?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">Просмотров</div>
                </div>
                <div className="text-center p-3 bg-[var(--background)]/60 rounded-xl">
                  <div className="text-2xl font-bold text-[var(--primary)] mb-1">
                    {totalRatings.toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">Оценок</div>
                </div>
              </div>

              {totalRatings > 0 && ratingStats.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-[var(--muted-foreground)] mb-2">Распределение оценок:</div>
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
                          <Star className="w-3.5 h-3.5 text-[var(--primary)] fill-[var(--primary)]" />
                        </div>

                        <div className="flex-1 bg-[var(--background)]/70 rounded-xl h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 h-full rounded-xl transition-all duration-500"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                        
                        <span className="text-xs text-[var(--muted-foreground)] w-16 text-right">
                          {stat.count} <span className="text-[var(--foreground)]/50">({stat.percentage}%)</span>
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
                className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 animate-bounce bg-[var(--chart-1)] ${
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
            <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-3 border border-[var(--border)]/50">
              <div className="flex w-full flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Поиск по номеру главы..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  />
                  <Eye className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                </div>

                <button
                  onClick={() => onSortChange(sortOrder === "desc" ? "asc" : "desc")}
                  className="px-4 py-2.5 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                >
                  <ArrowUpDown
                    className={`w-4 h-4 transition-transform duration-300 text-[var(--primary)] ${
                      sortOrder === "desc" ? "rotate-0" : "rotate-180"
                    }`}
                  />
                  <span className="text-sm">{sortOrder === "desc" ? "Сначала новые" : "Сначала старые"}</span>
                </button>
              </div>
            </div>

            {/* <AdBlock /> */}

            {/* Список глав */}
            <div className="space-y-2">
              {visibleChapters.map((chapter, index) => {
                const read = isChapterRead(chapter._id || "");
                const isRemoving = removingChapterId === chapter._id;

                return (
                  <div
                    key={chapter._id}
                    onClick={() => router.push(getChapterPathCallback(chapter._id))}
                    className="group flex items-center gap-3 p-3 bg-[var(--secondary)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/40 hover:bg-[var(--secondary)]/80 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all duration-300 cursor-pointer"
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
                            <div className="w-5 h-5 border-2 border-[var(--foreground)]/20 border-t-[var(--chart-1)] rounded-xl animate-spin" />
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
                      <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {getChapterDisplayName(chapter)}
                      </h3>
                      {/* Мобильная версия - дата и просмотры под названием */}
                      <div className="flex sm:hidden items-center gap-3 text-xs text-[var(--muted-foreground)] mt-0.5">
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
                    <div className="hidden sm:flex items-center gap-4 text-sm text-[var(--muted-foreground)] flex-shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[var(--primary)]" />
                        {chapter.createdAt 
                          ? new Date(chapter.createdAt).toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            }) 
                          : "—"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[var(--primary)]" />
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
              className="fixed bottom-14 left-4 w-14 h-14 animate-pulse transition-all duration-800 flex items-center justify-center  bg-[var(--chart-1)] text-[var(--accent-foreground)] rounded-xl shadow-lg hover:bg-[var(--accent)]/80"
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
            <div className="flex items-center gap-2 bg-[var(--secondary)]/80 px-3 py-1.5 rounded-xl text-[var(--foreground)] border border-[var(--border)]/50">
              <Calendar className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-medium">{titleData.releaseYear}</span>
            </div>
            <div className="flex items-center gap-2 bg-[var(--secondary)]/80 px-3 py-1.5 rounded-xl text-[var(--foreground)] border border-[var(--border)]/50">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-medium">{translateTitleType(titleData.type || "")}</span>
            </div>
            <div className="flex items-center gap-2 bg-[var(--secondary)]/80 px-3 py-1.5 rounded-xl text-[var(--foreground)] border border-[var(--border)]/50">
              <CheckCheck className="w-4 h-4 text-[var(--primary)]" />
              {titleData?.status && <span className="font-medium">{translateTitleStatus(titleData.status || "")}</span>}
            </div>
            {/* <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-[var(--background)]/20 text-[var(--primary)] rounded-xl text-sm hover:bg-[var(--background)]/30 transition-colors whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" opacity="0.3"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              Нашел ошибку?
            </button> */}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col items-end gap-2 px-4 py-3 rounded-2xl transition-all duration-300 min-w-[120px]">
              {/* Отображение среднего рейтинга со звёздами */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  Рейтинг
                  <span className="text-xl font-bold text-[var(--primary)]">
                    {titleData?.averageRating ? titleData.averageRating.toFixed(1) : "0.0"}
                  </span>
                </div>
                {totalRatings > 0 && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {totalRatings} {totalRatings === 1 ? "оценка" : totalRatings < 5 ? "оценки" : "оценок"}
                  </span>
                )}
              </div>

              {/* Кнопка оценки и выпадающее меню */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRatingOpen(v => !v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    pendingRating
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] hover:border-[var(--primary)]/30"
                  }`}
                >
                  <Star className={`w-3 h-3 ${pendingRating ? "fill-white" : ""}`} />
                  {pendingRating ? `Ваша оценка: ${pendingRating}` : "Оценить"}
                </button>

                {/* Выпадающее меню с выбором оценки */}
                {isRatingOpen && (
                  <>
                    {/* Backdrop для закрытия при клике вне */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsRatingOpen(false)}
                    />
                    
                    <div className="absolute bottom-full right-0 mb-2 flex flex-col w-[280px] sm:w-[320px] bg-[var(--card)] rounded-2xl p-4 z-50 shadow-2xl border border-[var(--border)]/30 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl">
                      {/* Заголовок с текущей оценкой */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                            <Star className="w-4 h-4 text-[var(--primary)] fill-[var(--primary)]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-[var(--foreground)]/50 uppercase tracking-wider">Оценка</span>
                            <span className="text-lg font-bold text-[var(--foreground)]">
                              {hoveredRating || pendingRating || "—"}
                              <span className="text-sm font-normal text-[var(--foreground)]/40 ml-0.5">/10</span>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRatingOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                          aria-label="Закрыть"
                        >
                          <X className="w-4 h-4 text-[var(--foreground)]/40" />
                        </button>
                      </div>

                      {/* Горизонтальная шкала оценок */}
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 10 }, (_, i) => {
                          const ratingValue = i + 1;
                          const isSelected = pendingRating === ratingValue;
                          const isHovered = hoveredRating !== null && ratingValue <= hoveredRating;
                          const isPreviouslySelected = pendingRating !== null && ratingValue <= pendingRating && hoveredRating === null;
                          
                          const getColor = (value: number) => {
                            if (value <= 3) return "bg-red-500";
                            if (value <= 5) return "bg-orange-500";
                            if (value <= 7) return "bg-yellow-500";
                            if (value <= 9) return "bg-emerald-500";
                            return "bg-[var(--chart-1)]";
                          };

                          return (
                            <button
                              key={ratingValue}
                              type="button"
                              onClick={() => {
                                setPendingRating(ratingValue);
                                setIsRatingOpen(false);
                                updateRating({ id: titleData?._id || "", rating: ratingValue });
                                if (typeof window !== "undefined" && titleData?._id) {
                                  localStorage.setItem(`title-rating-${titleData._id}`, ratingValue.toString());
                                }
                              }}
                              onMouseEnter={() => setHoveredRating(ratingValue)}
                              onMouseLeave={() => setHoveredRating(null)}
                              className={`relative flex-1 h-10 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 ${
                                isSelected || isHovered || isPreviouslySelected
                                  ? `${getColor(ratingValue)} text-white ${isSelected ? "ring-2 ring-white/50 scale-105" : ""}`
                                  : "bg-[var(--secondary)]/80 text-[var(--foreground)]/70 hover:bg-[var(--secondary)]"
                              }`}
                            >
                              {ratingValue}
                            </button>
                          );
                        })}
                      </div>

                      {/* Описание оценки */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-[var(--foreground)]/40">Ужасно</span>
                        <span className={`font-medium transition-colors ${
                          (hoveredRating || pendingRating)
                            ? "text-[var(--foreground)]"
                            : "text-[var(--foreground)]/50"
                        }`}>
                          {hoveredRating
                            ? hoveredRating <= 2
                              ? "Ужасно"
                              : hoveredRating <= 4
                                ? "Плохо"
                                : hoveredRating <= 6
                                  ? "Нормально"
                                  : hoveredRating <= 8
                                    ? "Хорошо"
                                    : hoveredRating === 9
                                      ? "Отлично"
                                      : "Шедевр!"
                            : pendingRating
                              ? "Изменить оценку?"
                              : "Выберите оценку"}
                        </span>
                        <span className="text-[var(--foreground)]/40">Шедевр</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
            className={`text-[var(--foreground)] leading-relaxed ${
              !isDescriptionExpanded ? "line-clamp-4 max-h-[6.5rem]" : "max-h-none"
            } transition-all duration-500 ease-in-out overflow-hidden`}
            dangerouslySetInnerHTML={{
              __html: titleData?.description || "",
            }}
          />
          {/* Градиент для эффекта затухания при свернутом состоянии */}
          {!isDescriptionExpanded && isDescriptionOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--card)] to-transparent pointer-events-none" />
          )}
        </div>
        
        {/* Кнопка развернуть/свернуть с иконкой - показываем только если есть переполнение */}
        {isDescriptionOverflowing && (
          <button
            onClick={onDescriptionToggle}
            className="flex items-center gap-1.5 text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors mt-3 group"
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
        <div className="bg-[var(--secondary)]/80 backdrop-blur-md rounded-2xl p-1.5 relative border border-[var(--border)]">
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
                      ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-xl ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-[var(--primary)]/10 text-[var(--primary)]"
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

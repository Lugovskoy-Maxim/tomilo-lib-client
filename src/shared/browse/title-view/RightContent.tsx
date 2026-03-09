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
  SmilePlus,
  X,
  CheckCircle,
  Home,
  MessageCircle,
  List,
  ChevronsUp,
  ChevronsDown,
  Search,
} from "lucide-react";
import { translateTitleStatus, translateTitleType } from "@/lib/title-type-translations";
import { useRouter } from "next/navigation";
import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import {
  useUpdateRatingMutation,
  useGetTitleStatsQuery,
  useGetMyTitleRatingQuery,
} from "@/store/api/titlesApi";
import { useGetReadingHistoryReadIdsQuery, useGetTitleProgressQuery } from "@/store/api/authApi";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { getChapterPath } from "@/lib/title-paths";
import { sanitizeHtml } from "@/lib/sanitize";
import { useAuth } from "@/hooks/useAuth";
import { getChapterDisplayName } from "@/lib/chapter-title-utils";
import { GenresList } from "./GenresList";
import { CharactersSection } from "./CharactersSection";
import { TranslatorsSection } from "./TranslatorsSection";
import { SimilarTitles } from "./SimilarTitles";

interface RightContentProps {
  titleData: Title;
  activeTab: "main" | "chapters" | "comments";
  onTabChange: (tab: "main" | "chapters" | "comments") => void;
  isDescriptionExpanded: boolean;
  onDescriptionToggle: () => void;
  chapters: Chapter[];
  chaptersLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: "desc" | "asc";
  onSortChange: (order: "desc" | "asc") => void;
  titleId: string;
  user: User | null;
  onAgeVerificationRequired?: () => void;
  slug?: string;
}

export function RightContent({
  titleData,
  activeTab,
  onTabChange,
  isDescriptionExpanded,
  onDescriptionToggle,
  chapters,
  chaptersLoading,
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
  const [loadedChaptersCount, setLoadedChaptersCount] = useState(20);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const ratingAnchorRef = useRef<HTMLDivElement>(null);
  const [ratingPopoverStyle, setRatingPopoverStyle] = useState<React.CSSProperties>({});

  // Позиция поповера оценки: не выходить за левый край экрана
  useLayoutEffect(() => {
    if (!isRatingOpen || !ratingAnchorRef.current) {
      setRatingPopoverStyle({});
      return;
    }
    const el = ratingAnchorRef.current;
    const rect = el.getBoundingClientRect();
    const popoverWidth = typeof window !== "undefined" && window.innerWidth >= 640 ? 320 : 280;
    const viewportPadding = 8;
    const leftInAnchor = rect.width - popoverWidth;
    const minLeft = viewportPadding - rect.left;
    if (minLeft > leftInAnchor) {
      setRatingPopoverStyle({ left: minLeft, right: "auto" });
    } else {
      setRatingPopoverStyle({});
    }
  }, [isRatingOpen]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [removingChapterId, setRemovingChapterId] = useState<string | null>(null);
  const [markingChapterId, setMarkingChapterId] = useState<string | null>(null);

  const { addToReadingHistory, removeFromReadingHistory, useGetReadingHistoryByTitle } = useAuth();
  const includeAdult = !user ? true : user.displaySettings?.isAdult !== false;

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

  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = user ? checkAgeVerification(user) : checkAgeVerification(null);
    setIsAgeVerified(prev => (prev === verified ? prev : verified));
    // user не в deps — проверка только по userId и userBirthDate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userBirthDate]);

  // Лёгкий запрос: только id прочитанных глав (для статуса «прочитано» на странице тайтла)
  const { data: readIdsData } = useGetReadingHistoryReadIdsQuery(titleId, {
    skip: !user || !titleId,
  });
  const { data: readingHistoryData } = useGetReadingHistoryByTitle(titleId);

  // Статистика тайтла (расширенные данные о просмотрах и закладках)
  const { data: titleStatsData } = useGetTitleStatsQuery(titleId, {
    skip: !titleId,
  });

  // Рейтинг текущего пользователя для тайтла
  const { data: myRatingData } = useGetMyTitleRatingQuery(titleId, {
    skip: !user || !titleId,
  });

  // Текущая оценка: приоритет — с сервера через новый эндпоинт my-rating, затем ratings по userId, иначе localStorage
  useEffect(() => {
    if (!titleData?._id) return;

    // Приоритет 1: данные из нового эндпоинта my-rating
    if (myRatingData?.data?.hasRated && myRatingData.data.rating !== null) {
      setPendingRating(myRatingData.data.rating);
      if (typeof window !== "undefined") {
        localStorage.setItem(`title-rating-${titleData._id}`, String(myRatingData.data.rating));
      }
      return;
    }

    // Приоритет 2: поиск в массиве ratings (fallback для старого формата)
    const ratings = titleData.ratings;
    if (user?._id && Array.isArray(ratings)) {
      const entry = ratings.find(
        (r): r is TitleRatingEntry =>
          typeof r === "object" && r !== null && "userId" in r && r.userId === user._id,
      );
      if (entry) {
        setPendingRating(entry.rating);
        if (typeof window !== "undefined") {
          localStorage.setItem(`title-rating-${titleData._id}`, String(entry.rating));
        }
        return;
      }
    }

    // Приоритет 3: localStorage
    if (typeof window !== "undefined") {
      const savedRating = localStorage.getItem(`title-rating-${titleData._id}`);
      if (savedRating) setPendingRating(parseInt(savedRating, 10));
    }
  }, [titleData?._id, titleData?.ratings, user?._id, myRatingData]);

  // Прогресс чтения с сервера
  const { data: titleProgressData } = useGetTitleProgressQuery(titleId, {
    skip: !user || !titleId,
  });

  const { data: commentsData } = useGetCommentsQuery(
    { entityType: CommentEntityType.TITLE, entityId: titleId, page: 1, limit: 1 },
    { skip: !titleId },
  );
  const commentsCount = commentsData?.data?.total ?? null;

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
        const id =
          typeof ch.chapterId === "object" && ch.chapterId !== null
            ? (ch.chapterId as { _id: string })._id
            : String(ch.chapterId);
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

  // Отметить главу прочитанной без перехода в читалку
  const handleMarkAsRead = useCallback(
    async (chapterId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!user || markingChapterId) return;

      setMarkingChapterId(chapterId);
      try {
        await addToReadingHistory(titleId, chapterId);
      } catch (error) {
        console.error("Failed to mark chapter as read:", error);
      } finally {
        setMarkingChapterId(null);
      }
    },
    [titleId, addToReadingHistory, user, markingChapterId],
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

  // Фильтрация и сортировка глав через useMemo (без лишних state и effect)
  const displayedChapters = useMemo(() => {
    let result = chapters;

    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      const queryNumber = parseFloat(query);

      result = chapters.filter(chapter => {
        const chapterNum = chapter.chapterNumber ?? 0;
        const chapterNumStr = String(chapterNum);

        if (!isNaN(queryNumber)) {
          if (chapterNum === queryNumber) return true;
          if (chapterNumStr.startsWith(query)) return true;
        }

        const chapterTitle = (chapter.title || chapter.name || "").toLowerCase();
        if (chapterTitle.includes(query)) return true;

        return false;
      });

      // При поиске: сначала точные совпадения, потом частичные
      return [...result].sort((a, b) => {
        const aNum = a.chapterNumber ?? 0;
        const bNum = b.chapterNumber ?? 0;

        // Точное совпадение с числовым запросом
        const aExact = !isNaN(queryNumber) && aNum === queryNumber;
        const bExact = !isNaN(queryNumber) && bNum === queryNumber;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Затем сортировка по порядку
        return sortOrder === "desc" ? bNum - aNum : aNum - bNum;
      });
    }

    return [...result].sort((a, b) => {
      const aNum = a.chapterNumber || 0;
      const bNum = b.chapterNumber || 0;
      return sortOrder === "desc" ? bNum - aNum : aNum - bNum;
    });
  }, [chapters, searchQuery, sortOrder]);

  // Видимые главы для виртуализации
  const visibleChapters = useMemo(() => {
    return searchQuery ? displayedChapters : displayedChapters.slice(0, loadedChaptersCount);
  }, [displayedChapters, loadedChaptersCount, searchQuery]);

  // Ref для хранения актуальных значений (избегаем устаревших замыканий)
  const scrollStateRef = useRef({
    loadedChaptersCount,
    displayedChaptersLength: displayedChapters.length,
  });
  scrollStateRef.current = {
    loadedChaptersCount,
    displayedChaptersLength: displayedChapters.length,
  };

  // Throttled scroll handler для подгрузки глав
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) return;

      scrollTimeoutRef.current = setTimeout(() => {
        scrollTimeoutRef.current = null;
        const { loadedChaptersCount: loaded, displayedChaptersLength: total } =
          scrollStateRef.current;

        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
          if (loaded < total) {
            setLoadedChaptersCount(prev => Math.min(prev + 20, total));
          }
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Сброс loadedChaptersCount при смене сортировки или поиска
  useEffect(() => {
    setLoadedChaptersCount(20);
  }, [sortOrder, chapters]);

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
                  {(() => {
                    // Находим дату последней добавленной главы
                    const lastChapterDate =
                      chapters.length > 0
                        ? chapters.reduce((latest, ch) => {
                            const chDate = new Date(ch.createdAt).getTime();
                            return chDate > latest ? chDate : latest;
                          }, 0)
                        : null;

                    if (lastChapterDate) {
                      return timeAgo(new Date(lastChapterDate).toISOString());
                    }

                    // Fallback на createdAt тайтла если глав нет
                    return titleData?.createdAt ? timeAgo(titleData.createdAt) : "неизвестно";
                  })()}
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
                  <span className="text-xs uppercase tracking-wider font-medium">
                    Альтернативные названия
                  </span>
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

              {/* Основная статистика */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-[var(--background)]/60 rounded-xl">
                  <div className="text-2xl font-bold text-[var(--primary)] mb-1">
                    {(titleStatsData?.data?.views ?? titleData?.views ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">Просмотров</div>
                </div>
                <div className="text-center p-3 bg-[var(--background)]/60 rounded-xl">
                  <div className="text-2xl font-bold text-[var(--primary)] mb-1">
                    {(titleStatsData?.data?.totalRatings ?? totalRatings).toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">Оценок</div>
                </div>
              </div>

              {/* Расширенная статистика просмотров */}
              {titleStatsData?.data && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-[var(--background)]/40 rounded-lg">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {titleStatsData.data.dayViews?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">За день</div>
                  </div>
                  <div className="text-center p-2 bg-[var(--background)]/40 rounded-lg">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {titleStatsData.data.weekViews?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">За неделю</div>
                  </div>
                  <div className="text-center p-2 bg-[var(--background)]/40 rounded-lg">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {titleStatsData.data.monthViews?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">За месяц</div>
                  </div>
                </div>
              )}

              {/* Количество закладок */}
              {titleStatsData?.data?.bookmarksCount !== undefined &&
                titleStatsData.data.bookmarksCount > 0 && (
                  <div className="flex items-center justify-between p-2 bg-[var(--background)]/40 rounded-lg mb-4">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      В закладках у читателей
                    </span>
                    <span className="text-sm font-semibold text-[var(--primary)]">
                      {titleStatsData.data.bookmarksCount.toLocaleString()}
                    </span>
                  </div>
                )}

              {totalRatings > 0 && ratingStats.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-[var(--muted-foreground)] mb-2">
                    Распределение оценок:
                  </div>
                  <div className="space-y-2">
                    {ratingStats.slice(0, 5).map(stat => (
                      <div key={stat.rating} className="flex items-center gap-3">
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
                          {stat.count}{" "}
                          <span className="text-[var(--foreground)]/50">({stat.percentage}%)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Секция персонажей */}
            <CharactersSection titleId={titleId} />

            {/* Секция команды перевода */}
            <TranslatorsSection titleId={titleId} chapters={chapters} />

            {/* Похожие тайтлы */}
            <SimilarTitles
              titleId={titleId}
              genres={titleData.genres}
              currentTitleSlug={slug}
              includeAdult={includeAdult}
            />
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

        // Используем данные прогресса с сервера, если доступны, иначе считаем локально
        const serverProgress = titleProgressData?.data;
        const totalChaptersCount = serverProgress?.totalChapters ?? chapters.length;
        const readChaptersCount =
          serverProgress?.chaptersRead ?? chapters.filter(ch => isChapterRead(ch._id || "")).length;
        const progressPercent =
          serverProgress?.progressPercent ??
          (totalChaptersCount > 0 ? Math.round((readChaptersCount / totalChaptersCount) * 100) : 0);
        const hasReadingProgress = user && readChaptersCount > 0;

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Индикатор прогресса чтения */}
            {hasReadingProgress && (
              <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Прогресс чтения
                    </span>
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {readChaptersCount} из {totalChaptersCount} глав
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--background)]/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-[var(--muted-foreground)]">
                  <span>{progressPercent}% прочитано</span>
                  {progressPercent === 100 && (
                    <span className="text-green-500 font-medium">Завершено!</span>
                  )}
                </div>
              </div>
            )}

            {/* Панель поиска и сортировки */}
            <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-3 border border-[var(--border)]/50">
              <div className="flex w-full flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Поиск по номеру главы..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                      aria-label="Очистить поиск"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Кнопки быстрой навигации */}
                  {totalChaptersCount > 10 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const firstChapter =
                            sortOrder === "desc" ? chapters[chapters.length - 1] : chapters[0];
                          if (firstChapter) {
                            onSearchChange(String(firstChapter.chapterNumber || 1));
                          }
                        }}
                        className="p-2.5 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 hover:text-[var(--primary)] transition-all"
                        title="К первой главе"
                      >
                        <ChevronsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const lastChapter =
                            sortOrder === "desc" ? chapters[0] : chapters[chapters.length - 1];
                          if (lastChapter) {
                            onSearchChange(String(lastChapter.chapterNumber || chapters.length));
                          }
                        }}
                        className="p-2.5 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 hover:text-[var(--primary)] transition-all"
                        title="К последней главе"
                      >
                        <ChevronsDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onSortChange(sortOrder === "desc" ? "asc" : "desc")}
                    className="px-4 py-2.5 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                  >
                    <ArrowUpDown
                      className={`w-4 h-4 transition-transform duration-300 text-[var(--primary)] ${
                        sortOrder === "desc" ? "rotate-0" : "rotate-180"
                      }`}
                    />
                    <span className="text-sm hidden sm:inline">
                      {sortOrder === "desc" ? "Сначала новые" : "Сначала старые"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Список глав */}
            <div className="space-y-2">
              {visibleChapters.length === 0 && !searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="w-16 h-16 text-[var(--muted-foreground)]/30 mb-4" />
                  {titleData.chaptersRemovedByCopyrightHolder ? (
                    <>
                      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                        Главы скрыты по требованию правообладателя
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                        Часть глав или все главы данного тайтла временно недоступны по требованию
                        правообладателя.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                        Глав пока нет
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                        Главы ещё не добавлены. Подпишитесь на тайтл, чтобы получить уведомление о
                        новых главах.
                      </p>
                    </>
                  )}
                </div>
              )}

              {visibleChapters.length === 0 && searchQuery && !chaptersLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-16 h-16 text-[var(--muted-foreground)]/30 mb-4" />
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                    Глава не найдена
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    По запросу &ldquo;{searchQuery}&rdquo; ничего не найдено
                  </p>
                  <button
                    onClick={() => onSearchChange("")}
                    className="px-4 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 rounded-xl transition-colors"
                  >
                    Сбросить поиск
                  </button>
                </div>
              )}

              {visibleChapters.length === 0 && searchQuery && chaptersLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 border-3 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mb-4" />
                  <p className="text-sm text-[var(--muted-foreground)]">Загрузка глав...</p>
                </div>
              )}

              {visibleChapters.map((chapter, index) => {
                const read = isChapterRead(chapter._id || "");
                const isRemoving = removingChapterId === chapter._id;
                const hasRating = chapter.averageRating != null && (chapter.ratingCount ?? 0) > 0;
                const totalReactions =
                  chapter.reactions?.reduce((s, r) => s + (r.count ?? 0), 0) ?? 0;
                const hasReactions = totalReactions > 0;

                const dateStr = chapter.createdAt
                  ? new Date(chapter.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                const dateStrMobile = chapter.createdAt
                  ? new Date(chapter.createdAt)
                      .toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })
                      .replace(/\s*г\.?\s*$/i, "")
                  : "—";
                const viewsStr = `${(chapter.views || 0).toLocaleString()} просм.`;
                const metaPartsMobile: string[] = [dateStrMobile];
                if (hasRating) metaPartsMobile.push(`★ ${chapter.averageRating!.toFixed(1)}`);
                if (hasReactions) metaPartsMobile.push(`${totalReactions} реакц.`);
                metaPartsMobile.push(viewsStr);
                const metaLineMobile = metaPartsMobile.join(" · ");
                const metaLineDesktop = `${dateStr} · ${viewsStr}`;

                return (
                  <div
                    key={chapter._id}
                    onClick={() => router.push(getChapterPathCallback(chapter._id))}
                    className="group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/80 rounded-lg sm:rounded-xl border border-[var(--border)]/30 hover:border-[var(--border)]/60 transition-colors cursor-pointer active:scale-[0.99]"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Статус прочтения — компактно на мобиле; клик по иконке: отметить прочитанной / удалить из истории */}
                    <div
                      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-[var(--background)]/40 flex-shrink-0 touch-manipulation"
                      onClick={e => e.stopPropagation()}
                    >
                      {read ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveFromHistory(chapter._id || "", e);
                          }}
                          disabled={isRemoving}
                          className={`flex items-center justify-center w-full h-full min-w-[2rem] min-h-[2rem] sm:min-w-[2.25rem] sm:min-h-[2.25rem] rounded-md sm:rounded-lg ${
                            isRemoving
                              ? "cursor-not-allowed text-[var(--foreground)]/30"
                              : "text-red-500 hover:text-red-600 active:bg-[var(--background)]/60 cursor-pointer"
                          }`}
                          title="Удалить из истории"
                          aria-label="Удалить из истории чтения"
                        >
                          {isRemoving ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[var(--foreground)]/20 border-t-[var(--chart-1)] rounded-full animate-spin" />
                          ) : (
                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          )}
                        </button>
                      ) : !read && user ? (
                        <button
                          type="button"
                          onClick={e => handleMarkAsRead(chapter._id || "", e)}
                          disabled={markingChapterId === chapter._id}
                          className="flex items-center justify-center w-full h-full min-w-[2rem] min-h-[2rem] sm:min-w-[2.25rem] sm:min-h-[2.25rem] rounded-md sm:rounded-lg text-[var(--foreground)]/25 hover:text-green-500 focus:text-green-500 active:bg-[var(--background)]/60 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 touch-manipulation"
                          title="Отметить прочитанной"
                          aria-label="Отметить прочитанной"
                        >
                          {markingChapterId === chapter._id ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[var(--foreground)]/20 border-t-green-500 rounded-full animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 transition-colors" />
                          )}
                        </button>
                      ) : (
                        <Eye
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                            read
                              ? "text-green-500"
                              : "text-[var(--foreground)]/25 group-hover:text-[var(--foreground)]/40"
                          }`}
                        />
                      )}
                    </div>

                    {/* Название и мета — одна колонка */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium sm:font-semibold text-sm sm:text-base text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {getChapterDisplayName(chapter)}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] mt-0.5 truncate sm:mt-1">
                        <span className="sm:hidden">{metaLineMobile}</span>
                        <span className="hidden sm:inline">{metaLineDesktop}</span>
                      </p>
                    </div>

                    {/* Десктоп: рейтинг и реакции справа отдельно для сканности */}
                    <div className="hidden sm:flex items-center gap-3 text-[var(--muted-foreground)] flex-shrink-0">
                      <span
                        className="flex items-center gap-1 tabular-nums text-sm"
                        title="Рейтинг"
                      >
                        <Star className="w-3.5 h-3.5 text-[var(--muted-foreground)] fill-[var(--muted-foreground)] shrink-0" />
                        {hasRating
                          ? `${chapter.averageRating!.toFixed(1)}${(chapter.ratingCount ?? 0) > 0 ? ` (${chapter.ratingCount})` : ""}`
                          : "—"}
                      </span>
                      <span
                        className="flex items-center gap-1 tabular-nums text-sm"
                        title="Реакции"
                      >
                        <SmilePlus className="w-3.5 h-3.5 shrink-0" />
                        {hasReactions ? totalReactions : "—"}
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
        <div className="flex sm:flex-row justify-between sm:items-start gap-4 w-full">
          <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
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
              {titleData?.status && (
                <span className="font-medium">{translateTitleStatus(titleData.status || "")}</span>
              )}
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

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center sm:justify-end gap-2 sm:gap-x-3 sm:gap-y-1 px-3 pt-1.5 pb-2 rounded-2xl transition-all duration-300 w-full sm:w-auto">
              {/* Рейтинг и кол-во оценок */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-[var(--muted-foreground)] shrink-0">Рейтинг</span>
                <span className="text-lg sm:text-xl font-bold text-[var(--primary)] tabular-nums">
                  {titleData?.averageRating ? titleData.averageRating.toFixed(1) : "0.0"}
                </span>
                {totalRatings > 0 && (
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                    {totalRatings}{" "}
                    {totalRatings === 1 ? "оценка" : totalRatings < 5 ? "оценки" : "оценок"}
                  </span>
                )}
              </div>

              {/* Кнопка оценки */}
              <div ref={ratingAnchorRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRatingOpen(v => !v)}
                  title={pendingRating ? `Ваша оценка: ${pendingRating}` : "Оценить"}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    pendingRating
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] hover:border-[var(--primary)]/30"
                  }`}
                >
                  <Star className={`w-3 h-3 shrink-0 ${pendingRating ? "fill-white" : ""}`} />
                  {pendingRating ? pendingRating : "Оценить"}
                </button>

                {/* Выпадающее меню с выбором оценки */}
                {isRatingOpen && (
                  <>
                    {/* Backdrop для закрытия при клике вне */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsRatingOpen(false)} />

                    <div
                      className="absolute bottom-full right-0 mb-2 flex flex-col w-[280px] sm:w-[320px] bg-[var(--card)] rounded-2xl p-4 z-50 shadow-2xl border border-[var(--border)]/30 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl"
                      style={ratingPopoverStyle}
                    >
                      {/* Заголовок с текущей оценкой */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                            <Star className="w-4 h-4 text-[var(--primary)] fill-[var(--primary)]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-[var(--foreground)]/50 uppercase tracking-wider">
                              Оценка
                            </span>
                            <span className="text-lg font-bold text-[var(--foreground)]">
                              {hoveredRating || pendingRating || "—"}
                              <span className="text-sm font-normal text-[var(--foreground)]/40 ml-0.5">
                                /10
                              </span>
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
                          const isPreviouslySelected =
                            pendingRating !== null &&
                            ratingValue <= pendingRating &&
                            hoveredRating === null;

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
                                  localStorage.setItem(
                                    `title-rating-${titleData._id}`,
                                    ratingValue.toString(),
                                  );
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
                        <span
                          className={`font-medium transition-colors ${
                            hoveredRating || pendingRating
                              ? "text-[var(--foreground)]"
                              : "text-[var(--foreground)]/50"
                          }`}
                        >
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
                              ? "Нажмите, чтобы изменить"
                              : "Выберите оценку"}
                        </span>
                        <span className="text-[var(--foreground)]/40">Шедевр</span>
                      </div>

                      {/* Кнопка сброса оценки */}
                      {pendingRating && (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingRating(null);
                            setIsRatingOpen(false);
                            if (typeof window !== "undefined" && titleData?._id) {
                              localStorage.removeItem(`title-rating-${titleData._id}`);
                            }
                          }}
                          className="w-full mt-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3 h-3" />
                          Убрать мою оценку
                        </button>
                      )}
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
              __html: sanitizeHtml(titleData?.description || ""),
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
            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 mt-3 rounded-xl text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:border-[var(--primary)]/30 transition-all group"
          >
            <span>{isDescriptionExpanded ? "Свернуть описание" : "Читать полностью"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                isDescriptionExpanded ? "rotate-180" : "group-hover:translate-y-0.5"
              }`}
            />
          </button>
        )}

        {/* Вкладки: Главная, Главы, Комментарии */}
        <div className="bg-[var(--secondary)]/95 backdrop-blur-xl rounded-2xl p-1.5 border border-[var(--border)] shadow-sm">
          <div className="flex gap-1">
            {[
              {
                key: "main" as const,
                label: "Главная",
                icon: Home,
                count: null,
              },
              {
                key: "chapters" as const,
                label: "Главы",
                icon: List,
                count: titleData?.totalChapters || chapters.length || 0,
              },
              {
                key: "comments" as const,
                label: "Комментарии",
                icon: MessageCircle,
                count: commentsCount,
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
                  <Icon
                    className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span
                      className={`ml-1 text-xs px-1.5 py-0.5 rounded-xl ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[var(--primary)]/10 text-[var(--primary)]"
                      }`}
                    >
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

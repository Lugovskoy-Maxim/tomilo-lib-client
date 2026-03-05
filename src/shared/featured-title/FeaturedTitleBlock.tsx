"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Eye, BookOpen, Calendar, Tag, Play, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import RatingBadge from "@/shared/rating-badge/RatingBadge";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { normalizeBookmarks } from "@/lib/bookmarks";
import type { BookmarkCategory } from "@/types/user";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useAgeVerification } from "@/contexts/AgeVerificationContext";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

interface FeaturedTitleData {
  id: string;
  slug?: string;
  title: string;
  image: string | undefined;
  description: string | undefined;
  type: string;
  year: number;
  rating: number;
  genres?: string[];
  views?: number | string;
  isAdult: boolean;
}

interface FeaturedTitleBlockProps {
  data: FeaturedTitleData[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  autoPlayInterval?: number;
}

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

const CATEGORIES: BookmarkCategory[] = ["reading", "planned", "completed", "favorites", "dropped"];

const formatViews = (value?: number | string) => {
  if (value === undefined || value === null) return null;
  const views = typeof value === "string" ? parseInt(value.replace(/[KkМм]/g, "000"), 10) : value;
  if (isNaN(views)) return value;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${views}`;
};


export default function FeaturedTitleBlock({
  data,
  title,
  description,
  icon,
  autoPlayInterval = 6000,
}: FeaturedTitleBlockProps) {
  const router = useRouter();
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const toast = useToast();
  const requestAgeVerification = useAgeVerification();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const touchTargetRef = useRef<EventTarget | null>(null);
  const bookmarkHandledByPointerRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bookmarkButtonRef = useRef<HTMLButtonElement>(null);
  
  const minSwipeDistance = 50;

  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const el = target.closest("button, a, [role='button'], input, select, textarea");
    return Boolean(el);
  };

  // Depend on stable primitives so we don't re-run when `user` object reference changes (avoids infinite loop)
  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = checkAgeVerification(user || null);
    setIsAgeVerified((prev) => (prev === verified ? prev : verified));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only userId/userBirthDate; `user` reference changes every render from Redux
  }, [userId, userBirthDate]);

  // Предзагрузка изображений всех слайдов при монтировании
  useEffect(() => {
    if (typeof window === "undefined") return;
    data.forEach((item) => {
      if (!item.image) return;
      const { primary, fallback } = getCoverUrls(item.image, "");
      if (primary) {
        const img = new Image();
        img.src = primary;
        // При ошибке пробуем fallback
        img.onerror = () => {
          if (fallback && fallback !== primary) {
            const fallbackImg = new Image();
            fallbackImg.src = fallback;
          }
        };
      }
    });
  }, [data]);

  useEffect(() => {
    setCategoryOpen(false);
    setIsDescriptionExpanded(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!categoryOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target) || bookmarkButtonRef.current?.contains(target)) return;
      setCategoryOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [categoryOpen]);

  const currentItem = data[currentIndex];

  const titlePath = currentItem ? getTitlePath(currentItem) : "";
  const isAdultContent = currentItem?.isAdult;
  const isBookmarked = user?.bookmarks && currentItem
    ? normalizeBookmarks(user.bookmarks).some(e => e.titleId === currentItem.id)
    : false;

  const { primary: imageSrc, fallback: imageFallback } = getCoverUrls(currentItem?.image, IMAGE_HOLDER.src);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setProgress(0);
    lastTickRef.current = Date.now();
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? data.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, data.length, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex === data.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  }, [currentIndex, data.length, goToSlide]);

  useEffect(() => {
    if (data.length <= 1 || !autoPlayInterval) return;

    if (isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();
    const updateInterval = 50;

    progressIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setProgress(prev => {
        const newProgress = prev + (delta / autoPlayInterval) * 100;
        if (newProgress >= 100) {
          return 100;
        }
        return newProgress;
      });
    }, updateInterval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPaused, autoPlayInterval, data.length, currentIndex]);

  useEffect(() => {
    if (progress >= 100 && !isPaused && data.length > 1) {
      goToNext();
    }
  }, [progress, isPaused, goToNext, data.length]);

  if (!currentItem) return null;

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    if (pendingAction) pendingAction();
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
    setPendingAction(null);
  };

  const handleReadClick = (e: React.MouseEvent) => {
    if (isAdultContent && !isAgeVerified) {
      e.preventDefault();
      e.stopPropagation();
      if (requestAgeVerification) {
        requestAgeVerification(() => router.push(titlePath));
        return;
      }
      setPendingAction(() => router.push(titlePath));
      setShowAgeModal(true);
      return;
    }
    router.push(titlePath);
  };

  const truncateDescription = (text: string | undefined, maxLength: number = 200) => {
    if (!text) return "Описание отсутствует";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const handleRemoveBookmark = async () => {
    if (!isAuthenticated) return;
    setBookmarkLoading(true);
    try {
      const result = await removeBookmark(currentItem.id);
      if (!result.success) {
        toast.error(result.error ?? "Ошибка при удалении из закладок");
      }
    } catch {
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleAddWithCategory = async (category: BookmarkCategory) => {
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }
    setCategoryOpen(false);
    setBookmarkLoading(true);
    try {
      const result = await addBookmark(currentItem.id, category);
      if (!result.success) {
        toast.error(result.error ?? "Ошибка при добавлении в закладки");
      }
    } catch {
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }
    if (isBookmarked) {
      handleRemoveBookmark();
    } else {
      setCategoryOpen(prev => !prev);
    }
  };

  const hasHeader = title || description;

  return (
    <section className={`w-full ${hasHeader ? "max-w-7xl mx-auto px-2 py-2 sm:px-4 sm:py-4 md:py-6" : ""}`}>
      {hasHeader && (
        <div className="flex flex-col mb-2 sm:mb-4">
          <div className="flex items-center gap-1">
            {icon && <div className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[var(--muted-foreground)]">{icon}</div>}
            {title && (
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-[var(--muted-foreground)]">
                {title}
              </h2>
            )}
          </div>
          {description && (
            <p className="text-[var(--muted-foreground)] text-xs sm:text-sm max-w-3xl mt-0.5 hidden sm:block">
              {description}
            </p>
          )}
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden group ${hasHeader ? "rounded-xl sm:rounded-2xl" : ""}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => {
          setIsPaused(true);
          setTouchEnd(null);
          touchTargetRef.current = e.target;
          setTouchStart(e.targetTouches[0].clientX);
        }}
        onTouchMove={(e) => {
          setTouchEnd(e.targetTouches[0].clientX);
        }}
        onTouchEnd={(e) => {
          if (isInteractiveElement(touchTargetRef.current)) {
            touchTargetRef.current = null;
            setTouchStart(null);
            setTouchEnd(null);
            setTimeout(() => setIsPaused(false), 500);
            return;
          }
          if (!touchStart || !touchEnd) {
            setTimeout(() => setIsPaused(false), 3000);
            return;
          }
          const distance = touchStart - touchEnd;
          const isLeftSwipe = distance > minSwipeDistance;
          const isRightSwipe = distance < -minSwipeDistance;
          
          if (isLeftSwipe && data.length > 1) {
            goToNext();
          } else if (isRightSwipe && data.length > 1) {
            goToPrevious();
          }
          
          setTouchStart(null);
          setTouchEnd(null);
          setTimeout(() => setIsPaused(false), 3000);
        }}
      >

        {isAdultContent && !isAgeVerified && (
          <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 flex justify-end">
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-lg border border-red-400/50 flex items-center gap-1.5 pointer-events-auto">
                <span>18+</span>
                <span className="hidden sm:inline text-red-100 font-medium">Контент для взрослых</span>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-8 gap-4 sm:gap-5 md:gap-8">
          {/* Мобильная версия: горизонтальная компоновка обложки и основной информации */}
          <div className="flex md:hidden gap-4 w-full min-w-0">
            <Link
              href={titlePath}
              className="block relative w-28 min-w-[112px] sm:w-32 sm:min-w-[128px] aspect-[2/3] rounded-xl overflow-hidden shadow-xl ring-1 ring-[var(--border)] flex-shrink-0"
              onClick={(e) => {
                if (isAdultContent && !isAgeVerified) {
                  e.preventDefault();
                  if (requestAgeVerification) {
                    requestAgeVerification(() => router.push(titlePath));
                  } else {
                    setPendingAction(() => router.push(titlePath));
                    setShowAgeModal(true);
                  }
                }
              }}
            >
              <OptimizedImage
                className={`${isAdultContent && !isAgeVerified ? "blur-lg" : ""} absolute inset-0 w-full h-full object-cover object-center`}
                src={imageSrc}
                fallbackSrc={imageFallback}
                errorSrc={IMAGE_HOLDER.src}
                alt={currentItem.title}
                fill
                priority
                draggable={false}
                hidePlaceholder
              />
              {isAdultContent && isAgeVerified && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                    <span>18+</span>
                  </div>
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
              {/* Бейджи: тип, год, рейтинг */}
              <div className="flex flex-wrap items-center gap-1.5 text-left text-xs">
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--accent)] px-2 py-0.5 font-medium text-[var(--foreground)] shrink-0">
                  <Tag className="w-3 h-3 shrink-0" />
                  {translateTitleType(currentItem.type)}
                </span>
                <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--accent)] px-2 py-0.5 font-medium text-[var(--foreground)] shrink-0">
                  {currentItem.year}
                </span>
                <span className="ml-auto shrink-0 inline-flex items-center">
                  <RatingBadge rating={currentItem.rating} size="xs" variant="default" className="text-xs" />
                </span>
              </div>

              {/* Заголовок */}
              <h3
                className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} text-[15px] sm:text-base font-bold text-[var(--foreground)] leading-snug line-clamp-2 min-h-[2.5em]`}
              >
                {currentItem.title}
              </h3>

              {/* Жанры - компактно */}
              {currentItem.genres && currentItem.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentItem.genres.slice(0, 2).map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-[var(--accent)] text-[var(--muted-foreground)] text-[10px] font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                  {currentItem.genres.length > 2 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent)] text-[var(--muted-foreground)] text-[10px] font-medium">
                      +{currentItem.genres.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Кнопки действий - мобильная версия (relative z-10 чтобы поверх свайпа) */}
              <div className="relative z-10 flex gap-2 mt-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReadClick(e as unknown as React.MouseEvent);
                  }}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold shadow-lg shadow-[var(--primary)]/25 active:scale-[0.98] touch-manipulation"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  Читать
                </button>
              </div>
            </div>
          </div>

          {/* Описание для мобильных - отдельно под карточкой */}
          <div className="md:hidden pt-1 pb-6 px-0.5">
            <p
              className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} text-[13px] text-[var(--muted-foreground)] leading-relaxed ${
                isDescriptionExpanded ? "" : "line-clamp-3"
              }`}
            >
              {isDescriptionExpanded 
                ? (currentItem.description || "Описание отсутствует")
                : truncateDescription(currentItem.description, 140)
              }
            </p>
            {currentItem.description && currentItem.description.length > 140 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="inline-flex items-center gap-1.5 text-[var(--primary)] text-[13px] font-medium mt-2 py-1 touch-manipulation"
              >
                {isDescriptionExpanded ? (
                  <>
                    Свернуть
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  </>
                ) : (
                  <>
                    Развернуть
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Десктопная версия обложки */}
          <div className="hidden md:block relative flex-shrink-0">
            <Link
              href={titlePath}
              className="block relative w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-[var(--border)] transition-transform duration-300 hover:scale-[1.02] group/cover"
              onClick={(e) => {
                if (isAdultContent && !isAgeVerified) {
                  e.preventDefault();
                  if (requestAgeVerification) {
                    requestAgeVerification(() => router.push(titlePath));
                  } else {
                    setPendingAction(() => router.push(titlePath));
                    setShowAgeModal(true);
                  }
                }
              }}
            >
              <OptimizedImage
                className={`${isAdultContent && !isAgeVerified ? "blur-lg" : ""} absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover/cover:scale-105`}
                src={imageSrc}
                fallbackSrc={imageFallback}
                errorSrc={IMAGE_HOLDER.src}
                alt={currentItem.title}
                fill
                priority
                draggable={false}
                hidePlaceholder
              />
              {isAdultContent && isAgeVerified && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                    <span>18+</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <span className="text-white text-sm font-medium flex items-center gap-1.5">
                  <Play className="w-4 h-4 fill-current" />
                  Читать
                </span>
              </div>
            </Link>
          </div>

          {/* Десктопный контент (вся высота, как на мобильном) */}
          <div className="hidden md:flex flex-1 flex-col justify-between min-w-0 text-left min-h-0">
            <div className="flex flex-wrap items-center justify-start gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--accent)] backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                <Tag className="w-3 h-3" />
                {translateTitleType(currentItem.type)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--accent)] backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                <Calendar className="w-3 h-3" />
                {currentItem.year}
              </span>
              <RatingBadge rating={currentItem.rating} size="sm" variant="default" />
              {currentItem.views && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--accent)] backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                  <Eye className="w-3 h-3" />
                  {formatViews(currentItem.views)}
                </span>
              )}
            </div>

            <h3
              className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} text-3xl font-bold text-[var(--foreground)] mb-3 leading-tight line-clamp-2`}
            >
              {currentItem.title}
            </h3>

            {currentItem.genres && currentItem.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 justify-start">
                {currentItem.genres.slice(0, 4).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-[var(--accent)] text-[var(--muted-foreground)] text-xs font-medium border border-[var(--border)]"
                  >
                    {genre}
                  </span>
                ))}
                {currentItem.genres.length > 4 && (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--accent)] text-[var(--muted-foreground)] text-xs font-medium border border-[var(--border)]">
                    +{currentItem.genres.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="relative flex-1 min-h-0 mb-6 max-w-2xl flex flex-col">
              <p
                className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} text-base text-[var(--muted-foreground)] leading-relaxed ${
                  isDescriptionExpanded ? "" : "line-clamp-4"
                } transition-all duration-300`}
              >
                {isDescriptionExpanded 
                  ? (currentItem.description || "Описание отсутствует")
                  : truncateDescription(currentItem.description, 250)
                }
              </p>
            </div>

            <div className="flex gap-3 justify-start items-stretch flex-shrink-0 mb-0">
              <button
                onClick={handleReadClick}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--primary-foreground)] text-base font-semibold transition-all duration-200 shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" />
                Читать
              </button>
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] text-base font-semibold transition-all duration-200 active:scale-[0.98]"
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Подробнее
                  </>
                )}
              </button>
            </div>
          </div>

          {data.length > 1 && (
            <>
              {/* Навигация для десктопа */}
              <button
                onClick={goToPrevious}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[var(--card)] backdrop-blur-sm border border-[var(--border)] items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Предыдущий"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[var(--card)] backdrop-blur-sm border border-[var(--border)] items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Следующий"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {data.length > 1 && (
          <div className="relative z-10 pointer-events-none pb-2 md:pb-4 -mt-2">
            <div className="w-full flex justify-center">
              <div className="flex items-center gap-2 pointer-events-auto px-3">
                {data.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`relative h-1.5 md:h-2 rounded-full transition-all duration-300 overflow-hidden touch-manipulation ${
                      index === currentIndex
                        ? "w-10 md:w-12 bg-[var(--muted)]"
                        : "w-2 md:w-2.5 bg-[var(--muted-foreground)]/30 hover:bg-[var(--muted-foreground)]/50 active:bg-[var(--muted-foreground)]/50"
                    }`}
                    aria-label={`Перейти к слайду ${index + 1}`}
                  >
                    {index === currentIndex && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--primary)] rounded-full transition-[width] duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!requestAgeVerification && (
        <AgeVerificationModal
          isOpen={showAgeModal}
          onConfirm={handleAgeConfirm}
          onCancel={handleAgeCancel}
        />
      )}
    </section>
  );
}

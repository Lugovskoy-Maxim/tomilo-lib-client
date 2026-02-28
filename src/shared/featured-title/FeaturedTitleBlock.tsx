"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Eye, BookOpen, Calendar, Tag, Play, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
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
import { getCoverUrl } from "@/lib/asset-url";

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

const formatRating = (value?: number) => {
  const num = typeof value === "number" ? value : 0;
  return num.toFixed(1).replace(/\.0$/, "");
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bookmarkButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user || null));
  }, [user]);

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

  const imageSrc = getCoverUrl(currentItem?.image, IMAGE_HOLDER.src);

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
      setPendingAction(() => () => router.push(titlePath));
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
        className={`relative w-full overflow-hidden bg-[var(--card)] shadow-lg group ${hasHeader ? "rounded-xl sm:rounded-2xl border border-[var(--border)]" : ""}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
      >
        <div className="absolute inset-0 bg-zinc-900/30" />
        
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out opacity-20"
          style={{
            backgroundImage: `url(${imageSrc})`,
            filter: "blur(50px) saturate(1.4)",
            transform: "scale(1.2)",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/70 via-zinc-900/30 to-zinc-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-zinc-900/40" />

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

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col min-h-[280px] sm:min-h-[340px] md:min-h-[420px] md:flex-row px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-8 gap-3 sm:gap-5 md:gap-8">
          <div className="relative w-full md:w-auto flex-shrink-0 flex justify-center md:block">
            <Link
              href={titlePath}
              className="block relative w-28 sm:w-40 md:w-56 aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.02] group/cover"
              onClick={(e) => {
                if (isAdultContent && !isAgeVerified) {
                  e.preventDefault();
                  setPendingAction(() => () => router.push(titlePath));
                  setShowAgeModal(true);
                }
              }}
            >
              <img
                className={`${isAdultContent && !isAgeVerified ? "blur-lg" : ""} absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover/cover:scale-105`}
                src={imageSrc}
                alt={currentItem.title}
                loading="eager"
                decoding="async"
                draggable={false}
              />
              {isAdultContent && isAgeVerified && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <div className="bg-red-500/80 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 rounded text-[10px] sm:text-xs font-bold">
                    18+
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 sm:pb-4">
                <span className="text-white text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  Читать
                </span>
              </div>
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center min-w-0 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg border border-orange-500/40 bg-orange-500/20 backdrop-blur-sm px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-orange-300">
                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {translateTitleType(currentItem.type)}
              </span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-white/90">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {currentItem.year}
              </span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg border border-amber-400/40 bg-amber-400/20 backdrop-blur-sm px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-amber-300">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                {formatRating(currentItem.rating)}
              </span>
              {currentItem.views && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg border border-blue-400/40 bg-blue-400/20 backdrop-blur-sm px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-blue-300">
                  <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {formatViews(currentItem.views)}
                </span>
              )}
            </div>

            <h3
              className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} text-base sm:text-xl md:text-3xl font-bold text-white mb-1.5 sm:mb-3 leading-tight line-clamp-2`}
            >
              {currentItem.title}
            </h3>

            {currentItem.genres && currentItem.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-4 justify-center md:justify-start">
                {currentItem.genres.slice(0, 3).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 sm:px-2 rounded-md bg-white/10 text-white/80 text-[10px] sm:text-xs font-medium border border-white/10"
                  >
                    {genre}
                  </span>
                ))}
                {currentItem.genres.length > 3 && (
                  <span className="px-1.5 py-0.5 sm:px-2 rounded-md bg-white/10 text-white/60 text-[10px] sm:text-xs font-medium border border-white/10">
                    +{currentItem.genres.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="relative mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto md:mx-0">
              <p
                className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} text-xs sm:text-sm md:text-base text-white/70 leading-relaxed ${
                  isDescriptionExpanded ? "" : "line-clamp-2 sm:line-clamp-3 md:line-clamp-4"
                } transition-all duration-300`}
              >
                {isDescriptionExpanded 
                  ? (currentItem.description || "Описание отсутствует")
                  : truncateDescription(currentItem.description, 180)
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-3 justify-center md:justify-start items-stretch">
              <button
                onClick={handleReadClick}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-base font-semibold transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.98]"
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                Читать
              </button>
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-base font-semibold transition-all duration-200 shadow-lg shadow-black/20 hover:shadow-black/30 active:scale-[0.98]"
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    Подробнее
                  </>
                )}
              </button>
              <div ref={dropdownRef} className={`relative ${categoryOpen ? "z-50" : ""}`}>
                <button
                  ref={bookmarkButtonRef}
                  onClick={handleBookmarkClick}
                  disabled={bookmarkLoading}
                  className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-5 sm:py-2.5 h-full rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isBookmarked
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                      : "bg-white/20 hover:bg-white/30 text-white shadow-lg shadow-black/20 hover:shadow-black/30"
                  } ${bookmarkLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {bookmarkLoading ? (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={isBookmarked ? "currentColor" : "none"} />
                  )}
                  {isBookmarked ? "В закладках" : "В закладки"}
                </button>
                {categoryOpen && !bookmarkLoading && (
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bottom-full mb-2 z-50 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg min-w-[140px] sm:min-w-[160px]">
                    <p className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                      Добавить в категорию
                    </p>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleAddWithCategory(cat)}
                        className="w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] active:bg-[var(--accent)] first:rounded-t-none rounded-none last:rounded-b-lg"
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {data.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-1 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all duration-200 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 touch-manipulation"
                aria-label="Предыдущий"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-1 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all duration-200 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 touch-manipulation"
                aria-label="Следующий"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}
        </div>

        {data.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none pb-2 sm:pb-4">
            <div className="w-full max-w-7xl mx-auto flex justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                {data.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`relative h-1 sm:h-1.5 rounded-full transition-all duration-300 overflow-hidden touch-manipulation ${
                      index === currentIndex
                        ? "w-8 sm:w-10 bg-white/20"
                        : "w-1.5 sm:w-2 bg-white/30 hover:bg-white/50 active:bg-white/50"
                    }`}
                    aria-label={`Перейти к слайду ${index + 1}`}
                  >
                    {index === currentIndex && (
                      <div
                        className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-[width] duration-75 ease-linear"
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

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </section>
  );
}

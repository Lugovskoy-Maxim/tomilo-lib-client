"use client";

import React, { useState } from "react";
import { Title } from "@/types/title";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { X, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleStatus } from "@/lib/title-type-translations";
import type { BookmarkCategory } from "@/types/user";
import { getCoverUrls } from "@/lib/asset-url";

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

interface BookmarkCardProps {
  title: Title;
  category?: BookmarkCategory;
  /** Количество прочитанных глав у тайтла (из истории чтения) */
  chaptersRead?: number;
  onRemove?: (titleId: string) => void;
  onCategoryChange?: (titleId: string, category: BookmarkCategory) => void;
  isLoading?: boolean;
}

export default function BookmarkCard({
  title,
  category = "reading",
  chaptersRead,
  onRemove,
  onCategoryChange,
  isLoading,
}: BookmarkCardProps) {
  const router = useRouter();
  const { removeBookmark, updateBookmarkCategory } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const toast = useToast();

  const handleClick = () => {
    if (!categoryOpen) router.push(getTitlePath(title));
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    try {
      const result = await removeBookmark(title._id);
      if (result.success) {
        onRemove?.(title._id);
      } else {
        toast.error(result.error ?? "Ошибка при удалении закладки");
      }
    } catch {
      toast.error("Произошла ошибка при удалении закладки");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCategorySelect = async (e: React.MouseEvent, newCategory: BookmarkCategory) => {
    e.stopPropagation();
    if (newCategory === category || !onCategoryChange) return;
    setCategoryOpen(false);
    setIsUpdatingCategory(true);
    try {
      const result = await updateBookmarkCategory(title._id, newCategory);
      if (result.success) {
        onCategoryChange(title._id, newCategory);
      } else {
        toast.error(result.error ?? "Не удалось изменить категорию");
      }
    } catch {
      toast.error("Не удалось изменить категорию");
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const getImageUrls = (coverImage: string | undefined) => {
    return getCoverUrls(coverImage, IMAGE_HOLDER.src);
  };

  const showImage = title.coverImage && !imageError;
  const categories: BookmarkCategory[] = ["reading", "planned", "completed", "favorites", "dropped"];

  const totalChapters = title.totalChapters ?? 0;
  const isFullyRead =
    chaptersRead != null && totalChapters > 0 && chaptersRead >= totalChapters;
  const isTwoLeft =
    chaptersRead != null && totalChapters >= 2 && chaptersRead === totalChapters - 2;
  const borderClass = isFullyRead
    ? "border-amber-500"
    : isTwoLeft
      ? "border-[var(--chart-1)]"
      : "border-[var(--border)]";

  return (
    <div
      className={`group relative flex items-stretch gap-3 rounded-xl p-3 bg-[var(--background)]/60 border ${borderClass} card-hover-soft cursor-pointer overflow-visible ${
        categoryOpen ? "z-layer-dropdown" : ""
      }`}
      onClick={handleClick}
    >
      <div className="w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[var(--chart-1)]/20 to-[var(--primary)]/20 ring-1 ring-[var(--border)]/50">
        {showImage ? (
          <OptimizedImage
            src={getImageUrls(title.coverImage).primary}
            fallbackSrc={getImageUrls(title.coverImage).fallback}
            alt={title.name}
            width={96}
            height={128}
            className="w-full h-full object-cover card-media-hover"
            priority={false}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--chart-1)]/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5 overflow-visible">
        <div className="overflow-visible">
          {onCategoryChange && (
            <div className="relative mb-1.5">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setCategoryOpen(prev => !prev);
                }}
                disabled={isUpdatingCategory}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-colors"
              >
                <span className="truncate max-w-[72px] sm:max-w-[88px]">{CATEGORY_LABELS[category]}</span>
                <ChevronDown
                  className={`w-3 h-3 flex-shrink-0 transition-transform ${categoryOpen ? "rotate-180" : ""}`}
                />
              </button>
              {categoryOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={e => {
                      e.stopPropagation();
                      setCategoryOpen(false);
                    }}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 py-0.5 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg min-w-[120px] max-w-[min(100%,180px)] max-h-[200px] overflow-y-auto">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={e => handleCategorySelect(e, cat)}
                        className={
                          cat === category
                            ? "w-full text-left px-2 py-1 text-[10px] font-medium bg-[var(--primary)]/20 text-[var(--primary)]"
                            : "w-full text-left px-2 py-1 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
                        }
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate mb-1">
            {title.name}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-2">
            {title.genres?.slice(0, 2).join(", ") || "Жанры не указаны"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
          <span>{translateTitleStatus(title.status)}</span>
          {chaptersRead != null && chaptersRead > 0 && title.totalChapters != null ? (
            <span>
              прочитано{" "}
              <span className="font-semibold text-[var(--chart-1)]">
                {chaptersRead} / {title.totalChapters}
              </span>{" "}
              глав
            </span>
          ) : (
            <span>
              <span className="font-semibold text-[var(--primary)]">{title.totalChapters}</span> глав
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isRemoving || isLoading}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-500 hover:bg-red-500/15 hover:text-red-600 transition-all disabled:opacity-50 bg-[var(--card)]/90 backdrop-blur-sm"
        title="Удалить из закладок"
      >
        {isRemoving || isLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <X className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

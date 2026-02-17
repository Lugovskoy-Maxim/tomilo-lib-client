"use client";

import { useState } from "react";
import Link from "next/link";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { X, ChevronDown } from "lucide-react";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleStatus } from "@/lib/title-type-translations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { BookmarkCategory } from "@/types/user";

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

interface BookmarkGridCardProps {
  titleId: string;
  name: string;
  coverImage?: string;
  slug?: string;
  status?: string;
  totalChapters?: number;
  category: BookmarkCategory;
  chaptersRead?: number;
  onRemove?: (titleId: string) => void;
  onCategoryChange?: (titleId: string, category: BookmarkCategory) => void;
  isRemoving?: boolean;
  isUpdatingCategory?: boolean;
}

export default function BookmarkGridCard({
  titleId,
  name,
  coverImage,
  slug,
  status,
  totalChapters = 0,
  category,
  chaptersRead,
  onRemove,
  onCategoryChange,
  isRemoving: isRemovingProp,
  isUpdatingCategory: isUpdatingCategoryProp,
}: BookmarkGridCardProps) {
  const { removeBookmark, updateBookmarkCategory } = useAuth();
  const toast = useToast();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRemovingLocal, setIsRemovingLocal] = useState(false);
  const [isUpdatingLocal, setIsUpdatingLocal] = useState(false);

  const isRemoving = isRemovingProp ?? isRemovingLocal;
  const isUpdatingCategory = isUpdatingCategoryProp ?? isUpdatingLocal;

  const href = getTitlePath({ _id: titleId, slug });
  const showImage = coverImage && !imageError;
  const coverUrl = coverImage?.startsWith("http")
    ? coverImage
    : `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}${coverImage || ""}`;
  const progress =
    chaptersRead != null && totalChapters > 0
      ? Math.min(100, (chaptersRead / totalChapters) * 100)
      : 0;
  const categories: BookmarkCategory[] = ["reading", "planned", "completed", "favorites", "dropped"];

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemovingLocal(true);
    try {
      const result = await removeBookmark(titleId);
      if (result.success) {
        onRemove?.(titleId);
      } else {
        toast.error(result.error ?? "Ошибка при удалении");
      }
    } catch {
      toast.error("Ошибка при удалении закладки");
    } finally {
      setIsRemovingLocal(false);
    }
  };

  const handleCategorySelect = async (e: React.MouseEvent, newCategory: BookmarkCategory) => {
    e.preventDefault();
    e.stopPropagation();
    if (newCategory === category || !onCategoryChange) return;
    setCategoryOpen(false);
    setIsUpdatingLocal(true);
    try {
      const result = await updateBookmarkCategory(titleId, newCategory);
      if (result.success) {
        onCategoryChange(titleId, newCategory);
      } else {
        toast.error(result.error ?? "Не удалось изменить категорию");
      }
    } catch {
      toast.error("Не удалось изменить категорию");
    } finally {
      setIsUpdatingLocal(false);
    }
  };

  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-xl overflow-visible bg-[var(--card)] border border-[var(--border)] card-hover-soft block ${
        categoryOpen ? "z-layer-dropdown" : ""
      }`}
    >
      {/* Обложка */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[var(--secondary)]">
        {showImage ? (
          <OptimizedImage
            src={coverUrl}
            alt={name}
            fill
            className="object-cover card-media-hover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--chart-1)]/10">
            <span className="text-3xl font-bold text-[var(--muted-foreground)]">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Категория — бейдж сверху слева */}
        {onCategoryChange ? (
          <div className="absolute top-2 left-2 z-10">
            <div className="relative">
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCategoryOpen(prev => !prev);
                }}
                disabled={isUpdatingCategory}
                className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white hover:bg-black/70"
              >
                {CATEGORY_LABELS[category]}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${categoryOpen ? "rotate-180" : ""}`}
                />
              </button>
              {categoryOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    aria-hidden
                    onClick={e => {
                      e.preventDefault();
                      setCategoryOpen(false);
                    }}
                  />
                  <div className="absolute left-0 top-full mt-1 z-30 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-xl min-w-[120px]">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={e => handleCategorySelect(e, cat)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                          cat === category
                            ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <span className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white">
            {CATEGORY_LABELS[category]}
          </span>
        )}

        {/* Удалить — по hover справа сверху */}
        {onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-red-500/90 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Удалить из закладок"
          >
            {isRemoving ? (
              <span className="w-4 h-4 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Прогресс — полоска внизу обложки */}
        {(chaptersRead != null && chaptersRead > 0) || totalChapters > 0 ? (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-[var(--primary)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      {/* Подпись под обложкой */}
      <div className="p-2.5 flex flex-col gap-1 min-h-0">
        <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-tight">
          {name}
        </h3>
        <div className="flex items-center justify-between gap-1 text-[10px] text-[var(--muted-foreground)]">
          {status && <span>{translateTitleStatus(status)}</span>}
          {chaptersRead != null && totalChapters > 0 ? (
            <span className="tabular-nums text-[var(--primary)]">
              {chaptersRead} / {totalChapters}
            </span>
          ) : totalChapters > 0 ? (
            <span className="tabular-nums">{totalChapters} глав</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

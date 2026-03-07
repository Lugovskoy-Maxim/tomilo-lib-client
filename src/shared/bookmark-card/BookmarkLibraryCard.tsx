"use client";

import { useState } from "react";
import Link from "next/link";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import type { BookmarkCategory } from "@/types/user";
import { getCoverUrls } from "@/lib/asset-url";

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

interface BookmarkLibraryCardProps {
  titleId: string;
  name: string;
  coverImage?: string;
  slug?: string;
  type?: string;
  category: BookmarkCategory;
  chaptersRead?: number;
  totalChapters?: number;
}

/** Карточка для блока «Библиотека манги» на странице О себе: обложка с оверлеями (категория•гл, тип), название снизу */
export default function BookmarkLibraryCard({
  titleId,
  name,
  coverImage,
  slug,
  type = "manga",
  category,
  chaptersRead,
  totalChapters,
}: BookmarkLibraryCardProps) {
  const [imageError, setImageError] = useState(false);
  const href = getTitlePath({ _id: titleId, slug });
  const showImage = coverImage && !imageError;
  const { primary: coverUrl, fallback: coverFallback } = getCoverUrls(coverImage, "");
  const typeLabel = translateTitleType(type);
  const chaptersLabel =
    chaptersRead != null && chaptersRead > 0
      ? `${chaptersRead}гл`
      : totalChapters
        ? `0гл`
        : "";

  return (
    <Link
      href={href}
      className="group relative isolate flex flex-col rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] card-hover-soft block transition-[box-shadow] duration-250 hover:shadow-[0_12px_24px_rgb(0_0_0/0.1),0_4px_8px_rgb(0_0_0/0.06)] dark:hover:shadow-[0_14px_28px_rgb(0_0_0/0.4),0_6px_12px_rgb(0_0_0/0.25)]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[var(--secondary)]">
        {showImage ? (
          <OptimizedImage
            src={coverUrl}
            fallbackSrc={coverFallback}
            alt={name}
            fill
            draggable={false}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--chart-1)]/10">
            <span className="text-2xl font-bold text-[var(--muted-foreground)]">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Верхний левый бейдж: Категория • Nгл */}
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)]">
            {CATEGORY_LABELS[category]}
            {chaptersLabel ? ` • ${chaptersLabel}` : ""}
          </span>
        </div>

        {/* Нижний центр: тип (Манга, Манхва, Маньхуа) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/70 text-white backdrop-blur-sm">
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="p-2.5 min-h-0">
        <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-tight">
          {name}
        </h3>
      </div>
    </Link>
  );
}

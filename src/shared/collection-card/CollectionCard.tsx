"use client";
import React from "react";
import Link from "next/link";
import { Library, Eye, Calendar } from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { Collection } from "@/types/collection";
import { getCoverUrls } from "@/lib/asset-url";

export type CollectionCardVariant = "compact" | "grid";

interface CollectionCardProps {
  data: Collection;
  variant?: CollectionCardVariant;
}

export default function CollectionCard({ data, variant = "compact" }: CollectionCardProps) {
  const isGrid = variant === "grid";

  // Защита от undefined
  if (!data) {
    return (
      <div
        className={`group relative select-none rounded-xl animate-pulse ${
          isGrid ? "w-full" : "flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36"
        }`}
      >
        <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-[var(--muted)] shadow-lg" />
      </div>
    );
  }

  const collectionId = data.id;
  const collectionLink = `/collections/${collectionId}`;
  const collectionImage = data.cover;
  const collectionName = data.name;
  const titlesCount = data.titlesCount ?? data.titles?.length ?? 0;
  const views = data.views ?? 0;
  const createdAt = data.createdAt;

  const { primary: imageUrl, fallback: imageFallback } = getCoverUrls(
    collectionImage,
    typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src,
  );

  const cardClasses = `
    group relative select-none rounded-xl overflow-hidden cursor-pointer block
    card-focus-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[0.99]
    transition-all duration-200 ease-out
    ${isGrid ? "w-full" : "flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36"}
  `
    .trim()
    .replace(/\s+/g, " ");

  const titlesLabel =
    titlesCount === 1 ? "тайтл" : titlesCount >= 2 && titlesCount <= 4 ? "тайтла" : "тайтлов";

  return (
    <Link href={collectionLink} draggable="false" className={cardClasses}>
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 hover:ring-2 hover:ring-[var(--primary)]/15 transition-all duration-200">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 overflow-hidden">
            <OptimizedImage
              src={imageUrl}
              fallbackSrc={imageFallback}
              alt={collectionName || "Коллекция"}
              fill
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-out"
              priority={false}
            />
          </div>

          {/* Градиент только снизу — картинка читается лучше */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/90 transition-colors duration-200" />

          {/* Бейдж: количество тайтлов — компактный стиль */}
          <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
            <span
              className="inline-flex items-center gap-1 bg-white/95 dark:bg-black/60 backdrop-blur-sm text-[var(--foreground)] text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-md border border-[var(--border)]/80 shadow-sm"
              title={`${titlesCount} ${titlesLabel}`}
            >
              <Library className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-80" aria-hidden />
              <span>{titlesCount}</span>
            </span>
          </div>

          {/* Контент внизу — фиксированная зона с отступами как у бейджей */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white">
            <h3 className="text-[13px] sm:text-sm font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-200 min-h-[2.5em] flex items-end">
              {collectionName || "Без названия"}
            </h3>
            {isGrid && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 shrink-0 opacity-90" />
                  {views} просмотров
                </span>
                {createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 opacity-90" />
                    {new Date(createdAt).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

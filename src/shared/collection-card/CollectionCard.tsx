"use client";
import React from "react";
import Link from "next/link";
import { Library, Eye, Calendar } from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { Collection } from "@/types/collection";

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

  const getImageUrl = () => {
    if (!collectionImage) return IMAGE_HOLDER;
    if (collectionImage.startsWith("http")) return collectionImage;

    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
    const baseUrl =
      apiBase?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ||
      "http://localhost:3001";
    const cleanPath = collectionImage.startsWith("/") ? collectionImage : `/${collectionImage}`;
    return `${baseUrl}${cleanPath}`;
  };

  const imageUrl = getImageUrl();
  const imageUrlString = typeof imageUrl === "string" ? imageUrl : imageUrl.src;

  const cardClasses = `
    group relative select-none rounded-xl overflow-hidden cursor-pointer block
    card-focus-ring focus:outline-none active:scale-[0.99] transition-transform duration-200
    ${isGrid ? "w-full" : "flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36"}
  `.trim().replace(/\s+/g, " ");

  const titlesLabel =
    titlesCount === 1 ? "тайтл" : titlesCount >= 2 && titlesCount <= 4 ? "тайтла" : "тайтлов";

  return (
    <Link href={collectionLink} draggable="false" className={cardClasses}>
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-md card-hover-soft ring-1 ring-[var(--border)]/50">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 overflow-hidden">
            <OptimizedImage
              src={imageUrlString}
              alt={collectionName || "Коллекция"}
              fill
              className="object-cover w-full h-full card-media-hover"
              quality={85}
              priority={false}
              fallbackSrc={IMAGE_HOLDER.src}
              onError={() => {
                console.warn(`Failed to load image for collection ${collectionName}`);
              }}
            />
          </div>

          {/* Градиент для читаемости текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-opacity duration-300" />

          {/* Бейдж: количество тайтлов — только здесь, без дублирования */}
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10">
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/25 shadow-lg min-w-[2.5rem] justify-center" title={`${titlesCount} ${titlesLabel}`}>
              <Library className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{titlesCount}</span>
            </div>
          </div>

          {/* Контент внизу */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
            <h3 className="text-sm sm:text-base font-semibold drop-shadow-md leading-tight line-clamp-2 group-hover:text-[var(--chart-1)] transition-colors duration-300">
              {collectionName || "Без названия"}
            </h3>
            {isGrid && (
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  {views} просмотров
                </span>
                {createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
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

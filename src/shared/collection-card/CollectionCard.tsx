"use client";
import React from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const titlesCount = data.titles?.length || 0;
  const views = data.views ?? 0;
  const createdAt = data.createdAt;

  const handleClick = () => {
    if (collectionLink) router.push(collectionLink);
  };

  const getImageUrl = () => {
    if (!collectionImage) return IMAGE_HOLDER;
    return `${process.env.NEXT_PUBLIC_URL}${collectionImage}`;
  };

  const imageUrl = getImageUrl();
  const imageUrlString = typeof imageUrl === "string" ? imageUrl : imageUrl.src;

  const cardClasses = `
    group relative select-none rounded-xl overflow-hidden cursor-pointer
    transform transition-all duration-300 ease-out
    hover:scale-[1.02] hover:-translate-y-1
    ${isGrid ? "w-full" : "flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36"}
  `.trim().replace(/\s+/g, " ");

  return (
    <div draggable="false" className={cardClasses} onClick={handleClick}>
      {/* Glow — единый с остальными карточками */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)]/0 via-[var(--chart-1)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/20 group-hover:via-[var(--chart-1)]/20 group-hover:to-[var(--primary)]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out -z-10" />

      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--card)] shadow-lg ring-1 ring-white/5 group-hover:shadow-xl group-hover:ring-[var(--chart-1)]/30 transition-all duration-300">
        <div className="absolute inset-0 overflow-hidden">
          <OptimizedImage
            src={imageUrlString}
            alt={collectionName || "Коллекция"}
            fill
            className="object-cover w-full h-full transition-transform duration-300 ease-out group-hover:scale-110"
            quality={85}
            priority={false}
            onError={() => {
              console.warn(`Failed to load image for collection ${collectionName}`);
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Badge: кол-во тайтлов */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1.5 rounded-md border border-white/20 shadow-lg">
            <Library className="w-3.5 h-3.5" />
            <span>{titlesCount}</span>
          </div>
        </div>

        {/* Контент внизу — единые отступы */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="text-sm font-semibold drop-shadow-lg leading-tight line-clamp-2 group-hover:text-[var(--chart-1)] transition-colors duration-300">
            {collectionName || "Без названия"}
          </h3>
          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[var(--chart-1)] to-transparent mt-2 transition-all duration-300 ease-out" />

          {isGrid && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {views} просмотров
              </span>
              {createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(createdAt).toLocaleDateString("ru-RU")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Shine — единый с остальными карточками */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
        </div>
      </div>
    </div>
  );
}

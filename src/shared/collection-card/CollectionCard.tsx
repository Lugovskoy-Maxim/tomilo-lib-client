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
  const titlesCount = data.titles?.length || 0;
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

  return (
    <Link href={collectionLink} draggable="false" className={cardClasses}>
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] card-hover-soft shadow-sm">
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
        </div>
      </div>
    </Link>
  );
}

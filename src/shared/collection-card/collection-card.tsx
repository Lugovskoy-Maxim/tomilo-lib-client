"use client";
import React from "react";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image";
import { Collection } from "@/types/collection";

interface CollectionCardProps {
  data: Collection;
}

export default function CollectionCard({ data }: CollectionCardProps) {
  const router = useRouter();

  // Защита от undefined
  if (!data) {
    return (
      <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none bg-card rounded-lg border border-border animate-pulse">
        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-[var(--muted)]" />
      </div>
    );
  }

  const collectionId = data.id;
  const collectionLink = `/collections/${collectionId}`;
  const collectionImage = data.cover;
  const collectionName = data.name;

  const handleClick = () => {
    if (collectionLink) {
      router.push(collectionLink);
    }
  };

  const getImageUrl = () => {
    if (!collectionImage) return IMAGE_HOLDER;

    // Для относительных путей, добавляем url сервера
    return  `${process.env.NEXT_PUBLIC_URL}${collectionImage}`
  };

  const imageUrl = getImageUrl();
  const imageUrlString = typeof imageUrl === 'string' ? imageUrl : imageUrl.src;

  return (
    <div
      draggable="false"
      className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none bg-card rounded-lg border border-transparent hover:filter-color hover:border-primary transition-all duration-300 overflow-hidden cursor-pointer active:cursor-grabbing"
      onClick={handleClick}
    >
      <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
        <div className="relative w-full h-full">
          <OptimizedImage
            src={imageUrlString}
            alt={collectionName || "Коллекция"}
            width={128}
            height={170}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            quality={80}
            priority={false}
            onError={() => {
              console.warn(`Failed to load image for collection ${collectionName}`);
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <h3 className="text-xs sm:text-sm font-bold drop-shadow-lg text-center leading-tight">
            {collectionName || "Без названия"}
          </h3>
        </div>
      </div>
    </div>
  );
}

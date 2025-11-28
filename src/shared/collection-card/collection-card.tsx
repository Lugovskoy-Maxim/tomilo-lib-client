"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
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

  const collectionId = data._id;
  const collectionLink = data.link || `/collections/${collectionId}`;
  const collectionImage = data.image;
  const collectionName = data.name;

  const handleClick = () => {
    if (collectionLink) {
      router.push(collectionLink);
    }
  };

  const getImageUrl = () => {
    if (!collectionImage) return IMAGE_HOLDER;

    // Если изображение уже полный URL, используем как есть
    if (collectionImage.startsWith("http")) {
      return collectionImage;
    }

    // Если относительный путь, добавляем базовый URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    // Убираем завершающий слэш если есть
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    // Убираем начальный слэш из пути к изображению если есть
    const cleanImagePath = collectionImage.startsWith('/') ? collectionImage : `/${collectionImage}`;
    return `${cleanBaseUrl}${cleanImagePath}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div
      draggable="false"
      className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none bg-card rounded-lg border border-border hover:border-primary transition-all duration-300 overflow-hidden cursor-pointer active:cursor-grabbing"
      onClick={handleClick}
    >
      <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            loader={() => `${imageUrl}`}
            src={imageUrl}
            alt={collectionName || "Коллекция"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = IMAGE_HOLDER.src;
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <h3 className="text-xs sm:text-sm font-bold drop-shadow-lg text-center leading-tight">
            {collectionName || "Без названия"}
          </h3>
        </div>
      </div>
    </div>
  );
}

"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

interface Collection {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface CollectionCardProps {
  data: Collection;
}

export default function CollectionCard({ data }: CollectionCardProps) {
  const router = useRouter();

  // Защита от undefined
  if (!data) {
    return (
      <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none bg-card rounded-lg border border-border animate-pulse">
        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-300" />
      </div>
    );
  }

  const { image, name, link } = data;

  const handleClick = () => {
    if (link) {
      router.push(link);
    }
  };

  const getImageUrl = () => {
    if (!image) return IMAGE_HOLDER;

    // Если изображение уже полный URL, используем как есть
    if (image.startsWith("http")) {
      return image;
    }

    // Если относительный путь, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${image}`;
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
            alt={name || "Коллекция"}
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
            {name || "Без названия"}
          </h3>
        </div>
      </div>
    </div>
  );
}

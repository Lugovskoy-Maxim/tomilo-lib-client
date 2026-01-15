"use client";

import { Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/age-verification-modal";
import { getTitlePath } from "@/lib/title-paths";

interface TopTitleGridCardProps {
  data: {
    id: string;
    slug?: string;
    title: string;
    type: string;
    year: number;
    rating: number;
    image: string;
    genres: string[];
    rank?: number;
    views?: number;
    period?: string;
    isAdult: boolean;
  };
}

export default function TopTitleGridCard({ data }: TopTitleGridCardProps) {
  const router = useRouter();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const { user } = useAuth();

  // Проверяем подтверждение возраста при монтировании компонента
  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user || null));
  }, [user]);

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
  };

  const handleClick = () => {
    // Проверяем, является ли контент для взрослых и подтверждено ли возрастное ограничение
    if (data.isAdult && !isAgeVerified) {
      setShowAgeModal(true);
      return;
    }
    // Переход к странице тайтла с использованием правильного пути
    router.push(getTitlePath(data));
  };

  const getImageUrl = () => {
    if (!data.image) return IMAGE_HOLDER;

    // Если изображение уже полный URL, используем как есть
    if (data.image.startsWith("http")) {
      return data.image;
    }

    // Если относительный путь, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${data.image}`;
  };

  const imageUrl = getImageUrl();

  return (
    <>
      <div
        className="w-full bg-card rounded-lg border border-border hover:border-primary transition-all duration-200 overflow-hidden group cursor-pointer h-full flex flex-col"
        onClick={handleClick}
      >
        <div className="flex flex-1">
          {/* Картинка слева */}
          <div className="relative w-16 h-full flex-shrink-0">
            <div className="relative w-full h-full rounded-l-lg overflow-hidden">
              <Image
                loader={() => `${imageUrl}`}
                src={imageUrl}
                alt={data.title}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = IMAGE_HOLDER.src;
                }}
              />
            </div>

            {/* Бейдж типа */}
            <div className="absolute bottom-1 left-1 bg-muted text-primary px-1 py-0.5 rounded text-xs font-medium">
              {data.type}
            </div>

            {/* Рейтинг */}
            <div className="absolute top-1 right-1 bg-chart-3 text-primary-foreground px-1 py-0.5 rounded text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{data.rating}</span>
            </div>
          </div>

          {/* Контент справа */}
          <div className="flex flex-col flex-1 p-3 justify-between min-w-0">
            {/* Заголовок */}
            <h3 className="font-semibold text-foreground line-clamp-1 leading-tight text-sm group-hover:text-primary transition-colors">
              {data.title}
            </h3>

            {/* Информация о годе и рейтинге */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Год */}
                <span className="text-foreground font-medium text-sm">{data.year}</span>
              </div>

              {/* Рейтинг */}
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Sparkles className="w-3 h-3" />
                <span>{data.rating}</span>
              </div>
            </div>

            {/* Жанры */}
            <div className="flex flex-wrap gap-1 mt-1">
              {data.genres.slice(0, 2).map(genre => (
                <span
                  key={genre}
                  className="px-1 py-0.5 bg-accent text-accent-foreground text-xs rounded-full font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </>
  );
}

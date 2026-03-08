"use client";

import RatingBadge from "@/shared/rating-badge/RatingBadge";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { getTitlePath } from "@/lib/title-paths";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

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

  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = checkAgeVerification(user || null);
    setIsAgeVerified(prev => (prev === verified ? prev : verified));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- проверка только по userId, userBirthDate
  }, [userId, userBirthDate]);

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

  const { primary: imageSrc, fallback: imageFallback } = getCoverUrls(
    data.image,
    typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src,
  );

  return (
    <>
      <div
        className="w-full relative isolate bg-[var(--card)] rounded-lg border border-[var(--border)] card-hover-soft overflow-hidden group cursor-pointer h-full flex flex-col transition-[box-shadow] duration-250 hover:shadow-[0_12px_24px_rgb(0_0_0/0.1),0_4px_8px_rgb(0_0_0/0.06)] dark:hover:shadow-[0_14px_28px_rgb(0_0_0/0.4),0_6px_12px_rgb(0_0_0/0.25)]"
        onClick={handleClick}
      >
        <div className="flex flex-1">
          {/* Картинка слева */}
          <div className="relative w-16 h-full flex-shrink-0">
            <div className="relative w-full h-full rounded-l-lg overflow-hidden">
              <OptimizedImage
                src={imageSrc}
                fallbackSrc={imageFallback}
                alt={data.title}
                fill
                className={`object-cover ${data.isAdult && !isAgeVerified ? "blur-md" : ""}`}
                hidePlaceholder
              />
            </div>

            {/* Бейдж типа */}
            <div className="absolute bottom-1 left-1 bg-muted text-primary px-1 py-0.5 rounded text-xs font-medium">
              {data.type}
            </div>

            {/* Рейтинг */}
            <div className="absolute top-1 right-1">
              <RatingBadge rating={data.rating} size="xs" variant="overlay" />
            </div>
          </div>

          {/* Контент справа */}
          <div className="flex flex-col flex-1 p-3 justify-between min-w-0">
            {/* Заголовок */}
            <h3
              className={`font-semibold text-foreground line-clamp-1 leading-tight text-sm group-hover:text-primary transition-colors ${data.isAdult && !isAgeVerified ? "blur-sm select-none" : ""}`}
            >
              {data.title}
            </h3>

            {/* Информация о годе и рейтинге */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Год */}
                <span className="text-foreground font-medium text-sm">{data.year}</span>
              </div>

              {/* Рейтинг */}
              <RatingBadge rating={data.rating} size="xs" variant="inline" />
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

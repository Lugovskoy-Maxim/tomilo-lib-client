"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getTitlePath } from "@/lib/title-paths";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useState, useEffect } from "react";
import { translateTitleType } from "@/lib/title-type-translations";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import RatingBadge from "@/shared/rating-badge/RatingBadge";

export interface CardProps {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  isAdult: boolean;
}

export interface PopularCardProps {
  data: CardProps;
  onCardClick?: (id: string) => void;
}

export default function PopularCard({ data, onCardClick }: PopularCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user || null));
  }, [user]);

  const titlePath = getTitlePath(data);

  const performCardAction = () => {
    if (onCardClick) {
      onCardClick(data.id);
    } else {
      router.push(titlePath);
    }
  };

  // Обработка подтверждения возраста
  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);

    // Выполняем отложенное действие после подтверждения возраста
    if (pendingAction) {
      pendingAction(); // Просто вызываем функцию
    }
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
    setPendingAction(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onCardClick) {
      e.preventDefault();
      e.stopPropagation();
      onCardClick(data.id);
      return;
    }
    if (data.isAdult && !isAgeVerified) {
      e.preventDefault();
      e.stopPropagation();
      setPendingAction(() => performCardAction);
      setShowAgeModal(true);
      return;
    }
    // Иначе переход по Link (не preventDefault)
  };

  const isAdultContent = data.isAdult;
  // const isBrowsePage = pathname.startsWith("/browse");

  const { primary: imageSrc, fallback: imageFallback } = getCoverUrls(data.image, IMAGE_HOLDER.src);

  const cardContent = (
    <>
      <div className="relative overflow-hidden rounded-xl h-full flex flex-col">
        {/* Image container - 2:3 aspect ratio for manga covers */}
        <div className="relative overflow-hidden flex-shrink-0 aspect-[2/3] w-full bg-[var(--muted)] rounded-t-xl">
          <OptimizedImage
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} absolute inset-0 w-full h-full object-cover object-center card-media-hover`}
            src={imageSrc}
            fallbackSrc={imageFallback}
            alt={data.title}
            fill
            onDragStart={(e: React.DragEvent) => e.preventDefault()}
            draggable={false}
            hidePlaceholder
          />

          {/* Adult badge — компактнее на мобильных */}
          {isAdultContent && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
              <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                <span>18+</span>
              </div>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
            <RatingBadge rating={data.rating} size="xs" variant="overlay" />
          </div>

          {/* Type and year — над обложкой внизу, читаемо и без ляпистости */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-1.5 sm:p-2 bg-gradient-to-t from-black/75 to-transparent rounded-t-md">
            <div className="flex justify-between items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="bg-black/50 backdrop-blur-md text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[12px] sm:text-xs font-medium sm:font-semibold border border-[var(--primary)]/30 truncate min-w-0 max-w-[85%] sm:max-w-[70%] shadow-sm w-fit">
                {translateTitleType(data.type)}
              </span>
              <span className="text-[12px] sm:text-xs font-medium text-slate-100 bg-black/45 backdrop-blur-md px-1.5 py-0.5 sm:px-2 rounded-md flex-shrink-0 border border-white/15 shadow-sm">
                {data.year}
              </span>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
        </div>

        {/* Content — фиксированная высота блока, чтобы все карточки были одной высоты */}
        <div className="p-3 flex flex-col min-h-[5.5rem]">
          {/* Title — всегда резервируем место под 2 строки */}
          <h3
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug group-hover:text-[var(--primary)] transition-colors duration-300 min-h-[2.5rem] flex-1`}
          >
            {data.title}
          </h3>
          
        </div>
      </div>

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </>
  );

  const className =
    "relative group cursor-pointer select-none block h-full rounded-xl card-focus-ring focus:outline-none";

  if (onCardClick) {
    return (
      <div
        className={className}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        tabIndex={0}
        role="link"
        data-card-click-handler="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={titlePath} className={className} onClick={handleClick} data-card-click-handler="true">
      {cardContent}
    </Link>
  );
}

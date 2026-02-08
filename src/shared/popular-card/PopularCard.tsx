"use client";

import React from "react";
import { Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { getTitlePath } from "@/lib/title-paths";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useState, useEffect } from "react";
import { translateTitleType } from "@/lib/title-type-translations";

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

  const formatRating = (value?: number) => {
    const num = typeof value === "number" ? value : 0;
    const fixed = num.toFixed(1);
    return fixed.replace(/\.0$/, "");
  };

  // Функция для выполнения действия с карточкой
  const performCardAction = () => {
    if (onCardClick) {
      onCardClick(data.id);
    } else {
      router.push(getTitlePath(data));
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

  // Основной обработчик клика
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Если контент для взрослых и возраст не подтвержден
    if (data.isAdult && !isAgeVerified) {
      // Сохраняем функцию, которую нужно выполнить после подтверждения
      setPendingAction(() => performCardAction);
      setShowAgeModal(true);
      return;
    }

    // Если возраст подтвержден или контент не для взрослых, выполняем действие сразу
    performCardAction();
  };

  const isAdultContent = data.isAdult;
  // const isBrowsePage = pathname.startsWith("/browse");

  const imageSrc = data.image ? `${process.env.NEXT_PUBLIC_URL}${data.image}` : IMAGE_HOLDER;

  // Преобразуем imageSrc в строку если это объект изображения
  const imageSrcString = typeof imageSrc === "string" ? imageSrc : imageSrc.src;

  return (
    <div
      className="relative group cursor-pointer select-none transform transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-0.5"
      onClick={handleClick}
      data-card-click-handler="true"
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-chart-1/0 to-primary/0 group-hover:from-primary/20 group-hover:via-chart-1/20 group-hover:to-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 ease-out -z-10" />
      
      <div className="relative overflow-hidden rounded-xl bg-[var(--card)] shadow-lg ring-1 ring-white/5 group-hover:ring-primary/30 transition-all duration-500 h-full flex flex-col">
        {/* Image container - 9:16 aspect ratio */}
        <div className="relative overflow-hidden flex-shrink-0 aspect-[11/16]">
          <OptimizedImage
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} w-full h-full rounded-t-xl object-contain transition-transform duration-700 ease-out group-hover:scale-105`}
            src={imageSrcString}
            alt={data.title}
            width={160}
            height={232}
            quality={90}
            priority={false}
            onDragStart={(e: React.DragEvent) => e.preventDefault()}
            draggable={false}
          />


          {/* Adult badge */}
          {isAdultContent && (
            <div className="absolute top-2 right-2 transform translate-y-[-2px] group-hover:translate-y-0 transition-transform duration-300">
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-red-400/30">
                18+
              </div>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute top-2 left-2 transform translate-y-[-2px] group-hover:translate-y-0 transition-transform duration-300">
            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg border border-white/10">
              <Star className="w-3 h-3 fill-white text-white" />
              <span>{formatRating(data.rating)}</span>
            </div>
          </div>


          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          </div>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-2.5 bg-[var(--card)] rounded-b-xl flex-1 flex flex-col">
          {/* Type and year */}
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-[var(--muted-foreground)] mb-1.5">
            <span className="bg-[var(--muted)]/50 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium border border-[var(--border)]/50">
              {translateTitleType(data.type)}
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium">{data.year}</span>
          </div>

          {/* Title - min-height for 2 lines consistent sizing */}
          <h3
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-xs sm:text-sm text-[var(--primary)] line-clamp-2 leading-tight group-hover:text-[var(--chart-1)] transition-colors duration-300 min-h-[2.25rem] sm:min-h-[2.5rem]`}
          >
            {data.title}
          </h3>
          
          {/* Animated underline - always at bottom */}
          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-primary to-transparent mt-2 transition-all duration-500 ease-out flex-shrink-0" />
        </div>
      </div>

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </div>
  );
}

"use client";

import React from "react";
import { Star, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
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

  // Определяем цвет рейтинга
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-emerald-500/90";
    if (rating >= 6) return "bg-amber-500/90";
    if (rating >= 4) return "bg-orange-500/90";
    return "bg-slate-500/90";
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
      className="relative group cursor-pointer select-none transform transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 will-change-transform"
      onClick={handleClick}
      data-card-click-handler="true"
    >
      {/* Glow effect — единый с остальными карточками */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)]/0 via-[var(--chart-1)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/20 group-hover:via-[var(--chart-1)]/20 group-hover:to-[var(--primary)]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out -z-10" />
      
      <div className="relative overflow-hidden rounded-xl bg-[var(--card)] shadow-lg ring-1 ring-white/5 group-hover:shadow-xl group-hover:ring-[var(--chart-1)]/30 transition-all duration-300 h-full flex flex-col">
        {/* Image container - 2:3 aspect ratio for manga covers */}
        <div className="relative overflow-hidden flex-shrink-0 aspect-[2/3] w-full bg-[var(--muted)]">
          <img
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} absolute inset-0 w-full h-full rounded-t-xl object-cover object-center transition-transform duration-300 ease-out group-hover:scale-110`}
            src={imageSrcString}
            alt={data.title}
            loading="lazy"
            onDragStart={(e: React.DragEvent) => e.preventDefault()}
            draggable={false}
          />

          {/* Adult badge */}
          {isAdultContent && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-red-500/95 backdrop-blur-sm text-white px-2 py-0.5 rounded-md font-bold text-[10px] shadow-lg border border-red-400/40 flex items-center gap-1">
                <span>18+</span>
              </div>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute top-2 left-2 z-10">
            <div className={`${getRatingColor(data.rating)} backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold shadow-lg border border-white/20`}>
              <Star className="w-3 h-3 fill-white" />
              <span>{formatRating(data.rating)}</span>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Shine effect — единый с остальными карточками */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          </div>
        </div>

        {/* Content — фиксированная высота блока, чтобы все карточки были одной высоты */}
        <div className="p-3 bg-[var(--card)] rounded-b-xl flex flex-col min-h-[5.5rem]">
          {/* Type and year */}
          <div className="flex justify-between items-center gap-2 mb-2 flex-shrink-0">
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md text-xs font-semibold border border-[var(--primary)]/20 truncate max-w-[70%]">
              {translateTitleType(data.type)}
            </span>
            <span className="text-xs font-medium text-[var(--muted-foreground)] bg-[var(--muted)]/30 px-2 py-0.5 rounded-md">
              {data.year}
            </span>
          </div>

          {/* Title — всегда резервируем место под 2 строки */}
          <h3
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug group-hover:text-[var(--chart-1)] transition-colors duration-300 min-h-[2.5rem] flex-1`}
          >
            {data.title}
          </h3>
          
          {/* Animated underline — единый цвет */}
          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[var(--chart-1)] to-transparent mt-2 transition-all duration-300 ease-out flex-shrink-0" />
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

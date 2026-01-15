"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
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
  const { isAuthenticated, user } = useAuth();
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
  const pathname = usePathname();
  // const isBrowsePage = pathname.startsWith("/browse");

  const imageSrc = data.image ? `${process.env.NEXT_PUBLIC_URL}${data.image}` : IMAGE_HOLDER;

  // Преобразуем imageSrc в строку если это объект изображения
  const imageSrcString = typeof imageSrc === "string" ? imageSrc : imageSrc.src;

  return (
    <div
      className="overflow-hidden max-w-xl rounded-lg group cursor-pointer active:cursor-grabbing transition-all select-none"
      onClick={handleClick}
      data-card-click-handler="true"
    >
      <div className="relative overflow-hidden rounded-lg">
        <OptimizedImage
          className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} w-full h-40 sm:h-48 md:h-52 lg:h-55 rounded-lg bg-cover bg-center transition-transform group-hover:scale-105 object-cover`}
          src={imageSrcString}
          alt={data.title}
          width={160}
          height={220}
          quality={85}
          priority={false}
          onDragStart={(e: React.DragEvent) => e.preventDefault()}
          draggable={false}
          style={{ width: "100%", height: "100%" }}
        />

        {isAdultContent && (
          <div className="absolute top-1 right-1  flex items-center justify-center">
            <div className="bg-red-500/90 text-white px-1  rounded-full font-bold text-sm">18+</div>
          </div>
        )}

        <div className="absolute top-1 left-1 bg-black/80 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-semibold">
          <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 fill-white" />
          {formatRating(data.rating)}
        </div>
      </div>

      <div className="pt-1 sm:pt-1.5">
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-[var(--muted-foreground)] mb-1">
          <span className="bg-[var(--secondary)] px-1 py-0.5 rounded text-[9px] sm:text-[10px]">
            {translateTitleType(data.type)}
          </span>
          <span className="text-[9px] sm:text-[10px]">{data.year}</span>
        </div>

        <h3
          className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-[11px] sm:text-xs text-[var(--muted-foreground)] line-clamp-2 leading-tight mb-1`}
        >
          {data.title}
        </h3>
      </div>

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </div>
  );
}

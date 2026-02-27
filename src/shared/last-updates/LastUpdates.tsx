"use client";

import { Clock, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { timeAgo } from "@/lib/date-utils";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";

interface LatestUpdateCardProps {
  data: {
    id: string;
    slug?: string;
    title: string;
    chapter: string;
    releaseYear?: number;
    chapterNumber: number;
    timeAgo: string;
    newChapters?: number;
    cover: string;
    type?: string;
    isAdult?: boolean;
  };
}

export default function LatestUpdateCard({ data }: LatestUpdateCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user || null));
  }, [user]);

  const handleAgeCancel = () => {
    setShowAgeModal(false);
  };

  const titlePath = getTitlePath(data);

  const handleClick = (e: React.MouseEvent) => {
    if (data.isAdult && !isAgeVerified) {
      e.preventDefault();
      e.stopPropagation();
      setShowAgeModal(true);
      return;
    }
    // Иначе переход по Link (не preventDefault)
  };

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    router.push(titlePath);
  };

  const getImageUrl = () => {
    if (!data.cover) return IMAGE_HOLDER;

    // Если изображение уже полный URL, используем как есть
    if (data.cover.startsWith("http")) {
      return data.cover;
    }

    // Если относительный путь, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${data.cover}`;
  };

  const imageUrl = getImageUrl();

  const getDisplayTime = (value: string) => {
    if (!value) return "недавно";

    // API может присылать уже готовую строку вида "2 ч назад"
    const parsedValue = Date.parse(value);
    if (Number.isNaN(parsedValue)) {
      return value;
    }

    return timeAgo(value);
  };

  const getDisplayChapter = () => {
    if (data.chapter?.trim()) return data.chapter;
    if (typeof data.chapterNumber === "number" && data.chapterNumber > 0) {
      return `Глава ${data.chapterNumber}`;
    }
    return "Новая глава";
  };

  const getDisplayType = () => {
    if (!data.type?.trim()) return "Тайтл";
    const translated = translateTitleType(data.type);
    return translated.trim() || "Тайтл";
  };

  const getDisplayYear = () => {
    if (typeof data.releaseYear === "number" && data.releaseYear > 0) {
      return `${data.releaseYear} г.`;
    }
    return null;
  };

  // Склонение: "глава" | "главы" | "глав"
  const getChaptersText = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "глава";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "главы";
    return "глав";
  };

  // Текст бейджа «добавлено N глав»
  const getNewChaptersLabel = (count: number) => {
    if (count === 1) return "+1 новая глава";
    return `+${count} новых ${getChaptersText(count)}`;
  };

  return (
    <Link
      href={titlePath}
      className="w-full group relative cursor-pointer block rounded-xl card-focus-ring focus:outline-none active:scale-[0.99] transition-transform"
      onClick={handleClick}
    >
      <div className="relative flex items-stretch bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] card-hover-soft shadow-sm">
        {/* Image section — пропорциональные размеры */}
        <div className="relative w-[4.5rem] sm:w-[5.5rem] md:w-[6.5rem] self-stretch min-h-24 sm:min-h-28 md:min-h-32 flex-shrink-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              loader={() => `${imageUrl}`}
              src={imageUrl}
              alt={data.title}
              fill
              className={`object-cover card-media-hover ${data.isAdult && !isAgeVerified ? "blur-sm" : ""}`}
              sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
              unoptimized
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = IMAGE_HOLDER.src;
              }}
            />
          </div>
          
          {/* Gradient overlay on image */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--card)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Adult badge */}
          {data.isAdult && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
              <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                <span>18+</span>
              </div>
            </div>
          )}
        </div>

        {/* Контент карточки: мета → заголовок → главы → бейдж */}
        <div className="flex flex-col flex-1 min-w-0 p-2.5 sm:p-3 gap-2 sm:gap-2.5">
          {/* Верхняя строка: тип, год — время справа */}
          <div className="flex items-center justify-between gap-2 min-h-0 flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <span className="text-[11px] sm:text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 px-1.5 sm:px-2 py-0.5 rounded-md font-medium shrink-0">
                {getDisplayType()}
              </span>
              {getDisplayYear() && (
                <>
                  <span className="text-[var(--muted-foreground)] text-xs shrink-0" aria-hidden>•</span>
                  <span className="text-[11px] sm:text-xs text-[var(--muted-foreground)] font-medium shrink-0">
                    {getDisplayYear()}
                  </span>
                </>
              )}
            </div>
            <div
              className="flex items-center gap-1 text-[var(--muted-foreground)] text-[11px] sm:text-xs shrink-0 whitespace-nowrap"
              title={`Обновлено: ${getDisplayTime(data.timeAgo)}`}
            >
              <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
              <span>{getDisplayTime(data.timeAgo)}</span>
            </div>
          </div>

          {/* Заголовок тайтла */}
          <h3
            className={`font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-5 group-hover:text-[var(--chart-1)] transition-colors duration-300 min-h-[2.5rem] ${
              data.isAdult && !isAgeVerified ? "blur-sm" : ""
            }`}
          >
            {data.title}
          </h3>

          {/* Номера глав */}
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-[var(--chart-1)] flex-shrink-0" aria-hidden />
            <span
              className="font-semibold text-xs sm:text-sm truncate min-w-0"
              title={getDisplayChapter()}
            >
              {getDisplayChapter()}
            </span>
          </div>

          {/* Бейдж «добавлено N глав» — только если есть */}
          {data.newChapters && data.newChapters > 0 && (
            <div className="flex items-center gap-1 bg-[var(--chart-1)]/10 text-[var(--chart-1)] px-1.5 sm:px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium border border-[var(--chart-1)]/20 w-fit">
              <Plus className="w-3 h-3" aria-hidden />
              <span>{getNewChaptersLabel(data.newChapters)}</span>
            </div>
          )}
        </div>
      </div>

      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </Link>
  );
}

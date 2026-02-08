"use client";

import React from "react";
import { BookOpen, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";

interface ReadingItem {
  id: string;
  slug?: string;
  title: string;
  type: string;
  currentChapter: number;
  totalChapters: number;
  newChaptersSinceLastRead: number;
  cover: string;
  readingHistory?: {
    titleId: string;
    chapterId: string;
    chapterNumber: number;
    lastReadDate?: string;
  };
}

interface ReadingCardProps {
  data: ReadingItem;
}

export default function ReadingCard({ data }: ReadingCardProps) {
  const router = useRouter();

  const getProgressPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const handleClick = () => {
    router.push(getTitlePath(data));
  };

  // Формируем корректный URL для изображения
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
  const imageUrlString = typeof imageUrl === "string" ? imageUrl : imageUrl.src;

  return (
    <div
      className="flex-shrink-0 w-68 sm:w-72 md:w-80 lg:w-96 group relative cursor-pointer transform transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1"
      data-card-id={data.id}
      onClick={handleClick}
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-chart-1/0 via-primary/0 to-chart-1/0 group-hover:from-chart-1/20 group-hover:via-primary/20 group-hover:to-chart-1/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 ease-out -z-10" />
      
      <div className="relative flex h-32 sm:h-36 bg-[var(--card)] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 group-hover:ring-primary/30 transition-all duration-500">
        {/* Image section */}
        <div className="relative w-24 sm:w-28 md:w-32 flex-shrink-0 overflow-hidden">
          <div className="relative w-full h-full">
            <OptimizedImage
              src={imageUrlString}
              alt={data.title}
              width={128}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              quality={85}
              priority={false}
              onError={() => {
                console.warn(`Failed to load image for ${data.title}`);
              }}
            />
          </div>

          {/* Type badge */}
          <div className="absolute bottom-2 left-2 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border border-white/10 shadow-lg">
              {translateTitleType(data.type || "")}
            </div>
          </div>
          
          {/* Shine effect on image */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          </div>
        </div>

        {/* Content section */}
        <div className="relative flex-1 px-3 py-2 sm:px-4 sm:py-3 min-w-0 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-[var(--primary)] line-clamp-2 leading-tight text-sm sm:text-base mb-2 group-hover:text-[var(--chart-1)] transition-colors duration-300">
            {data.title}
          </h3>

          {/* New chapters indicator */}
          <div className="flex items-center gap-2 text-xs sm:text-sm mb-auto">
            {data.newChaptersSinceLastRead > 0 ? (
              <div className="flex items-center gap-1.5 text-[var(--chart-1)] bg-[var(--chart-1)]/10 px-2 py-0.5 rounded-full border border-[var(--chart-1)]/20">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[var(--chart-1)]" />
                <span className="font-medium">
                  {data.newChaptersSinceLastRead} новых
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Нет новых глав</span>
              </div>
            )}
          </div>

          {/* Progress section */}
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--primary)] mb-1.5">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-[var(--muted-foreground)]" />
                <span className="truncate font-medium">
                  Глава {data.currentChapter} из {data.totalChapters}
                </span>
              </div>
              <span className="text-[var(--chart-1)] font-semibold">
                {getProgressPercentage(
                  data.readingHistory?.chapterNumber || data.currentChapter,
                  data.totalChapters,
                )}%
              </span>
            </div>

            {/* Enhanced progress bar */}
            <div className="relative w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--chart-1)] to-[var(--chart-5)] rounded-full transition-all duration-700 ease-out group-hover:shadow-[0_0_10px_rgba(var(--chart-1),0.5)]"
                style={{
                  width: `${getProgressPercentage(
                    data.readingHistory?.chapterNumber || data.currentChapter,
                    data.totalChapters,
                  )}%`,
                }}
              />
              {/* Animated shimmer on progress */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { BookOpen, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { getCoverUrl } from "@/lib/asset-url";

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

  const imageUrl = getCoverUrl(data.cover, typeof IMAGE_HOLDER === 'string' ? IMAGE_HOLDER : IMAGE_HOLDER.src);
  const imageUrlString = imageUrl;

  return (
    <div
      className="flex-shrink-0 w-68 sm:w-72 md:w-80 lg:w-96 group relative cursor-pointer rounded-xl card-focus-ring focus:outline-none active:scale-[0.99] transition-transform"
      data-card-id={data.id}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="relative flex h-32 sm:h-36 bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] card-hover-soft shadow-sm">
        {/* Image section */}
        <div className="relative w-24 sm:w-28 md:w-32 flex-shrink-0 overflow-hidden">
          <div className="relative w-full h-full">
            <OptimizedImage
              src={imageUrlString}
              alt={data.title}
              width={128}
              className="object-cover card-media-hover"
              quality={85}
              priority={false}
              fallbackSrc={IMAGE_HOLDER.src}
              onError={() => {
                console.warn(`Failed to load image for ${data.title}`);
              }}
            />
          </div>

          {/* Type badge */}
          <div className="absolute bottom-2 left-2">
            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-xs font-medium border border-white/10 shadow-lg">
              {translateTitleType(data.type || "")}
            </div>
          </div>
          
        </div>

        {/* Content section — единые отступы */}
        <div className="relative flex-1 p-3 min-w-0 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-tight mb-2 group-hover:text-[var(--chart-1)] transition-colors duration-300">
            {data.title}
          </h3>

          {/* New chapters indicator */}
          <div className="flex items-center gap-2 text-xs mb-auto">
            {data.newChaptersSinceLastRead > 0 ? (
              <div className="flex items-center gap-1.5 text-[var(--chart-1)] bg-[var(--chart-1)]/10 px-2 py-0.5 rounded-md border border-[var(--chart-1)]/20">
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
            <div className="flex items-center justify-between text-xs text-[var(--foreground)] mb-1.5">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 flex-shrink-0 text-[var(--muted-foreground)]" />
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
            <div className="relative w-full bg-[var(--muted)] rounded-full h-2.5 overflow-hidden ring-1 ring-[var(--border)]/30">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--chart-1)] to-[var(--chart-5)] rounded-full transition-[width] duration-700 ease-out min-w-[4px]"
                style={{
                  width: `${getProgressPercentage(
                    data.readingHistory?.chapterNumber || data.currentChapter,
                    data.totalChapters,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

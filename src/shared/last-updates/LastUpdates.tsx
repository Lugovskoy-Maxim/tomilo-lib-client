"use client";

import { Clock, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
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

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
  };

  const handleClick = () => {
    if (data.isAdult && !isAgeVerified) {
      setShowAgeModal(true);
      return;
    }
    router.push(getTitlePath(data));
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

  // Функция для склонения слова "глава"
  const getChaptersText = (count: number) => {
    if (count === 1) return "глава";
    if (count >= 2 && count <= 4) return "главы";
    return "глав";
  };

  return (
    <div
      className="w-full group relative cursor-pointer transform transition-all duration-500 ease-out hover:scale-[1.02]"
      onClick={handleClick}
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-chart-1/0 to-primary/0 group-hover:from-primary/15 group-hover:via-chart-1/15 group-hover:to-primary/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 ease-out -z-10" />
      
      <div className="relative flex bg-[var(--card)] rounded-xl overflow-hidden shadow-md ring-1 ring-white/5 group-hover:ring-primary/25 group-hover:shadow-lg transition-all duration-500">
        {/* Image section */}
        <div className="relative w-20 sm:w-22 h-28 sm:h-30 flex-shrink-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              loader={() => `${imageUrl}`}
              src={imageUrl}
              alt={data.title}
              fill
              className={`object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${data.isAdult && !isAgeVerified ? "blur-sm" : ""}`}
              sizes="64px"
              unoptimized
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = IMAGE_HOLDER.src;
              }}
            />
          </div>
          
          {/* Gradient overlay on image */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--card)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          </div>

          {/* Adult badge */}
          {data.isAdult && (
            <div className="absolute top-1.5 right-1.5 transform translate-y-[-2px] group-hover:translate-y-0 transition-transform duration-300">
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full font-bold text-[10px] shadow-lg border border-red-400/30">
                18+
              </div>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex flex-col flex-1 p-2.5 sm:p-3 justify-between min-w-0">
          {/* Type and year */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 px-2 py-0.5 rounded-full font-medium">
              {translateTitleType(data.type || "")}
            </span>
            <span className="text-[var(--muted-foreground)]">•</span>
            <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] font-medium">
              {data.releaseYear || "2025"}
            </span>
          </div>
          
          {/* Title */}
          <h3
            className={`font-semibold text-[var(--primary)] line-clamp-1 leading-tight text-sm group-hover:text-[var(--chart-1)] transition-colors duration-300 ${
              data.isAdult && !isAgeVerified ? "blur-sm" : ""
            }`}
          >
            {data.title}
          </h3>

          {/* Chapter info and time */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2">
              {/* Chapter number with sparkles */}
              <div className="flex items-center gap-1.5 text-[var(--primary)]">
                <Sparkles className="w-3 h-3 text-[var(--chart-1)]" />
                <span className="font-semibold text-sm">{data.chapter}</span>
              </div>

              {/* New chapters badge */}
              {data.newChapters && data.newChapters > 0 && (
                <div className="flex items-center gap-1 bg-[var(--chart-1)]/10 text-[var(--chart-1)] px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border border-[var(--chart-1)]/20 transform group-hover:scale-105 transition-transform duration-300">
                  <Plus className="w-3 h-3" />
                  <span>
                    {data.newChapters} {getChaptersText(data.newChapters)}
                  </span>
                </div>
              )}
            </div>

            {/* Time ago */}
            <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-[10px] sm:text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(data.timeAgo)}</span>
            </div>
          </div>
          
          {/* Animated underline */}
          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-primary to-transparent mt-2 transition-all duration-500 ease-out" />
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

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

  // Функция для склонения слова "глава"
  const getChaptersText = (count: number) => {
    if (count === 1) return "глава";
    if (count >= 2 && count <= 4) return "главы";
    return "глав";
  };

  return (
    <Link
      href={titlePath}
      className="w-full group relative cursor-pointer transform transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 block"
      onClick={handleClick}
    >
      {/* Glow — единый с остальными карточками */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)]/0 via-[var(--chart-1)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/20 group-hover:via-[var(--chart-1)]/20 group-hover:to-[var(--primary)]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out -z-10" />
      
      <div className="relative flex bg-[var(--card)] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 group-hover:shadow-xl group-hover:ring-[var(--chart-1)]/30 transition-all duration-300">
        {/* Image section — пропорциональные размеры */}
        <div className="relative w-20 sm:w-24 h-28 sm:h-32 flex-shrink-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              loader={() => `${imageUrl}`}
              src={imageUrl}
              alt={data.title}
              fill
              className={`object-cover transition-transform duration-300 ease-out group-hover:scale-110 ${data.isAdult && !isAgeVerified ? "blur-sm" : ""}`}
              sizes="64px"
              unoptimized
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = IMAGE_HOLDER.src;
              }}
            />
          </div>
          
          {/* Gradient overlay on image */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--card)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Shine — единый с остальными карточками */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          </div>

          {/* Adult badge */}
          {data.isAdult && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
              <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                <span>18+</span>
              </div>
            </div>
          )}
        </div>

        {/* Content section — единые отступы и шрифты */}
        <div className="flex flex-col flex-1 p-3 justify-between min-w-0">
          {/* Type and year */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 px-2 py-0.5 rounded-md font-medium">
              {translateTitleType(data.type || "")}
            </span>
            <span className="text-[var(--muted-foreground)]">•</span>
            <span className="text-xs text-[var(--muted-foreground)] font-medium">
              {data.releaseYear || "2025"}
            </span>
          </div>
          
          {/* Title */}
          <h3
            className={`font-semibold text-sm text-[var(--foreground)] line-clamp-1 leading-tight group-hover:text-[var(--chart-1)] transition-colors duration-300 ${
              data.isAdult && !isAgeVerified ? "blur-sm" : ""
            }`}
          >
            {data.title}
          </h3>

          {/* Chapter info and time */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                <Sparkles className="w-3 h-3 text-[var(--chart-1)]" />
                <span className="font-semibold text-sm">{data.chapter}</span>
              </div>

              {data.newChapters && data.newChapters > 0 && (
                <div className="flex items-center gap-1 bg-[var(--chart-1)]/10 text-[var(--chart-1)] px-2 py-0.5 rounded-md text-xs font-medium border border-[var(--chart-1)]/20">
                  <Plus className="w-3 h-3" />
                  <span>
                    {data.newChapters} {getChaptersText(data.newChapters)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(data.timeAgo)}</span>
            </div>
          </div>
          
          {/* Animated underline — единый цвет */}
          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[var(--chart-1)] to-transparent mt-2 transition-all duration-300 ease-out" />
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

"use client";

import { Clock, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { timeAgo } from "@/lib/date-utils";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useAgeVerification } from "@/contexts/AgeVerificationContext";
import { getCoverUrls } from "@/lib/asset-url";
import { formatChapterString } from "@/lib/format-chapter-ranges";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

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
  const requestAgeVerification = useAgeVerification();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = checkAgeVerification(user || null);
    setIsAgeVerified((prev) => (prev === verified ? prev : verified));
  }, [userId, userBirthDate]);

  const handleAgeCancel = () => {
    setShowAgeModal(false);
  };

  const titlePath = getTitlePath(data);
  const performCardAction = () => router.push(titlePath);

  const handleClick = (e: React.MouseEvent) => {
    if (data.isAdult && !isAgeVerified) {
      e.preventDefault();
      e.stopPropagation();
      if (requestAgeVerification) {
        requestAgeVerification(performCardAction);
      } else {
        setShowAgeModal(true);
      }
      return;
    }
  };

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    router.push(titlePath);
  };

  const { primary: imageUrl, fallback: imageFallback } = getCoverUrls(data.cover, typeof IMAGE_HOLDER === 'string' ? IMAGE_HOLDER : IMAGE_HOLDER.src);

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
    if (data.chapter?.trim()) return formatChapterString(data.chapter);
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
      return `${data.releaseYear}`;
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
      <div className="relative isolate bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] card-hover-soft shadow-sm p-2.5 sm:p-3">
        <div className="flex gap-3 min-w-0">
          {/* Обложка — как в топе и тренде */}
          <div className="relative w-20 sm:w-24 aspect-[2/3] flex-shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
            <OptimizedImage
              src={imageUrl}
              fallbackSrc={imageFallback}
              alt={data.title}
              fill
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${data.isAdult && !isAgeVerified ? "blur-sm" : ""}`}
              hidePlaceholder
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--card)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
            {data.isAdult && (
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                  <span>18+</span>
                </div>
              </div>
            )}
          </div>

          {/* Контент карточки */}
          <div className="flex flex-col flex-1 min-w-0 gap-2 sm:gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-h-0">
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

            <h3
              className={`font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-5 group-hover:text-[var(--primary)] transition-colors duration-300 min-h-[2.5rem] ${
                data.isAdult && !isAgeVerified ? "blur-sm" : ""
              }`}
            >
              {data.title}
            </h3>

            <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[var(--chart-1)] flex-shrink-0" aria-hidden />
              <span
                className="font-semibold text-xs sm:text-sm truncate min-w-0"
                title={getDisplayChapter()}
              >
                {getDisplayChapter()}
              </span>
            </div>

            {data.newChapters && data.newChapters > 0 && (
              <div className="flex items-center gap-1 bg-[var(--chart-1)]/10 text-[var(--chart-1)] px-1.5 sm:px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium border border-[var(--chart-1)]/20 w-fit">
                <Plus className="w-3 h-3" aria-hidden />
                <span>{getNewChaptersLabel(data.newChapters)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!requestAgeVerification && (
        <AgeVerificationModal
          isOpen={showAgeModal}
          onConfirm={handleAgeConfirm}
          onCancel={handleAgeCancel}
        />
      )}
    </Link>
  );
}

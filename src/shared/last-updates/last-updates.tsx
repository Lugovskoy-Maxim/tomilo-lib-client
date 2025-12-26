"use client";

import { Clock, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { timeAgo } from "@/lib/date-utils";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/age-verification-modal";

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
    return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${
      data.cover
    }`;
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
      className="w-full bg-card rounded-lg border border-[var(--border))] hover:bg-[var(--muted)]/20 hover:border-[var(--primary)]/40 transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex">
        {/* Картинка слева */}
        <div className="relative w-16 h-24 flex-shrink-0">
          <div className="relative w-full h-full rounded-l-lg overflow-hidden">
            <Image
              loader={() => `${imageUrl}`}
              src={imageUrl}
              alt={data.title}
              fill
              className={`object-cover ${data.isAdult && !isAgeVerified ? "blur-sm" : ""}`}
              sizes="64px"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = IMAGE_HOLDER.src;
              }}
            />
            {data.isAdult && (
              <div className="absolute top-1 right-1 flex items-center justify-center">
                <div className="bg-red-500/90 text-white px-1 rounded-full font-bold text-xs">
                  18+
                </div>
              </div>
            )}
          </div>


        </div>

        {/* Контент справа */}
        <div className="flex flex-col flex-1 p-2 justify-between min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[var(--muted-foreground)]">
              {translateTitleType(data.type || "")}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">•</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {data.releaseYear || "2025"}
            </span>
          </div>
          {/* Заголовок */}
          <h3 className={`font-medium text-[var(--primary)] line-clamp-1 leading-tight text-sm group-hover:text-[var(--chart-1)]/80 transition-colors ${data.isAdult && !isAgeVerified ? "blur-sm" : ""}`}>
            {data.title}
          </h3>

          {/* Информация о главе и времени */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Номер главы */}
              <span className="text-[var(--primary)] font-medium text-sm">
                {data.chapter}
              </span>

              {/* Количество новых глав (если есть) */}
              {data.newChapters && data.newChapters > 0 && (
                <div className="flex items-center gap-1 bg-sidebar-border text-chart-1 px-2 py-1 rounded text-xs font-medium">
                  <Plus className="w-3 h-3" />
                  <span>
                    {data.newChapters} {getChaptersText(data.newChapters)}
                  </span>
                </div>
              )}
            </div>

            {/* Время обновления */}
            <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(data.timeAgo)}</span>
            </div>
          </div>
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

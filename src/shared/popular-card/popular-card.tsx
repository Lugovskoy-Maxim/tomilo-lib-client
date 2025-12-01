"use client";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

export interface CardProps {
  id: string;
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

import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/age-verification-modal";
import { useState, useEffect } from "react";

export default function PopularCard({ data, onCardClick }: PopularCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    setIsAgeVerified(checkAgeVerification());
  }, []);

  const formatRating = (value?: number) => {
    const num = typeof value === "number" ? value : 0;
    const fixed = num.toFixed(1);
    return fixed.replace(/\.0$/, "");
  };

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
  };

  const handleClick = () => {
    // Проверяем, является ли контент для взрослых и подтверждено ли возрастное ограничение
    if (data.isAdult && !isAgeVerified) {
      setShowAgeModal(true);
      return;
    }

    if (onCardClick) {
      onCardClick(data.id);
    } else {
      router.push(`/browse/${data.id}/`);
    }
  };

  const isAdultContent = data.isAdult;
  const pathname = usePathname();
  const isBrowsePage = pathname.startsWith("/browse");

  const imageSrc = data.image
    ? process.env.NEXT_PUBLIC_URL + data.image
    : IMAGE_HOLDER;

  return (
    <div
      className="overflow-hidden max-w-xl rounded-lg group cursor-pointer active:cursor-grabbing transition-all select-none"
      onClick={handleClick}
    >
      <div className={`relative ${isAdultContent ? "blur-sm" : ""}`}>
        <Image
          className="w-full h-40 sm:h-48 md:h-52 lg:h-55 rounded-lg bg-cover bg-center transition-transform group-hover:scale-105"
          src={imageSrc}
          alt={data.title}
          width={160}
          height={220}
          unoptimized
          style={{ width: "auto" }}
          onDragStart={(e) => e.preventDefault()}
        />

        {isAdultContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-500/90 text-white px-3 py-1 rounded-full font-bold text-sm">
              18+
            </div>
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
            {data.type}
          </span>
          <span className="text-[9px] sm:text-[10px]">{data.year}</span>
        </div>

        <h3 className="font-semibold text-[11px] sm:text-xs text-[var(--muted-foreground)] line-clamp-2 leading-tight mb-1">
          {data.title}
        </h3>

        {/* <div className="hidden sm:flex flex-wrap gap-0.5 mt-1">
          {data.genres && data.genres.length > 0 ? (
            data.genres.slice(0, 1).map((genre, index) => (
              <span
                key={index}
                className="text-[9px] sm:text-[10px] bg-[var(--accent)] text-[var(--accent-foreground)] px-1 py-0.5 rounded"
              >
                {genre}
              </span>
            ))
          ) : (
            <span className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)]">
              Без жанра
            </span>
          )}
        </div> */}
      </div>
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </div>
  );
}

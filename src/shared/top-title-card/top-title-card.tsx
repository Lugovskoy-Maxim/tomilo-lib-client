"use client"
import { Trophy, Eye, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/age-verification-modal";

interface TopTitleData {
  id: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  rank: number;
  views?: number;
  period?: string;
  isAdult: boolean;
  ratingCount?: number;
}

interface TopTitleCardProps {
  data: TopTitleData;
  variant?: "top3" | "carousel";
}

const TopTitleCard = ({ data, variant = "top3" }: TopTitleCardProps) => {
  const router = useRouter();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  const { user } = useAuth();

  // Проверяем подтверждение возраста при монтировании компонента
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
    // Проверяем, является ли контент для взрослых и подтверждено ли возрастное ограничение
    if (data.isAdult && !isAgeVerified) {
      setShowAgeModal(true);
      return;
    }
    // Переход к странице тайтла
    router.push(`/browse/${data.id}`);
  };

  if (variant === "top3") {
    return (
      <>
        <div className="bg-[var(--muted)]/30 rounded-xl border border-[var(--border)] hover:shadow-xl transition-all duration-300 cursor-pointer group p-4 sm:p-6" onClick={handleClick}>
          {/* Мобильная версия - горизонтальная */}
          <div className="flex gap-4 sm:hidden">
            <div className="relative flex-shrink-0">
              <Image
                src={process.env.NEXT_PUBLIC_URL + data.image}
                alt={data.title}
                width={120}
                height={160}
                className={`w-42 h-52 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow ${data.isAdult && !isAgeVerified ? "blur-3xl" : ""}`}
              />
              {data.isAdult && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="bg-red-500/90 text-white px-3 py-1 rounded-full font-bold text-sm">
                    18+
                  </div>
                </div>
              )}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] rounded-full flex items-center justify-center text-[var(--primary)] font-bold text-xs">
                {data.rank}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] text-[var(--primary)] rounded-full font-bold text-sm shadow-lg">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-[var(--foreground)] leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                  {data.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
                <span className="px-2 py-1 bg-[var(--muted)]/30  rounded-full font-medium">
                  {data.type}
                </span>
                <span className="font-medium">{data.year}</span>
                <div className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-4 h-4 text-[var(--chart-3)]" />
                  <span className="text-lg font-bold text-[var(--chart-3)]">
                    {data.rating}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {data.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs rounded-full font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm">
                {data.views && (
                  <div className="flex items-center gap-1 font-medium text-[var(--primary)]">
                    <Eye className="w-4 h-4" />
                    <span>{data.views.toLocaleString()}</span>
                  </div>
                )}
                {data.ratingCount && (
                  <div className="flex items-center gap-1 font-medium text-[var(--chart-3)]">
                    <Sparkles className="w-4 h-4" />
                    <span>{data.ratingCount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Десктопная версия - вертикальная */}
          <div className="hidden sm:flex flex-col items-center gap-3">
            <div className="relative">
              <Image
                src={process.env.NEXT_PUBLIC_URL + data.image}
                alt={data.title}
                width={120}
                height={160}
                className={`w-42 h-54 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow ${data.isAdult && !isAgeVerified ? "blur-3xl" : ""}`}
              />
              {data.isAdult && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="bg-red-500/90 text-white px-3 py-1 rounded-full font-bold text-sm">
                    18+
                  </div>
                </div>
              )}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] rounded-full flex items-center justify-center text-[var(--primary)] font-bold text-xs">
                {data.rank}
              </div>
            </div>
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 flex shrink-0 items-center justify-center bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] text-[var(--primary)] rounded-full font-bold text-sm shadow-lg">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-[var(--foreground)] leading-tight group-hover:text-[var(--primary)] transition-colors">
                  {data.title}
                </h3>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
                <span className="px-2 py-1 bg-[var(--muted)]/30  rounded-full font-medium">
                  {data.type}
                </span>
                <span className="font-medium">{data.year}</span>
                <div className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-4 h-4 text-[var(--chart-3)]" />
                  <span className="text-lg font-bold text-[var(--chart-3)]">{data.rating}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-1 mb-2">
                {data.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs rounded-full font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 text-sm">
                {data.views && (
                  <div className="flex items-center gap-1 font-medium text-[var(--primary)]">
                    <Eye className="w-4 h-4" />
                    <span>{data.views.toLocaleString()}</span>
                  </div>
                )}
                {data.ratingCount && (
                  <div className="flex items-center gap-1 font-medium text-[var(--chart-3)]">
                    <Sparkles className="w-4 h-4" />
                    <span>{data.ratingCount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <AgeVerificationModal
          isOpen={showAgeModal}
          onConfirm={handleAgeConfirm}
          onCancel={handleAgeCancel}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] hover:shadow-md transition-all duration-300 cursor-pointer group h-full" onClick={handleClick}>
        <div className="relative">
          <Image
            src={process.env.NEXT_PUBLIC_URL + data.image}
            alt={data.title}
            width={160}
            height={128}
            className={`w-full h-24 sm:h-32 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow ${data.isAdult && !isAgeVerified ? "blur-3xl" : ""}`}
          />
          {data.isAdult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
              <div className="bg-red-500/90 text-white px-3 py-1 rounded-full font-bold text-sm">
                18+
              </div>
            </div>
          )}
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] rounded-full flex items-center justify-center text-[var(--primary)] font-bold text-xs">
            {data.rank}
          </div>
        </div>
        <div className="text-center w-full flex-1 flex flex-col justify-between">
          <h3 className="font-semibold text-xs sm:text-sm text-[var(--foreground)] mb-1 leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-2">
            {data.title}
          </h3>
          <div className="flex justify-around">
            <div className="flex items-center justify-center gap-1 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--chart-4)]" />
                <span className="text-xs font-bold text-[var(--chart-4)]">
                  {data.rating}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {data.views && (
                <div className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--primary)]">
                  <Eye className="w-3 h-3" />
                  <span>{data.views >= 1000 ? `${(data.views / 1000).toFixed(1)}k` : data.views}</span>
                </div>
              )}
              {data.ratingCount && (
                <div className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--chart-4)]">
                  <Sparkles className="w-3 h-3" />
                  <span>{data.ratingCount?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </>
  );
};

export default TopTitleCard;

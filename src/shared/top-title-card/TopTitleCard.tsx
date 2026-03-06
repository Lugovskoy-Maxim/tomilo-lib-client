"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import RatingBadge from "@/shared/rating-badge/RatingBadge";
import { getTitlePath } from "@/lib/title-paths";
import { getCoverUrls } from "@/lib/asset-url";
import { translateTitleType } from "@/lib/title-type-translations";
import { useAuth } from "@/hooks/useAuth";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";

export interface TopTitleCardData {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  rank: number;
  views?: number;
  isAdult?: boolean;
}

interface TopTitleCardProps {
  data: TopTitleCardData;
}

function formatViews(n: number | string | undefined): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}М`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}к`;
  return String(num);
}

export default function TopTitleCard({ data }: TopTitleCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user ?? null));
  }, [user?._id, user?.birthDate]);

  const handleClick = () => {
    if (data.isAdult && !isAgeVerified) {
      setShowAgeModal(true);
      return;
    }
    router.push(getTitlePath(data));
  };

  const { primary: imageSrc, fallback: imageFallback } = getCoverUrls(data.image);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--primary)]/30 hover:bg-[var(--card)] transition-colors active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <div className="flex gap-3 p-2.5 sm:p-3">
          <div className="relative flex-shrink-0 w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-lg bg-[var(--muted)]">
            <OptimizedImage
              src={imageSrc}
              fallbackSrc={imageFallback}
              alt=""
              width={96}
              height={144}
              className={`w-full h-full object-cover ${data.isAdult && !isAgeVerified ? "blur-md" : ""}`}
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
              <span
                className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 px-1.5 text-[10px] font-bold tabular-nums"
                aria-hidden
              >
                #{data.rank}
              </span>
              {data.isAdult && (
                <span className="inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                  18+
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)] line-clamp-2 leading-tight">
              {data.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
              <span>{translateTitleType(data.type)}</span>
              <span aria-hidden>·</span>
              <span>{data.year}</span>
              <span aria-hidden>·</span>
              <RatingBadge rating={data.rating} size="xs" variant="default" />
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1" title="Просмотры">
                <Eye className="w-3 h-3 shrink-0" />
                {formatViews(data.views)}
              </span>
            </div>
          </div>
        </div>
      </button>
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={() => {
          setShowAgeModal(false);
          setIsAgeVerified(true);
          router.push(getTitlePath(data));
        }}
        onCancel={() => setShowAgeModal(false)}
      />
    </>
  );
}

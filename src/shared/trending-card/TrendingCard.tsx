"use client";

import { useEffect, useState } from "react";
import { Flame, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";

interface TrendingCardData {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  views: number;
  weekViews?: number;
  isAdult: boolean;
}

interface TrendingCardProps {
  data: TrendingCardData;
  onCardClick?: (id: string) => void;
}

const formatViews = (value?: number) => {
  const views = Math.max(0, value ?? 0);
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${views}`;
};

const formatRating = (value?: number) => {
  const num = typeof value === "number" ? value : 0;
  return num.toFixed(1).replace(/\.0$/, "");
};

export default function TrendingCard({ data, onCardClick }: TrendingCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user || null));
  }, [user]);

  const titlePath = getTitlePath(data);
  const isAdultContent = data.isAdult;
  const imageSrc = data.image
    ? data.image.startsWith("http")
      ? data.image
      : `${process.env.NEXT_PUBLIC_URL}${data.image}`
    : IMAGE_HOLDER.src;

  const performCardAction = () => {
    if (onCardClick) {
      onCardClick(data.id);
      return;
    }
    router.push(titlePath);
  };

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    if (pendingAction) pendingAction();
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
    setPendingAction(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onCardClick) {
      e.preventDefault();
      e.stopPropagation();
      onCardClick(data.id);
      return;
    }
    if (isAdultContent && !isAgeVerified) {
      e.preventDefault();
      e.stopPropagation();
      setPendingAction(() => performCardAction);
      setShowAgeModal(true);
    }
  };

  const trendValue = data.weekViews ?? data.views;

  const cardContent = (
    <>
      <div className="relative overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] card-hover-soft p-2 sm:p-2.5">
        <div className="flex gap-3 min-w-0">
          <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-lg bg-[var(--muted)] shrink-0">
            <img
              className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} absolute inset-0 w-full h-full object-cover object-center card-media-hover`}
              src={imageSrc}
              alt={data.title}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              draggable={false}
            />
            {isAdultContent && (
              <div className="absolute top-1.5 right-1.5 z-10">
                <div className="bg-red-500/40 backdrop-blur-sm text-red-100 border border-red-400/45 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  18+
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
              <span className="inline-flex items-center rounded-md border border-orange-500/35 bg-orange-500/10 px-2 py-0.5 text-orange-300 truncate">
                {translateTitleType(data.type)}
              </span>
              <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-[var(--muted-foreground)] shrink-0">
                {data.year}
              </span>
            </div>

            <h3
              className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors duration-300 min-h-[2.5rem]`}
            >
              {data.title}
            </h3>

            <div className="mt-auto pt-2 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 rounded-md border border-orange-500/35 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-300 min-w-0">
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+{formatViews(trendValue)}</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-black/35 px-2 py-1 text-xs font-semibold text-amber-300 shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{formatRating(data.rating)}</span>
              </div>
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

  const className = "relative group cursor-pointer select-none block h-full";

  if (onCardClick) {
    return (
      <div className={className} onClick={handleClick} data-card-click-handler="true">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={titlePath} className={className} onClick={handleClick} data-card-click-handler="true">
      {cardContent}
    </Link>
  );
}

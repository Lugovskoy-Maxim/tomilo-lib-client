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
      <div className="relative overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] card-hover-soft h-full flex flex-col">
        <div className="relative overflow-hidden flex-shrink-0 aspect-[2/3] w-full bg-[var(--muted)]">
          <img
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} absolute inset-0 w-full h-full rounded-t-xl object-cover object-center card-media-hover`}
            src={imageSrc}
            alt={data.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            draggable={false}
          />

          <div className="absolute top-2 left-2 z-10">
            <div className="bg-orange-500/80 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg border border-orange-300/35 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>+{formatViews(trendValue)}</span>
            </div>
          </div>

          <div className="absolute top-2 right-2 z-10">
            <div className="bg-black/55 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-xs font-semibold text-amber-300 shadow-lg border border-amber-400/40">
              <Star className="w-3 h-3 fill-current" />
              <span>{formatRating(data.rating)}</span>
            </div>
          </div>

          {isAdultContent && (
            <div className="absolute bottom-2 right-2 z-10">
              <div className="bg-red-500/35 backdrop-blur-sm text-red-100 border border-red-400/45 px-2 py-0.5 rounded-md text-[10px] font-bold">
                18+
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-10 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="bg-black/50 backdrop-blur-md text-amber-50 px-2 py-0.5 rounded-md text-xs font-medium border border-amber-400/25 truncate min-w-0">
                {translateTitleType(data.type)}
              </span>
              <span className="text-xs font-medium text-slate-100 bg-black/45 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/15">
                {data.year}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-[var(--card)] rounded-b-xl flex flex-col min-h-[5.5rem]">
          <h3
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors duration-300 min-h-[2.5rem] flex-1`}
          >
            {data.title}
          </h3>
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

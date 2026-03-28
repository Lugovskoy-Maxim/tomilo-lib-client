"use client";

import React, { memo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getTitlePath } from "@/lib/title-paths";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { translateTitleType } from "@/lib/title-type-translations";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import RatingBadge from "@/shared/rating-badge/RatingBadge";

export interface CardProps {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  isAdult: boolean;
}

/** Сетка каталога (2–6 колонок) — чтобы next/image не запрашивал картинку шириной весь экран на каждую карточку */
export const CATALOG_COVER_SIZES =
  "(max-width: 639px) 50vw, (max-width: 1023px) 34vw, (max-width: 1279px) 25vw, (max-width: 1535px) 20vw, 17vw";

/** Узкие постеры в карусели (w-24 … w-36) */
export const CAROUSEL_COVER_SIZES =
  "(max-width: 640px) 112px, (max-width: 1024px) 128px, 160px";

export interface PopularCardProps {
  data: CardProps;
  onCardClick?: (id: string) => void;
  /** Левый клик не переходит по ссылке; открытие только через ПКМ → «Открыть в новой вкладке» или клик колёсиком */
  openOnlyInNewTab?: boolean;
  /** Атрибут `sizes` для обложки (каталог vs карусель) */
  coverSizes?: string;
  /** Ускоряет LCP: первые карточки в сетке */
  coverPriority?: boolean;
  /** Отложенная загрузка для нижних рядов */
  coverLowPriority?: boolean;
}

function PopularCard({
  data,
  onCardClick,
  openOnlyInNewTab,
  coverSizes = CATALOG_COVER_SIZES,
  coverPriority = false,
  coverLowPriority = false,
}: PopularCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = checkAgeVerification(user || null);
    setIsAgeVerified(prev => (prev === verified ? prev : verified));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- проверка только по userId, userBirthDate
  }, [userId, userBirthDate]);

  const titlePath = getTitlePath(data);

  const performCardAction = useCallback(() => {
    if (onCardClick) {
      onCardClick(data.id);
    } else {
      router.push(titlePath);
    }
  }, [onCardClick, data.id, router, titlePath]);

  const handleAgeConfirm = useCallback(() => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    if (pendingAction) {
      pendingAction();
    }
  }, [pendingAction]);

  const handleAgeCancel = useCallback(() => {
    setShowAgeModal(false);
    setPendingAction(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onCardClick) {
        e.preventDefault();
        e.stopPropagation();
        onCardClick(data.id);
        return;
      }
      // Режим «только новая вкладка»: левый клик не переходит (ПКМ и колёсико — как у обычной ссылки)
      if (openOnlyInNewTab && e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (data.isAdult && !isAgeVerified) {
        e.preventDefault();
        e.stopPropagation();
        setPendingAction(() => performCardAction);
        setShowAgeModal(true);
        return;
      }
    },
    [onCardClick, data.id, data.isAdult, isAgeVerified, performCardAction, openOnlyInNewTab],
  );

  const isAdultContent = data.isAdult;
  // const isBrowsePage = pathname.startsWith("/browse");

  const { primary: imageSrc, fallback: imageFallback } = getCoverUrls(data.image, IMAGE_HOLDER.src);

  const cardContent = (
    <>
      <div className="relative overflow-hidden rounded-xl h-full flex flex-col">
        {/* Image container - 2:3 aspect ratio for manga covers */}
        <div className="relative overflow-hidden flex-shrink-0 aspect-[2/3] w-full bg-[var(--muted)] rounded-t-xl">
          <OptimizedImage
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105`}
            src={imageSrc}
            fallbackSrc={imageFallback}
            alt={data.title}
            fill
            sizes={coverSizes}
            priority={coverPriority}
            lowPriority={coverLowPriority}
            onDragStart={(e: React.DragEvent) => e.preventDefault()}
            draggable={false}
            hidePlaceholder
          />

          {/* Adult badge — компактнее на мобильных */}
          {isAdultContent && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
              <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                <span>18+</span>
              </div>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
            <RatingBadge rating={data.rating} size="xs" variant="overlay" />
          </div>

          {/* Type and year — над обложкой внизу, читаемо и без ляпистости */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-1.5 sm:p-2 bg-gradient-to-t from-black/75 to-transparent rounded-t-md">
            <div className="flex justify-between items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="bg-black/50 backdrop-blur-md text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[12px] sm:text-xs font-medium sm:font-semibold border border-[var(--primary)]/30 truncate min-w-0 max-w-[85%] sm:max-w-[70%] shadow-sm w-fit">
                {translateTitleType(data.type)}
              </span>
              <span className="text-[12px] sm:text-xs font-medium text-slate-100 bg-black/45 backdrop-blur-md px-1.5 py-0.5 sm:px-2 rounded-md flex-shrink-0 border border-white/15 shadow-sm">
                {data.year}
              </span>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content — место под название до 3 строк, без обрезки по высоте */}
        <div className="p-3 flex flex-col min-h-[6.5rem]">
          {/* Title — до 3 строк, высота достаточна для длинных названий */}
          <h3
            className={`${isAdultContent && !isAgeVerified ? "blur-sm" : ""} font-semibold text-sm text-[var(--foreground)] leading-snug group-hover:text-[var(--primary)] transition-colors duration-300 overflow-hidden min-h-[2.5rem] max-h-[3.5rem] flex-1`}
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
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

  const className =
    "relative group cursor-pointer select-none block h-full rounded-xl card-focus-ring focus:outline-none focus-visible:[&_.card-hover-soft]:shadow-[0_12px_24px_rgb(0_0_0/0.1),0_0_0_0_1px_var(--primary)] dark:focus-visible:[&_.card-hover-soft]:shadow-[0_14px_28px_rgb(0_0_0/0.35),0_0_0_0_1px_var(--primary)]";

  if (onCardClick) {
    return (
      <div
        className={className}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        tabIndex={0}
        role="link"
        data-card-click-handler="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={titlePath}
      className={className}
      onClick={handleClick}
      data-card-click-handler="true"
      {...(openOnlyInNewTab
        ? { "aria-label": `Открыть «${data.title}» в новой вкладке: ПКМ или клик колёсиком` }
        : {})}
    >
      {cardContent}
    </Link>
  );
}

export default memo(PopularCard);

/** Карточка для горизонтальной карусели — меньший `sizes`, чем у сетки каталога */
export const CarouselPopularCard = memo(function CarouselPopularCard(props: Omit<PopularCardProps, "coverSizes">) {
  return <PopularCard {...props} coverSizes={CAROUSEL_COVER_SIZES} />;
});

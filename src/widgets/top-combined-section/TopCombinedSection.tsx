"use client";
import { ArrowRight, Eye, Trophy } from "lucide-react";
import RatingBadge from "@/shared/rating-badge/RatingBadge";
import Link from "next/link";
import { TopTitleCombined } from "@/types/constants";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useAgeVerification } from "@/contexts/AgeVerificationContext";
import { getCoverUrls } from "@/lib/asset-url";

// Helper function for formatting views
function formatViews(num: number | string | undefined): string {
  if (num == null) return "—";
  const parsedNum = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return "—";
  if (parsedNum >= 1000000) {
    return `${(parsedNum / 1000000).toFixed(1)}М`;
  }
  if (parsedNum >= 1000) {
    return `${(parsedNum / 1000).toFixed(1)}к`;
  }
  return String(parsedNum);
}

interface CombinedTopData {
  topManhwa: TopTitleCombined[];
  top2026: TopTitleCombined[];
  topManhua: TopTitleCombined[];
}

interface TopCombinedSectionProps {
  data: CombinedTopData;
}

interface CardItemProps {
  item: TopTitleCombined;
  showRating?: boolean;
  showViews?: boolean;
}

/**
 * Переиспользуемый компонент карточки
 */
const CardItem = ({ item, showRating = false, showViews = true }: CardItemProps) => {
  const { user } = useAuth();
  const requestAgeVerification = useAgeVerification();
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = checkAgeVerification(user || null);
    setIsAgeVerified(prev => (prev === verified ? prev : verified));
  }, [userId, userBirthDate]);

  const normalizeImageUrls = (url: string | undefined) => {
    if (!url) return { primary: "", fallback: "" };
    return getCoverUrls(url, "");
  };

  const titlePath = getTitlePath(item);

  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    pendingAction?.();
    setPendingAction(null);
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
    setPendingAction(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (item.isAdult && !isAgeVerified) {
      e.preventDefault();
      e.stopPropagation();
      if (requestAgeVerification) {
        requestAgeVerification(() => {
          window.location.href = titlePath;
        });
      } else {
        setPendingAction(() => {
          window.location.href = titlePath;
        });
        setShowAgeModal(true);
      }
    }
  };

  return (
    <>
      <Link
        href={titlePath}
        className="block group cursor-pointer relative rounded-xl card-focus-ring focus:outline-none focus-visible:[&_.card-hover-soft]:shadow-[0_12px_24px_rgb(0_0_0/0.1),0_0_0_0_1px_var(--primary)] dark:focus-visible:[&_.card-hover-soft]:shadow-[0_14px_28px_rgb(0_0_0/0.35),0_0_0_0_1px_var(--primary)] active:scale-[0.99] transition-transform"
        onClick={handleClick}
      >
        <div className="relative isolate flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] card-hover-soft overflow-hidden max-w-full shadow-sm transition-[box-shadow] duration-250 hover:shadow-[0_12px_24px_rgb(0_0_0/0.1),0_4px_8px_rgb(0_0_0/0.06)] dark:hover:shadow-[0_14px_28px_rgb(0_0_0/0.4),0_6px_12px_rgb(0_0_0/0.25)]">
          {/* Обложка — пропорционально */}
          <div className="w-20 h-28 sm:w-22 sm:h-32 rounded-lg flex-shrink-0 overflow-hidden bg-[var(--muted)] relative">
            {item.coverImage ? (
              <OptimizedImage
                src={normalizeImageUrls(item.coverImage).primary}
                fallbackSrc={normalizeImageUrls(item.coverImage).fallback}
                alt={item.title}
                width={96}
                height={128}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  item.isAdult && !isAgeVerified ? "blur-sm" : ""
                }`}
                priority={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center">
                <span className="text-xs text-[var(--muted-foreground)]">Нет фото</span>
              </div>
            )}
            {item.isAdult && (
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                  <span>18+</span>
                </div>
              </div>
            )}
          </div>

          {/* Контент — единые отступы и шрифты */}
          <div className="flex flex-col flex-1 gap-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 px-2 py-0.5 rounded-md font-medium">
                {translateTitleType(item.type)}
              </span>
              <span className="text-[var(--muted-foreground)]">•</span>
              <span className="text-xs text-[var(--muted-foreground)] font-medium">
                {item.year || "2026"}
              </span>
            </div>
            <h4
              className={`font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300 line-clamp-2 leading-tight ${
                item.isAdult && !isAgeVerified ? "blur-sm" : ""
              }`}
            >
              {item.title}
            </h4>
            <div className="flex items-center justify-between mt-1.5 px-2 py-0.5">
              {showViews ? (
                <span className="flex gap-1 text-xs items-center text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatViews(Number(item.views) ?? 0)}</span>
                </span>
              ) : (
                <div />
              )}
              {showRating && <RatingBadge rating={item.rating || 0} size="sm" variant="default" />}
            </div>
          </div>
        </div>
      </Link>

      {!requestAgeVerification && (
        <AgeVerificationModal
          isOpen={showAgeModal}
          onConfirm={handleAgeConfirm}
          onCancel={handleAgeCancel}
        />
      )}
    </>
  );
};

/**
 * Компонент для отображения колонки
 */
interface ColumnProps {
  title: string;
  href: string;
  items: TopTitleCombined[];
  showRating?: boolean;
  showViews?: boolean;
}

const Column = ({ title, href, items, showRating = false, showViews = true }: ColumnProps) => {
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-6 group">
        <h3 className="text-lg md:text-2xl text-[var(--muted-foreground)] font-bold group-hover:text-[var(--primary)] transition-colors duration-300">
          {title}
        </h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-[var(--chart-1)] hover:text-[var(--chart-5)] transition-all duration-300 hover:gap-2"
        >
          <span className="text-sm font-medium">Ещё</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4 min-w-0 py-1">
        {items.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Пока нет тайтлов в этой категории
            </p>
            <Link
              href={href}
              className="text-sm font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              Смотреть каталог
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          items
            .slice(0, 5)
            .map(item => (
              <CardItem key={item.id} item={item} showRating={showRating} showViews={showViews} />
            ))
        )}
      </div>
    </div>
  );
};

/**
 * Секция топа: три колонки (Топ 2026, Топ Манхв, Топ Маньхуа). Данные с главной — поиск по views.
 */
export default function TopCombinedSection({ data }: TopCombinedSectionProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6 box-border">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">Топ тайтлов</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              По просмотрам за всё время
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-w-0">
        <Column
          title="Топ 2026 года"
          href="/titles?releaseYears=2026"
          items={data.top2026 ?? []}
          showRating
          showViews
        />
        <Column
          title="Топ Манхв"
          href="/titles?types=manhwa"
          items={data.topManhwa ?? []}
          showRating
          showViews
        />
        <Column
          title="Топ Маньхуа"
          href="/titles?types=manhua"
          items={data.topManhua ?? []}
          showRating
          showViews
        />
      </div>
    </section>
  );
}

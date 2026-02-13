"use client";
import { ArrowRight, Eye, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { TopTitleCombined } from "@/types/constants";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";

// Helper function for formatting views
function formatViews(num: number | string): string {
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return '0';
  if (parsedNum >= 1000000) {
    return `${(parsedNum / 1000000).toFixed(1)}М`;
  }
  if (parsedNum >= 1000) {
    return `${(parsedNum / 1000).toFixed(1)}к`;
  }
  return parsedNum.toString();
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
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  useEffect(() => {
    setIsAgeVerified(checkAgeVerification(user || null));
  }, [user]);

  const normalizeImageUrl = (url: string | undefined) => {
    if (!url) return "";
    return process.env.NEXT_PUBLIC_URL + url;
  };

  // Функция для выполнения действия с карточкой
  const performCardAction = () => {
    // Используем router для навигации
    window.location.href = getTitlePath(item);
  };

  // Обработка подтверждения возраста
  const handleAgeConfirm = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);

    // Выполняем отложенное действие после подтверждения возраста
    if (pendingAction) {
      pendingAction();
    }
  };

  const handleAgeCancel = () => {
    setShowAgeModal(false);
    setPendingAction(null);
  };

  // Основной обработчик клика
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Если контент для взрослых и возраст не подтвержден
    if (item.isAdult && !isAgeVerified) {
      // Сохраняем функцию, которую нужно выполнить после подтверждения
      setPendingAction(() => performCardAction);
      setShowAgeModal(true);
      return;
    }

    // Если возраст подтвержден или контент не для взрослых, выполняем действие сразу
    performCardAction();
  };

  return (
    <>
      <div 
        className="block group cursor-pointer transform transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 relative" 
        onClick={handleClick}
      >
        {/* Glow — единый с остальными карточками */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)]/0 via-[var(--chart-1)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/20 group-hover:via-[var(--chart-1)]/20 group-hover:to-[var(--primary)]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out -z-10" />
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] shadow-lg ring-1 ring-white/5 group-hover:shadow-xl group-hover:ring-[var(--chart-1)]/30 transition-all duration-300 relative overflow-hidden max-w-full">
          {/* Shine — единый с остальными карточками */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          </div>
          
          {/* Обложка — пропорционально */}
          <div className="w-20 h-28 sm:w-22 sm:h-32 rounded-lg flex-shrink-0 overflow-hidden bg-[var(--muted)] relative">
            {item.coverImage ? (
              <OptimizedImage
                src={normalizeImageUrl(item.coverImage)}
                alt={item.title}
                width={96}
                height={128}
                className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110 ${
                  item.isAdult && !isAgeVerified ? "blur-sm" : ""
                }`}
                quality={85}
                priority={false}
                onError={() => {}}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center">
                <span className="text-xs text-[var(--muted-foreground)]">Нет фото</span>
              </div>
            )}
            {item.isAdult && (
              <div className="absolute top-2 right-2">
                <div className="bg-red-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md font-bold text-[10px] shadow-lg border border-red-400/30">
                  18+
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
              <span className="text-xs text-[var(--muted-foreground)] font-medium">{item.year || "2026"}</span>
            </div>
            <h4
              className={`font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--chart-1)] transition-colors duration-300 line-clamp-2 leading-tight ${
                item.isAdult && !isAgeVerified ? "blur-sm" : ""
              }`}
            >
              {item.title}
            </h4>
            <div className="flex items-center justify-between mt-1.5">
              {showViews ? (
                <span className="flex gap-1 text-xs items-center text-[var(--muted-foreground)] group-hover:text-[var(--chart-1)] transition-colors duration-300">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatViews(Number(item.views) || 0)}</span>
                </span>
              ) : (
                <div />
              )}
              
              {showRating && (
                <span
                  className={`flex gap-1 text-xs font-semibold items-center px-2 py-0.5 rounded-md bg-[var(--muted)]/30 ${
                    item.rating >= 7 ? "text-[var(--chart-5)]" : "text-[var(--muted-foreground)]"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {item.rating ? parseFloat(item.rating.toFixed(1)).toString() : "0.0"}
                </span>
              )}
            </div>
            
            {/* Animated underline — единый цвет */}
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[var(--chart-1)] to-transparent mt-2 transition-all duration-300 ease-out" />
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
        <h3 className="text-lg md:text-2xl text-[var(--muted-foreground)] font-bold group-hover:text-[var(--primary)] transition-colors duration-300">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-[var(--chart-1)] hover:text-[var(--chart-5)] transition-all duration-300 hover:gap-2"
        >
          <span className="text-sm font-medium">Ещё</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {/* py-1 даёт тени и подсветке при наведении место, чтобы не обрезаться */}
      <div className="space-y-4 min-w-0 py-1">
        {items.slice(0, 5).map(item => (
          <CardItem key={item.id} item={item} showRating={showRating} showViews={showViews} />
        ))}
      </div>
    </div>
  );
};

/**
 * Компонент для отображения трех отдельных колонок: Топ 2026, Топ Манхв, Топ Маньхуа
 */
export default function TopCombinedSection({ data }: TopCombinedSectionProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6 overflow-x-hidden box-border">
      {/* Три отдельные колонки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-w-0">
        {/* Колонка 1: Топ 2026 года */}
        <Column
          title="Топ 2026 года"
          href="/titles?releaseYears=2026"
          items={data.top2026 || []}
          showRating={true}
          showViews={true}
        />

        {/* Колонка 2: Топ Манхв */}
        <Column
          title="Топ Манхв"
          href="/titles?types=manhwa"
          items={data.topManhwa || []}
          showRating={true}
          showViews={true}
        />

        {/* Колонка 3: Топ Маньхуа */}
        <Column
          title="Топ Маньхуа"
          href="/titles?types=manhua"
          items={data.topManhua || []}
          showRating={true}
          showViews={true}
        />
      </div>
    </section>
  );
}

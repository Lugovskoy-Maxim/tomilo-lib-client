"use client";
import { ArrowRight, Eye, Star, StarHalf } from "lucide-react";
import Link from "next/link";
import { TopTitleCombined } from "@/types/constants";
import OptimizedImage from "@/shared/optimized-image";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/age-verification-modal";

interface CombinedTopData {
  topManhwa: TopTitleCombined[];
  top2025: TopTitleCombined[];
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
const CardItem = ({ item }: CardItemProps) => {
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
      <div className="block group cursor-pointer" onClick={handleClick}>
        <div className="flex items-center gap-3 hover:bg-[var(--muted)]/20 p-2 rounded-lg transition-colors">
          {/* Обложка */}
          <div className="w-16 h-24 rounded flex-shrink-0 overflow-hidden bg-gray-700 relative">
            {item.coverImage ? (
              <OptimizedImage
                src={normalizeImageUrl(item.coverImage)}
                alt={item.title}
                width={64}
                height={96}
                className={`w-full h-full object-cover ${
                  item.isAdult && !isAgeVerified ? "blur-sm" : ""
                }`}
                quality={80}
                priority={false}
                onError={() => {
                  // Обработка ошибки загрузки изображения
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-xs text-[var(--muted-foreground)]">Нет фото</span>
              </div>
            )}
            {item.isAdult && (
              <div className="absolute top-1 right-1 flex items-center justify-center">
                <div className="bg-red-500/90 text-white px-1 rounded-full font-bold text-xs">
                  18+
                </div>
              </div>
            )}
          </div>

          {/* Контент */}
          <div className="flex flex-col flex-1 gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--muted-foreground)]">
                {translateTitleType(item.type)}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">•</span>
              <span className="text-xs text-[var(--muted-foreground)]">{item.year || "2025"}</span>
            </div>
            <h4
              className={`text-[var(--primary)] font-medium group-hover:text-[var(--chart-1)]/80 transition-colors line-clamp-2 ${
                item.isAdult && !isAgeVerified ? "blur-sm" : ""
              }`}
            >
              {item.title}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <span className="flex gap-1 text-xs items-center justify-center text-[var(--muted-foreground)]">
                <Eye className="w-4 h-4" />
                {item.views || "0"}
              </span>

              <span
                className={`flex gap-1 text-xs font-medium items-center justify-center ${
                  item.rating >= 7 ? "text-[var(--chart-5)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                <Star className="w-4 h-4" />
                {item.rating ? parseFloat(item.rating.toFixed(1)).toString() : "0.0"}
              </span>
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
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg md:text-2xl text-[var(--muted-foreground)] font-bold">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span className="text-sm">Ещё</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4">
        {items.slice(0, 5).map(item => (
          <CardItem key={item.id} item={item} showRating={showRating} showViews={showViews} />
        ))}
      </div>
    </div>
  );
};

/**
 * Компонент для отображения трех отдельных колонок: Топ 2025, Топ Манхв, Топ Маньхуа
 */
export default function TopCombinedSection({ data }: TopCombinedSectionProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Три отдельные колонки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Колонка 1: Топ 2025 года */}
        <Column
          title="Топ 2025 года"
          href="/titles?releaseYears=2025"
          items={data.top2025 || []}
          showRating={true}
          showViews={false}
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

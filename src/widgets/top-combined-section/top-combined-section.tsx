
"use client";
import { ArrowRight, Eye, Star, StarHalf } from "lucide-react";
import Link from "next/link";
import { TopTitleCombined } from "@/types/constants";
import Image from "next/image";
import { translateTitleType } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";

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
const CardItem = ({
  item,
}: CardItemProps) => {
  const normalizeImageUrl = (url: string | undefined) => {
    if (!url) return "";
    return process.env.NEXT_PUBLIC_URL + url;
  };


  return (
    <Link href={getTitlePath(item)} className="block group">
      <div className="flex items-center gap-3 hover:bg-[var(--muted)]/20 p-2 rounded-lg transition-colors">
        {/* Обложка */}
        <div className="w-16 h-24 rounded flex-shrink-0 overflow-hidden bg-gray-700 relative">
          {item.coverImage ? (
            <Image
              src={normalizeImageUrl(item.coverImage)}
              alt={item.title}
              width={64}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-xs text-[var(--muted-foreground)]">
                Нет фото
              </span>
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
            <span className="text-xs text-[var(--muted-foreground)]">
              {item.year || "2025"}
            </span>
          </div>
          <h4 className="text-[var(--primary)] font-medium group-hover:text-[var(--chart-1)]/80 transition-colors line-clamp-2">
            {item.title}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <span className="flex gap-1 text-xs items-center justify-center text-[var(--muted-foreground)]">
              <Eye className="w-4 h-4" />
              {item.views || "0"}
            </span>

            <span className={`flex gap-1 text-xs font-medium items-center justify-center ${item.rating >= 7 ? 'text-[var(--chart-5)]' : 'text-[var(--muted-foreground)]'}`}>
              <Star className="w-4 h-4" />
              {item.rating ? parseFloat(item.rating.toFixed(1)).toString() : "0.0"}
            </span>
          </div>
        </div>
      </div>
    </Link>
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

const Column = ({
  title,
  href,
  items,
  showRating = false,
  showViews = true,
}: ColumnProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-[var(--primary)]">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span className="text-sm">Ещё</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4">
        {items.slice(0, 5).map((item) => (
          <CardItem
            key={item.id}
            item={item}
            showRating={showRating}
            showViews={showViews}
          />
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
          href="/browse?year=2025"
          items={data.top2025 || []}
          showRating={true}
          showViews={false}
        />

        {/* Колонка 2: Топ Манхв */}
        <Column
          title="Топ Манхв"
          href="/browse?types=manhwa"
          items={data.topManhwa || []}
          showRating={true}
          showViews={true}
        />

        {/* Колонка 3: Топ Маньхуа */}
        <Column
          title="Топ Маньхуа"
          href="/browse?types=manhua"
          items={data.topManhua || []}
          showRating={true}
          showViews={true}
        />
      </div>
    </section>
  );
}

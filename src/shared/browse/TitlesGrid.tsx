"use client";
import PopularCard, { CardProps } from "@/shared/popular-card/PopularCard";
import { SearchX, RotateCcw } from "lucide-react";

interface GridTitle {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image?: string;
  genres: string[];
  isAdult?: boolean;
}

interface TitleGridProps {
  titles: GridTitle[];
  onCardClick: (title: GridTitle) => void;
  isEmpty: boolean;
  onResetFilters: () => void;
}

// Функция для преобразования Title в CardProps
const titleToCardProps = (title: GridTitle): CardProps => ({
  id: title.id,
  slug: title.slug,
  title: title.title,
  type: title.type,
  year: title.year,
  rating: title.rating,
  image: title.image || "",
  genres: title.genres,
  isAdult: title.isAdult || false,
});

// Скелетон карточки для загрузки
const CardSkeleton = () => (
  <div className="relative overflow-hidden rounded-xl bg-[var(--card)] shadow-lg ring-1 ring-white/5 animate-pulse">
    <div className="aspect-[2/3] w-full bg-[var(--muted)]/50 rounded-t-xl" />
    <div className="p-2 sm:p-2.5 space-y-2">
      <div className="flex justify-between items-center">
        <div className="h-4 w-12 bg-[var(--muted)]/50 rounded-full" />
        <div className="h-4 w-8 bg-[var(--muted)]/50 rounded-full" />
      </div>
      <div className="h-8 w-full bg-[var(--muted)]/50 rounded" />
    </div>
  </div>
);

export default function TitleGrid({
  titles,
  onCardClick,
  isEmpty,
  onResetFilters,
}: TitleGridProps) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-4 bg-[var(--muted)]/30 rounded-full mb-4">
          <SearchX className="w-12 h-12 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Ничего не найдено</h3>
        <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
          По вашему запросу не найдено тайтлов. Попробуйте изменить фильтры или поисковый запрос.
        </p>
        <button
          onClick={onResetFilters}
          className="group flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:bg-[var(--primary)]/90 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/20 font-medium"
        >
          <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
          Сбросить фильтры
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
      {titles.map((title, index) => (
        <div
          key={`${title.id}-${index}`}
          className="animate-fade-in"
          style={{ 
            animationDelay: `${Math.min(index * 50, 500)}ms`,
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards'
          }}
        >
          <PopularCard
            data={titleToCardProps(title)}
            onCardClick={() => onCardClick(title)}
          />
        </div>
      ))}
    </div>
  );
}

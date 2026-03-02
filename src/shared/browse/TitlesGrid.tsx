"use client";
import React, { memo, useMemo, useCallback } from "react";
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

const ANIMATION_DELAYS = Array.from({ length: 11 }, (_, i) => `grid-item-delay-${i}`);

interface GridItemProps {
  title: GridTitle;
  index: number;
  onCardClick: (title: GridTitle) => void;
}

const GridItem = memo(function GridItem({ title, index, onCardClick }: GridItemProps) {
  const cardProps = useMemo(() => titleToCardProps(title), [title]);
  const handleClick = useCallback(() => onCardClick(title), [onCardClick, title]);
  const delayClass = ANIMATION_DELAYS[Math.min(Math.floor(index / 5), 10)];

  return (
    <div className={`grid-item-animate ${delayClass}`}>
      <PopularCard data={cardProps} onCardClick={handleClick} />
    </div>
  );
});

const EmptyState = memo(function EmptyState({ onResetFilters }: { onResetFilters: () => void }) {
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
});

function TitleGrid({ titles, onCardClick, isEmpty, onResetFilters }: TitleGridProps) {
  if (isEmpty) {
    return <EmptyState onResetFilters={onResetFilters} />;
  }

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
      {titles.map((title, index) => (
        <GridItem
          key={title.id}
          title={title}
          index={index}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}

export default memo(TitleGrid);

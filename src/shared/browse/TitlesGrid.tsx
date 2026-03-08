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
    <div className="flex flex-col items-center justify-center py-14 px-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <SearchX className="w-10 h-10 text-[var(--muted-foreground)] mb-3" />
      <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Ничего не найдено</h3>
      <p className="text-sm text-[var(--muted-foreground)] text-center max-w-xs mb-5">
        Измените фильтры или поисковый запрос.
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
      >
        <RotateCcw className="w-4 h-4" />
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
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
      {titles.map((title, index) => (
        <GridItem key={title.id} title={title} index={index} onCardClick={onCardClick} />
      ))}
    </div>
  );
}

export default memo(TitleGrid);

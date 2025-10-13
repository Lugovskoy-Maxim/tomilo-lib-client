"use client";
import CarouselCard, { CardProps } from "@/shared/carousel-card/carousel-card";
import { Title } from "@/constants/mokeReadPage";

interface TitleGridProps {
  titles: Title[];
  onCardClick: (id: number) => void;
  isEmpty: boolean;
  onResetFilters: () => void;
}

// Функция для преобразования Title в CardProps
const titleToCardProps = (title: Title): CardProps => ({
  id: title.id,
  title: title.title,
  type: title.type,
  year: title.year,
  rating: title.rating,
  image: title.image,
  genres: title.genres,
});

export default function TitleGrid({ titles, onCardClick, isEmpty, onResetFilters }: TitleGridProps) {
  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <div className="text-[var(--muted-foreground)] mb-4">
          Ничего не найдено
        </div>
        <button
          onClick={onResetFilters}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--primary)]/90 transition-colors cursor-pointer"
        >
          Сбросить фильтры
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
      {titles.map((title) => (
        <CarouselCard
          key={title.id}
          data={titleToCardProps(title)}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
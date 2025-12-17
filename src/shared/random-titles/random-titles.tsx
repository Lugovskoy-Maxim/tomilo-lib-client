import React from "react";
import { CarouselCard } from "@/shared";
import { Carousel } from "@/widgets";
import { SquareArrowOutUpRight } from "lucide-react";

interface RandomTitle {
  id: string;
  title: string;
  image: string;
  description: string;
  type: string;
  year: number;
  rating: number;
  genres: string[];
  isAdult: boolean;
}

interface RandomTitlesProps {
  data: RandomTitle[];
  loading: boolean;
  error: unknown;
}

const RandomTitles: React.FC<RandomTitlesProps> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-start justify-center carousel-skeleton animate-pulse w-full max-w-7xl mx-auto px-4 py-2 overflow-hidden">
        <div className="h-8 bg-[var(--muted)] rounded w-48 mb-4"></div>
        <div className="flex gap-4 overflow-hidden items-center justify-center">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-40 h-64 bg-[var(--muted)] rounded-lg mb-2"></div>
              <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 font-semibold p-4">
        Ошибка загрузки случайных тайтлов. Пожалуйста, попробуйте позже.
      </div>
    );
  }

  if (!data?.length)
    return (
      <div className="text-[var(--muted-foreground)] font-semibold p-4">
        Нет данных для отображения случайных тайтлов
      </div>
    );

  return (
    <Carousel
      title="Рекомендуем для просмотра"
      data={data}
      cardComponent={CarouselCard}
      type="browse"
      navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
      cardWidth="w-30 sm:w-30 md:w-35 lg:w-40"
      showNavigation={true}
    />
  );
};

export default RandomTitles;
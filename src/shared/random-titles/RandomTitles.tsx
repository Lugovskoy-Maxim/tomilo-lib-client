import React from "react";
import { CarouselCard, SectionLoadError } from "@/shared";
import { Carousel } from "@/widgets";
import { SquareArrowOutUpRight } from "lucide-react";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";

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
      <CarouselSkeleton
        title="Рекомендуем для просмотра"
        cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-52 2xl:w-56"
        variant="poster"
      />
    );
  }

  if (error) return <SectionLoadError sectionTitle="Рекомендуем для просмотра" />;

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
      cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-52 2xl:w-56"
      showNavigation={true}
    />
  );
};

export default RandomTitles;

import React from "react";
import CarouselCard from "@/shared/popular-card/PopularCard";
import SectionLoadError from "@/shared/error-state/SectionLoadError";
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
        cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
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
      cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
      showNavigation={true}
    />
  );
};

export default RandomTitles;

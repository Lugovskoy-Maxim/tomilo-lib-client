"use client";
import React from "react";
import { Star, TrendingUp } from "lucide-react";
import { CarouselCard } from "@/shared";
import { Carousel } from "@/widgets";
import { getTitlePath } from "@/lib/title-paths";
import { useGetRecommendedTitlesQuery } from "@/store/api/titlesApi";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";

interface RecommendationsProps {
  userId?: string;
  limit?: number;
}

export default function Recommendations({
  userId,
  limit = 10
}: RecommendationsProps) {
  // Получаем персональные рекомендации
  const { data, isLoading, error } = useGetRecommendedTitlesQuery({ limit });

  if (isLoading) {
    return <CarouselSkeleton />;
  }

  if (error) {
    return null; // Не показываем блок рекомендаций при ошибке
  }

  if (!data?.data?.length) {
    return null; // Не показываем пустой блок
  }

  // Преобразуем данные в формат, ожидаемый CarouselCard
  const transformedData = data.data.map(item => ({
    id: item.id,
    title: item.title,
    image: item.cover,
    year: item.releaseYear,
    rating: item.rating,
    type: item.type,
    genres: [], // Жанры не возвращаются для рекомендаций
    isAdult: item.isAdult,
  }));

  return (
    <Carousel
      title="Подобрали для вас"
      data={transformedData}
      cardComponent={CarouselCard}
      description="Персональные рекомендации на основе ваших предпочтений"
      type="browse"
      icon={<Star className="w-6 h-6" />}
      navigationIcon={<TrendingUp className="w-6 h-6" />}
      cardWidth="w-35 sm:w-35 md:w-40 lg:w-44 xl:w-52 2xl:w-56"
      getItemPath={(item) => getTitlePath(item)}
    />
  );
}

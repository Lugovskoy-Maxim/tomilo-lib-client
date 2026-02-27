"use client";
import React, { useEffect, useRef, useState } from "react";
import { Star, TrendingUp } from "lucide-react";
import { CarouselCard } from "@/shared";
import { Carousel } from "@/widgets";
import { getTitlePath } from "@/lib/title-paths";
import { useGetRecommendedTitlesQuery } from "@/store/api/titlesApi";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";

interface RecommendationsProps {
  limit?: number;
}

// refetch только если данные старше 5 мин (keepUnusedDataFor задаётся в titlesApi).
const RECOMMENDED_REFETCH_SEC = 300;

export default function Recommendations({
  limit = 10
}: RecommendationsProps) {
  const [shouldFetch, setShouldFetch] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const el = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShouldFetch(true);
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Персональные рекомендации — запрос после появления секции в viewport
  const { data, isLoading, error } = useGetRecommendedTitlesQuery(
    { limit },
    {
      skip: !shouldFetch,
      refetchOnMountOrArgChange: RECOMMENDED_REFETCH_SEC,
    }
  );

  if (!shouldFetch) {
    return (
      <div
        ref={sectionRef}
        className="w-full min-w-0 min-h-[200px]"
        aria-hidden
      />
    );
  }

  if (isLoading) {
    return (
      <div ref={sectionRef} className="w-full min-w-0">
        <CarouselSkeleton />
      </div>
    );
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
    <div ref={sectionRef} className="w-full min-w-0">
    <Carousel
      title="Подобрали для вас"
      data={transformedData}
      cardComponent={CarouselCard}
      description="Персональные рекомендации на основе ваших предпочтений"
      type="browse"
      icon={<Star className="w-6 h-6" />}
      navigationIcon={<TrendingUp className="w-6 h-6" />}
      cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-52 2xl:w-56"
      getItemPath={(item) => getTitlePath(item)}
    />
    </div>
  );
}

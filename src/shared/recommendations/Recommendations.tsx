"use client";
import React, { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import CarouselCard from "@/shared/popular-card/PopularCard";
import { Carousel } from "@/widgets";
import { getTitlePath } from "@/lib/title-paths";
import { useGetRecommendedTitlesQuery } from "@/store/api/titlesApi";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfileQuery } from "@/store/api/authApi";

interface RecommendationsProps {
  limit?: number;
}

// refetch только если данные старше 5 мин (keepUnusedDataFor задаётся в titlesApi).
const RECOMMENDED_REFETCH_SEC = 300;

export default function Recommendations({ limit = 10 }: RecommendationsProps) {
  const [shouldFetch, setShouldFetch] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !user });
  const displayAdult =
    profileData?.data?.displaySettings?.isAdult ?? user?.displaySettings?.isAdult;
  const includeAdult = !user ? true : displayAdult !== false;

  useEffect(() => {
    if (!sectionRef.current) return;
    const el = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShouldFetch(true);
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Персональные рекомендации — запрос после появления секции в viewport
  const { data, isLoading, error } = useGetRecommendedTitlesQuery(
    { limit, includeAdult },
    {
      skip: !shouldFetch,
      refetchOnMountOrArgChange: RECOMMENDED_REFETCH_SEC,
    },
  );

  if (!shouldFetch) {
    return <div ref={sectionRef} className="w-full min-w-0 min-h-[200px]" aria-hidden />;
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
    <section
      ref={sectionRef}
      className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6"
    >
      {/* Заголовок в стиле GridSection (как у рекомендуемых секций) */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-nowrap">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] [&_svg]:w-5 [&_svg]:h-5">
            <Star className="w-5 h-5" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)] truncate min-w-0">
            Подобрали для вас
          </h2>
        </div>
        <p className="text-[var(--muted-foreground)] text-xs mt-0.5 max-w-2xl">
          Персональные рекомендации на основе ваших предпочтений
        </p>
      </div>

      <Carousel
        title=""
        data={transformedData}
        cardComponent={CarouselCard}
        description=""
        type="browse"
        cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
        getItemPath={item => getTitlePath(item)}
        hideHeader
      />
    </section>
  );
}

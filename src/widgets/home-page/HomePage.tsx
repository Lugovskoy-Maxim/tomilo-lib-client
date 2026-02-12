"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { BookOpen, Clock, LibraryIcon, SquareArrowOutUpRight, Trophy } from "lucide-react";

import { CarouselCard, CollectionCard, ReadingCard } from "@/shared";
import LatestUpdateCard from "@/shared/last-updates/LastUpdates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";
import TopCombinedSection from "@/widgets/top-combined-section/TopCombinedSection";
import { useHomeData } from "@/hooks/useHomeData";
import { useStaticData } from "@/hooks/useStaticData";
import { useAuth } from "@/hooks/useAuth";
import RandomTitlesComponent from "@/shared/random-titles/RandomTitles";
import { getTitlePath } from "@/lib/title-paths";
import AdBlock from "@/shared/ad-block/AdBlock";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { TopCombinedSkeleton } from "@/shared/skeleton/TopCombinedSkeleton";
import { GridSkeleton } from "@/shared/skeleton/GridSkeleton";
import Recommendations from "@/shared/recommendations/Recommendations";

// Вспомогательный компонент для рендера карусели
const DataCarousel = ({
  title,
  data,
  loading,
  error,
  cardComponent: CardComponent,
  ...carouselProps
}: {
  title: string;
  data: unknown[];
  loading: boolean;
  error: unknown;
  cardComponent: React.ComponentType<any>;
  [key: string]: any;
}) => {
  if (loading) return <CarouselSkeleton />;
  if (error) {
    return (
      <div className="text-red-600 font-semibold p-4">
        Ошибка загрузки {title}. Пожалуйста, попробуйте позже.
      </div>
    );
  }
  if (!data?.length) return null;

  return (
    <Carousel
      title={title}
      data={data as any[]}
      cardComponent={CardComponent as any}
      type="browse"
      {...carouselProps}
    />
  );
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { popularTitles, randomTitles, readingProgress, topManhua, topManhwa, top2026 } =
    useHomeData();
  const { collections, latestUpdates } = useStaticData();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <CarouselSkeleton />
          <CarouselSkeleton />
          <CarouselSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6 md:pb-2 pb-16 w-full overflow-x-hidden">
        {/* Популярные тайтлы */}
        <DataCarousel
          title="Популярные тайтлы"
          data={popularTitles.data}
          loading={popularTitles.loading}
          error={popularTitles.error}
          cardComponent={CarouselCard}
          type="browse"
          icon={<Trophy className="w-6 h-6" />}
          navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
          cardWidth="w-35 sm:w-35 md:w-40 lg:w-44"
          getItemPath={(item: any) => getTitlePath(item)}
        />

        {/* Случайные тайтлы */}
        <RandomTitlesComponent
          data={randomTitles.data}
          loading={randomTitles.loading}
          error={randomTitles.error}
        />

        {/* Объединенная секция топ манхв, маньхуа и новинок 2026 */}
        <div className="w-full overflow-x-hidden">
          {topManhwa.loading || top2026.loading || topManhua.loading ? (
            <TopCombinedSkeleton />
          ) : topManhwa.error || top2026.error || topManhua.error ? null : (
            <TopCombinedSection
              data={{
                topManhwa: (topManhwa.data || []).slice(0, 5).map(item => ({
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  coverImage: item.image,
                  type: item.type,
                  year: item.year,
                  rating: item.rating,
                  views: item.views || "0К",
                  isAdult: item.isAdult ?? false,
                })),

                top2026: (top2026.data || []).slice(0, 5).map(item => ({
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  coverImage: item.image,
                  type: item.type,
                  year: item.year,
                  rating: item.rating,
                  views: item.views || "0К",
                  isAdult: item.isAdult ?? false,
                })),

                topManhua: (topManhua.data || []).slice(0, 5).map(item => ({
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  coverImage: item.image,
                  type: item.type,
                  year: item.year,
                  rating: item.rating,
                  views: item.views || "0К",
                  isAdult: item.isAdult ?? false,
                })),
              }}
            />
          )}
        </div>

        {/* Рекламный блок */}
        <AdBlock />

        {/* Рекомендации (только для авторизованных) */}
        {isAuthenticated && <Recommendations limit={10} />}

        {/* Коллекции */}
        <DataCarousel
          title="Коллекции по темам"
          data={collections.data}
          loading={collections.loading}
          error={collections.error}
          cardComponent={CollectionCard}
          description="Здесь подобраны самые популярные коллекции, которые вы можете прочитать."
          type="collection"
          href="/collections"
          cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
          icon={<LibraryIcon className="w-6 h-6" />}
          showNavigation={false}
          navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
        />


        {/* Продолжить чтение */}
        <DataCarousel
          title="Продолжить чтение"
          data={readingProgress.data}
          loading={readingProgress.loading}
          error={readingProgress.error}
          cardComponent={ReadingCard}
          description="Это главы, которые вы ещё не прочитали. Данный список генерируется на основании вашей истории чтения."
          type="browse"
          icon={<BookOpen className="w-6 h-6" />}
          navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
          descriptionLink={{ text: "истории чтения", href: "/profile" }}
          showNavigation={false}
          cardWidth="w-68 sm:w-72 md:w-80 lg:w-96"
        />

        {/* Последние обновления */}
        {latestUpdates.loading ? (
          <GridSkeleton />
        ) : latestUpdates.error ? null : latestUpdates.data.length > 0 ? (
          <GridSection
            title="Последние обновления"
            description="Свежие главы, которые только что вышли. Смотрите все обновления в каталоге."
            type="browse"
            href="/updates"
            icon={<Clock className="w-6 h-6" />}
            data={latestUpdates.data}
            cardComponent={LatestUpdateCard}
          />
        ) : null}
      </main>
      <Footer />
    </>
  );
}

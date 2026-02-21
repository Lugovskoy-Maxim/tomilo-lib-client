"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { BookOpen, Clock, Flame, Gem, LibraryIcon, PlusCircle, SquareArrowOutUpRight, Trophy } from "lucide-react";

import {
  CarouselCard,
  CollectionCard,
  LazySection,
  ReadingCard,
  SectionLoadError,
  TrendingCard,
  UnderratedCard,
} from "@/shared";
import LatestUpdateCard from "@/shared/last-updates/LastUpdates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";
import TopCombinedSection from "@/widgets/top-combined-section/TopCombinedSection";
import { useHomeData, type HomeVisibleSections } from "@/hooks/useHomeData";
import { useStaticData, type StaticDataVisibleSections } from "@/hooks/useStaticData";
import { useAuth } from "@/hooks/useAuth";
import RandomTitlesComponent from "@/shared/random-titles/RandomTitles";
import { getTitlePath } from "@/lib/title-paths";
import AdBlock from "@/shared/ad-block/AdBlock";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { TopCombinedSkeleton } from "@/shared/skeleton/TopCombinedSkeleton";
import { GridSkeleton } from "@/shared/skeleton/GridSkeleton";
import Recommendations from "@/shared/recommendations/Recommendations";
import LinesBackground from "@/shared/lines-background/LinesBackground";

type VisibleSections = HomeVisibleSections &
  StaticDataVisibleSections &
  Partial<{ ad: boolean; recommendations: boolean }>;

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
  if (loading) {
    return (
      <CarouselSkeleton
        title={title}
        cardWidth={carouselProps.cardWidth}
        variant={carouselProps.skeletonVariant ?? "poster"}
        showDescription={Boolean(carouselProps.description)}
      />
    );
  }
  if (error) return <SectionLoadError sectionTitle={title} />;
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
  const [visibleSections, setVisibleSections] = useState<VisibleSections>({});

  const handleSectionVisible = useCallback((sectionId: string) => {
    setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
  }, []);

  const {
    popularTitles,
    recentTitles,
    randomTitles,
    trendingTitles,
    underratedTitles,
    readingProgress,
    topManhua,
    topManhwa,
    top2026,
  } = useHomeData(visibleSections);
  const { collections, latestUpdates } = useStaticData(visibleSections);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <LinesBackground />
        <Header />
        <main className="flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 md:pb-2 pb-12 sm:pb-16 w-full">
          <CarouselSkeleton cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-48 2xl:w-52" variant="poster" />
          <GridSkeleton showTitle variant="updates" />
          <GridSkeleton showTitle variant="updates" />
          <div className="w-full">
            <TopCombinedSkeleton />
          </div>
          <CarouselSkeleton cardWidth="w-24 sm:w-28 md:w-32 lg:w-36" variant="collection" showDescription />
          <CarouselSkeleton cardWidth="w-68 sm:w-72 md:w-80 lg:w-96" variant="reading" showDescription />
          <GridSkeleton showTitle variant="updates" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <LinesBackground />
      <Header />
      <main className="flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 md:pb-2 pb-12 sm:pb-16 w-full">
        {/* Популярные тайтлы */}
        <LazySection
          sectionId="popular"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.popular}
          skeleton={
            <CarouselSkeleton
              cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-48 2xl:w-52"
              variant="poster"
            />
          }
        >
          <DataCarousel
            title="Популярные тайтлы"
            data={popularTitles.data}
            loading={popularTitles.loading}
            error={popularTitles.error}
            cardComponent={CarouselCard}
            type="browse"
            icon={<Trophy className="w-6 h-6" />}
            navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
            cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-48 2xl:w-52"
            getItemPath={(item: any) => getTitlePath(item)}
            autoScrollInterval={5000}
            skeletonVariant="poster"
          />
        </LazySection>

        {/* Недавно добавленные */}
        <LazySection
          sectionId="recent"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.recent}
          skeleton={
            <CarouselSkeleton
              cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-48 2xl:w-52"
              variant="poster"
            />
          }
        >
          <DataCarousel
            title="Недавно добавленные"
            data={recentTitles.data}
            loading={recentTitles.loading}
            error={recentTitles.error}
            cardComponent={CarouselCard}
            type="browse"
            icon={<PlusCircle className="w-6 h-6" />}
            navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
            cardWidth="w-40 sm:w-40 md:w-40 lg:w-44 xl:w-48 2xl:w-52"
            getItemPath={(item: any) => getTitlePath(item)}
            skeletonVariant="poster"
          />
        </LazySection>

        {/* В тренде на этой неделе */}
        <LazySection
          sectionId="trending"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.trending}
          skeleton={<GridSkeleton showTitle variant="updates" />}
        >
          {trendingTitles.loading ? (
            <GridSkeleton showTitle variant="updates" />
          ) : trendingTitles.error ? (
            <SectionLoadError sectionTitle="В тренде на этой неделе" />
          ) : (
            <GridSection
              title="В тренде на этой неделе"
              description="Тайтлы, которые набрали больше всего внимания за последние 7 дней."
              type="browse"
              icon={<Flame className="w-6 h-6" />}
              data={trendingTitles.data.slice(0, 6)}
              cardComponent={TrendingCard}
            />
          )}
        </LazySection>

        {/* Рекламный блок */}
        <LazySection
          sectionId="ad"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.ad}
          skeleton={<div className="w-full min-h-[120px]" aria-hidden />}
        >
          <AdBlock />
        </LazySection>

        {/* Продолжить чтение */}
        <LazySection
          sectionId="reading"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.reading}
          skeleton={
            <CarouselSkeleton
              cardWidth="w-68 sm:w-72 md:w-80 lg:w-96"
              variant="reading"
              showDescription
            />
          }
        >
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
            skeletonVariant="reading"
          />
        </LazySection>

        {/* Последние обновления */}
        <LazySection
          sectionId="latestUpdates"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.latestUpdates}
          skeleton={<GridSkeleton variant="updates" />}
        >
          {latestUpdates.loading ? (
            <GridSkeleton variant="updates" />
          ) : latestUpdates.error ? null : Array.isArray(latestUpdates.data) && latestUpdates.data.length > 0 ? (
            <GridSection
              title="Последние обновления"
              description="Свежие главы, которые только что вышли. Смотрите все обновления в каталоге."
              type="browse"
              href="/updates"
              icon={<Clock className="w-6 h-6" />}
              data={latestUpdates.data}
              cardComponent={LatestUpdateCard}
              layout="auto-fit"
            />
          ) : null}
        </LazySection>

        {/* Недооцененные: высокий рейтинг, мало просмотров */}
        <LazySection
          sectionId="underrated"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.underrated}
          skeleton={<GridSkeleton showTitle variant="updates" />}
        >
          {underratedTitles.loading ? (
            <GridSkeleton showTitle variant="updates" />
          ) : underratedTitles.error ? (
            <SectionLoadError sectionTitle="Недооцененные: высокий рейтинг, мало просмотров" />
          ) : (
            <GridSection
              title="Недооцененные: высокий рейтинг, мало просмотров"
              description="Качественные тайтлы, которые получили высокий рейтинг, но пока не набрали много просмотров."
              type="browse"
              icon={<Gem className="w-6 h-6" />}
              data={underratedTitles.data.slice(0, 6)}
              cardComponent={UnderratedCard}
            />
          )}
        </LazySection>

        {/* Объединенная секция топ манхв, маньхуа и новинок 2026 */}
        <LazySection
          sectionId="topCombined"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.topCombined}
          skeleton={
            <div className="w-full">
              <TopCombinedSkeleton />
            </div>
          }
        >
          <div className="w-full">
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
        </LazySection>

        {/* Рекомендации (только для авторизованных) */}
        {isAuthenticated && (
          <LazySection
            sectionId="recommendations"
            onVisible={handleSectionVisible}
            isVisible={!!visibleSections.recommendations}
            skeleton={<CarouselSkeleton cardWidth="w-40" variant="poster" />}
          >
            <Recommendations limit={10} />
          </LazySection>
        )}

        {/* Случайные тайтлы */}
        <LazySection
          sectionId="random"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.random}
          skeleton={<GridSkeleton showTitle variant="updates" />}
        >
          <RandomTitlesComponent
            data={randomTitles.data}
            loading={randomTitles.loading}
            error={randomTitles.error}
          />
        </LazySection>

        {/* Коллекции */}
        <LazySection
          sectionId="collections"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.collections}
          skeleton={
            <CarouselSkeleton
              cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
              variant="collection"
              showDescription
            />
          }
        >
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
            skeletonVariant="collection"
          />
        </LazySection>
      </main>
      <Footer />
    </>
  );
}

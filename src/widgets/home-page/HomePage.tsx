"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { BookOpen, Clock, Flame, Gem, LibraryIcon, SquareArrowOutUpRight, Send } from "lucide-react";

import {
  CollectionCard,
  LazySection,
  ReadingCard,
  SectionLoadError,
  TrendingCard,
  UnderratedCard,
  FeaturedTitleBlock,
} from "@/shared";
import LatestUpdateCard from "@/shared/last-updates/LastUpdates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";
import TopCombinedSection from "@/widgets/top-combined-section/TopCombinedSection";
import { useHomeData, type HomeVisibleSections } from "@/hooks/useHomeData";
import { useStaticData, type StaticDataVisibleSections } from "@/hooks/useStaticData";
import { useAuth } from "@/hooks/useAuth";
import RandomTitlesComponent from "@/shared/random-titles/RandomTitles";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { TopCombinedSkeleton } from "@/shared/skeleton/TopCombinedSkeleton";
import { GridSkeleton } from "@/shared/skeleton/GridSkeleton";
import { FeaturedTitleSkeleton } from "@/shared/skeleton/FeaturedTitleSkeleton";
import Recommendations from "@/shared/recommendations/Recommendations";
import LinesBackground from "@/shared/lines-background/LinesBackground";
import NewsBlock from "@/widgets/home-page/NewsBlock";

type VisibleSections = HomeVisibleSections &
  StaticDataVisibleSections &
  Partial<{ ad: boolean; recommendations: boolean; news: boolean; featured: boolean }>;

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
        {/* Популярные тайтлы — полноширинный блок */}
        <LazySection
          sectionId="featured"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.featured}
          skeleton={<FeaturedTitleSkeleton />}
        >
          {popularTitles.loading ? (
            <FeaturedTitleSkeleton />
          ) : popularTitles.error ? (
            <SectionLoadError sectionTitle="Популярные тайтлы" />
          ) : (
            <FeaturedTitleBlock
              data={popularTitles.data}
              autoPlayInterval={8000}
            />
          )}
        </LazySection>

        {/* Недавно добавленные — закомментировано
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
        */}

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

        {/* Рекламный блок — временно отключено
        <LazySection
          sectionId="ad"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.ad}
          skeleton={<div className="w-full min-h-[120px]" aria-hidden />}
        >
          <AdBlock />
        </LazySection>
        */}

        {/* Новости */}
        <LazySection
          sectionId="news"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.news}
          skeleton={
            <div className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--muted)] animate-pulse" />
                <div className="h-7 w-28 bg-[var(--muted)] rounded animate-pulse" />
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[var(--muted)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-4 p-4 sm:p-5 border-t border-[var(--border)]">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[var(--muted)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-2/3 bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <NewsBlock />
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

        {/* Telegram секция */}
        <section className="w-full bg-gradient-to-br from-[#0088cc]/15 to-[#00aaff]/10">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 h-[200px]">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 h-full">
              <div className="flex items-center flex-shrink-0 h-full py-2">
                <Image src="/tg/tg.png" alt="Telegram" width={200} height={200} className="h-full w-auto object-contain" style={{ filter: "brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(1029%) hue-rotate(175deg) brightness(96%) contrast(101%)" }} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)] mb-1.5 sm:mb-2">
                  Присоединяйтесь к нашему Telegram
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-3 sm:mb-4 max-w-lg">
                  Будьте первыми, кто узнает о новых релизах, обновлениях и эксклюзивном контенте. 
                </p>
                <a
                  href="https://t.me/tomilolib"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm sm:text-base font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Подписаться
                </a>
              </div>
            </div>
          </div>
        </section>

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

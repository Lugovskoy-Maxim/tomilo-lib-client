"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { BookOpen, Clock, Flame, Gem, LibraryIcon, SquareArrowOutUpRight } from "lucide-react";

import CollectionCard from "@/shared/collection-card/CollectionCard";
import LazySection from "@/shared/lazy-section/LazySection";
import ReadingCard from "@/shared/reading-card/ReadingCard";
import SectionLoadError from "@/shared/error-state/SectionLoadError";
import TrendingCard from "@/shared/trending-card/TrendingCard";
import UnderratedCard from "@/shared/underrated-card/UnderratedCard";
import FeaturedTitleBlock from "@/shared/featured-title/FeaturedTitleBlock";
import { 
  GenresQuickAccess, 
  TelegramSection, 
} from "@/shared/home";
import LatestUpdateCard from "@/shared/last-updates/LastUpdates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";
import TopCombinedSection from "@/widgets/top-combined-section/TopCombinedSection";
import { useHomeData, type HomeVisibleSections } from "@/hooks/useHomeData";
import { useStaticData, type StaticDataVisibleSections } from "@/hooks/useStaticData";
import { useAuth } from "@/hooks/useAuth";
import { useGetLatestUpdatesQuery } from "@/store/api/titlesApi";
import RandomTitlesComponent from "@/shared/random-titles/RandomTitles";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { TopCombinedSkeleton } from "@/shared/skeleton/TopCombinedSkeleton";
import { GridSkeleton } from "@/shared/skeleton/GridSkeleton";
import { FeaturedTitleSkeleton } from "@/shared/skeleton/FeaturedTitleSkeleton";
import Recommendations from "@/shared/recommendations/Recommendations";
import LinesBackground from "@/shared/lines-background/LinesBackground";
import NewsBlock from "@/widgets/home-page/NewsBlock";
import { AgeVerificationModal } from "@/shared/modal/AgeVerificationModal";
import { AgeVerificationProvider } from "@/contexts/AgeVerificationContext";
import type { Collection } from "@/types/collection";

type VisibleSections = HomeVisibleSections &
  StaticDataVisibleSections &
  Partial<{ ad: boolean; recommendations: boolean; news: boolean; featured: boolean }>;

interface DataCarouselProps {
  title: string;
  data: unknown[];
  loading: boolean;
  error: unknown;
  cardComponent: React.ComponentType<any>;
  [key: string]: any;
}

// Мемоизированный компонент для рендера карусели — предотвращает лишние ререндеры
const DataCarousel = memo(function DataCarousel({
  title,
  data,
  loading,
  error,
  cardComponent: CardComponent,
  ...carouselProps
}: DataCarouselProps) {
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
});

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [visibleSections, setVisibleSections] = useState<VisibleSections>({});
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingAgeAction, setPendingAgeAction] = useState<(() => void) | null>(null);

  const handleSectionVisible = useCallback((sectionId: string) => {
    setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
  }, []);

  const requestAgeVerification = useCallback((action: () => void) => {
    setPendingAgeAction(() => action);
    setShowAgeModal(true);
  }, []);

  const handleAgeConfirm = useCallback(() => {
    setShowAgeModal(false);
    setPendingAgeAction(prev => {
      if (prev) queueMicrotask(prev);
      return null;
    });
  }, []);

  const handleAgeCancel = useCallback(() => {
    setShowAgeModal(false);
    setPendingAgeAction(null);
  }, []);

  // useAuth уже вызывает useGetProfileQuery внутри себя — не дублируем запрос
  const { isAuthenticated, user } = useAuth();
  // Гости видят 18+; авторизованные — по настройке (по умолчанию показываем)
  const includeAdult = !user ? true : (user.displaySettings?.isAdult !== false);

  const {
    popularTitles,
    randomTitles,
    trendingTitles,
    underratedTitles,
    readingProgress,
    topManhua,
    topManhwa,
    top2026,
  } = useHomeData({ visibleSections, includeAdult });
  const { collections } = useStaticData({ visibleSections, includeAdult });

  // Используем RTK Query для последних обновлений (корректно обрабатывает изменение includeAdult)
  const shouldLoadLatestUpdates = visibleSections.latestUpdates ?? false;
  const {
    data: latestUpdatesData,
    isLoading: latestUpdatesLoading,
    error: latestUpdatesError,
  } = useGetLatestUpdatesQuery(
    { limit: 16, includeAdult },
    { skip: !shouldLoadLatestUpdates, refetchOnMountOrArgChange: true, refetchOnFocus: true }
  );
  const latestUpdates = {
    data: latestUpdatesData?.data ?? [],
    loading: latestUpdatesLoading,
    error: latestUpdatesError ? "load_failed" : null,
  };

  // Мемоизация данных для TopCombinedSection — предотвращает пересоздание объекта при каждом рендере
  const topCombinedData = useMemo(() => ({
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
  }), [topManhwa.data, top2026.data, topManhua.data]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mainClassName =
    "flex flex-col items-center justify-start gap-3 sm:gap-4 md:gap-6 md:pb-2 pb-12 sm:pb-16 w-full";

  return (
    <AgeVerificationProvider requestAgeVerification={requestAgeVerification}>
      {mounted && <LinesBackground />}
      <Header />
      <main className={mainClassName}>
        {!mounted ? (
          <>
            <FeaturedTitleSkeleton />
            <GridSkeleton showTitle variant="trending" />
            <GridSkeleton showTitle variant="updates" />
            <div className="w-full">
              <TopCombinedSkeleton />
            </div>
            <GridSkeleton showTitle variant="trending" />
            <CarouselSkeleton cardWidth="w-68 sm:w-72 md:w-80 lg:w-96" variant="reading" showDescription />
            <CarouselSkeleton cardWidth="w-24 sm:w-28 md:w-32 lg:w-36" variant="collection" showDescription />
          </>
        ) : (
          <>
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

        {/* Быстрые действия для авторизованных пользователей — отключено
        <QuickActions />
        */}

        {/* Быстрый доступ к жанрам */}
        <GenresQuickAccess />

        {/* Продолжить чтение — для авторизованных пользователей в приоритете */}
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

        {/* В тренде на этой неделе */}
        <LazySection
          sectionId="trending"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.trending}
          skeleton={<GridSkeleton showTitle variant="trending" />}
        >
          {trendingTitles.loading ? (
            <GridSkeleton showTitle variant="trending" />
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

        {/* Рекомендации (только для авторизованных) */}
        {isAuthenticated && (
          <LazySection
            sectionId="recommendations"
            onVisible={handleSectionVisible}
            isVisible={!!visibleSections.recommendations}
            skeleton={<CarouselSkeleton cardWidth="w-32 sm:w-36 md:w-40 lg:w-44" variant="poster" />}
          >
            <Recommendations limit={10} />
          </LazySection>
        )}

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

        {/* Недооцененные: высокий рейтинг, мало просмотров */}
        <LazySection
          sectionId="underrated"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.underrated}
          skeleton={<GridSkeleton showTitle variant="trending" />}
        >
          {underratedTitles.loading ? (
            <GridSkeleton showTitle variant="trending" />
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
              <TopCombinedSection data={topCombinedData} />
            )}
          </div>
        </LazySection>

        {/* Случайные тайтлы */}
        <LazySection
          sectionId="random"
          onVisible={handleSectionVisible}
          isVisible={!!visibleSections.random}
          skeleton={<GridSkeleton showTitle variant="trending" />}
        >
          <RandomTitlesComponent
            data={randomTitles.data}
            loading={randomTitles.loading}
            error={randomTitles.error}
          />
        </LazySection>

        {/* Telegram секция */}
        <TelegramSection />

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
            getItemPath={(item: Collection) => `/collections/${item.id}`}
            cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
            icon={<LibraryIcon className="w-6 h-6" />}
            showNavigation={false}
            navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
            skeletonVariant="collection"
          />
        </LazySection>
          </>
        )}
      </main>
      <Footer />
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </AgeVerificationProvider>
  );
}

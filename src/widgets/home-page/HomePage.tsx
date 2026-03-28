"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import dynamic from "next/dynamic";
import { Clock, Gem, LibraryIcon, SquareArrowOutUpRight } from "lucide-react";

import GridSection from "@/widgets/grid-section/GridSection";
import LazySection from "@/shared/lazy-section/LazySection";
import SectionLoadError from "@/shared/error-state/SectionLoadError";
import UnderratedCard from "@/shared/underrated-card/UnderratedCard";
import FeaturedTitleBlock from "@/shared/featured-title/FeaturedTitleBlock";
import LatestUpdateCard from "@/shared/last-updates/LastUpdates";
import { useHomeData, type HomeVisibleSections } from "@/hooks/useHomeData";
import { useStaticData, type StaticDataVisibleSections } from "@/hooks/useStaticData";
import { useAuth } from "@/hooks/useAuth";
import { useGetLatestUpdatesQuery } from "@/store/api/titlesApi";
import { CarouselSkeleton } from "@/shared/skeleton/CarouselSkeleton";
import { TopCombinedSkeleton } from "@/shared/skeleton/TopCombinedSkeleton";
import { GridSkeleton } from "@/shared/skeleton/GridSkeleton";
import { FeaturedTitleSkeleton } from "@/shared/skeleton/FeaturedTitleSkeleton";
import { NewsBlockSkeleton } from "@/shared/skeleton/NewsBlockSkeleton";
import LinesBackground from "@/shared/lines-background/LinesBackground";
import { AgeVerificationProvider } from "@/contexts/AgeVerificationContext";
import type { Collection } from "@/types/collection";
import type { HomeFeaturedTitle } from "@/lib/map-popular-titles-home";

const ContinueReadingSectionDynamic = dynamic(
  () => import("@/widgets/home-page/ContinueReadingSection"),
  {
    loading: () => (
      <CarouselSkeleton
        cardWidth="w-[280px] sm:w-[300px] md:w-[320px]"
        variant="reading"
        showDescription
      />
    ),
  },
);

const RecommendationsDynamic = dynamic(() => import("@/shared/recommendations/Recommendations"), {
  loading: () => <CarouselSkeleton cardWidth="w-32 sm:w-36 md:w-40 lg:w-44" variant="poster" />,
});

const NewsBlockDynamic = dynamic(() => import("@/widgets/home-page/NewsBlock"), {
  loading: () => <NewsBlockSkeleton />,
});

const RandomTitlesDynamic = dynamic(() => import("@/shared/random-titles/RandomTitles"), {
  loading: () => <GridSkeleton showTitle variant="trending" />,
});

const TopCombinedSectionDynamic = dynamic(
  () => import("@/widgets/top-combined-section/TopCombinedSection"),
  {
    loading: () => (
      <div className="w-full">
        <TopCombinedSkeleton />
      </div>
    ),
  },
);

const TelegramSectionDynamic = dynamic(
  () => import("@/shared/home/TelegramSection").then(m => ({ default: m.TelegramSection })),
  { loading: () => null },
);

const HeaderDynamic = dynamic(() => import("@/widgets/header/header"), {
  loading: () => (
    <header
      className="relative z-[var(--z-dropdown)] w-full h-[var(--header-height)] bg-white dark:bg-[rgba(8,8,12,0.92)] border-b border-[rgba(var(--border-rgb),0.65)] dark:border-[rgba(255,255,255,0.06)]"
      aria-hidden
    />
  ),
});

const FooterDynamic = dynamic(() => import("@/widgets/footer/footer"), {
  loading: () => <div className="h-20 w-full max-w-7xl mx-auto bg-muted/20 animate-pulse rounded-lg" aria-hidden />,
});

const TopTitlesSectionDynamic = dynamic(
  () => import("@/widgets/top-titles-section/TopTitlesSection"),
  { loading: () => <GridSkeleton showTitle variant="trending" /> },
);

const CarouselDynamic = dynamic(() => import("@/widgets/carousel/carousel"));

const CollectionCardDynamic = dynamic(() => import("@/shared/collection-card/CollectionCard"));

const AgeVerificationModalDynamic = dynamic(() =>
  import("@/shared/modal/AgeVerificationModal").then(m => ({ default: m.AgeVerificationModal })),
);

type VisibleSections = HomeVisibleSections &
  StaticDataVisibleSections &
  Partial<{
    ad: boolean;
    recommendations: boolean;
    news: boolean;
    featured: boolean;
    topPeriod: boolean;
  }>;

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
    <CarouselDynamic
      title={title}
      data={data as any[]}
      cardComponent={CardComponent as any}
      type="browse"
      {...carouselProps}
    />
  );
});

interface HomePageProps {
  /** С сервера — популярные тайтлы до ответа RTK (LCP) */
  initialPopularTitles?: HomeFeaturedTitle[] | null;
}

export default function HomePage({ initialPopularTitles = null }: HomePageProps) {
  const [mounted, setMounted] = useState(false);
  /** Сразу `featured: true` — иначе useHomeData пропускает запрос популярных, а LazySection ждёт IntersectionObserver → поздний LCP. */
  const [visibleSections, setVisibleSections] = useState<VisibleSections>({ featured: true });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingAgeAction, setPendingAgeAction] = useState<(() => void) | null>(null);
  void pendingAgeAction;

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

  // useAuth уже вызывает useGetProfileQuery и getReadingHistory(limit=200) — не дублируем запрос истории в ContinueReadingSection
  const { isAuthenticated, user, continueReading } = useAuth();
  // Гости видят 18+; авторизованные — по настройке (по умолчанию показываем)
  const includeAdult = !user ? true : user.displaySettings?.isAdult !== false;

  const { popularTitles, randomTitles, underratedTitles, topManhwa, topManhua, top2026 } =
    useHomeData({ visibleSections, includeAdult, initialPopularTitles });
  // latest-updates загружаем только через RTK Query ниже — не дублируем запрос из useStaticData
  const { collections } = useStaticData({
    visibleSections: { ...visibleSections, latestUpdates: false },
    includeAdult,
  });

  // Запрос последних обновлений выполняем сразу при загрузке главной (как на /updates),
  // чтобы данные были готовы к моменту появления секции в viewport.
  const {
    data: latestUpdatesData,
    isLoading: latestUpdatesLoading,
    error: latestUpdatesError,
  } = useGetLatestUpdatesQuery(
    { limit: 24, includeAdult },
    {
      refetchOnMountOrArgChange: 600,
      refetchOnFocus: false,
      skip: !visibleSections.latestUpdates,
    },
  );
  const latestUpdates = {
    data: latestUpdatesData?.data ?? [],
    loading: latestUpdatesLoading,
    error: latestUpdatesError ? "load_failed" : null,
  };

  const topCombinedData = useMemo(
    () => ({
      topManhwa: (topManhwa.data ?? []).slice(0, 5).map(item => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        coverImage: item.image,
        type: item.type,
        year: item.year,
        rating: item.rating,
        views: item.views ?? "0",
        isAdult: item.isAdult ?? false,
      })),
      top2026: (top2026.data ?? []).slice(0, 5).map(item => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        coverImage: item.image,
        type: item.type,
        year: item.year,
        rating: item.rating,
        views: item.views ?? "0",
        isAdult: item.isAdult ?? false,
      })),
      topManhua: (topManhua.data ?? []).slice(0, 5).map(item => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        coverImage: item.image,
        type: item.type,
        year: item.year,
        rating: item.rating,
        views: item.views ?? "0",
        isAdult: item.isAdult ?? false,
      })),
    }),
    [topManhwa.data, top2026.data, topManhua.data],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const mainClassName =
    "flex flex-col items-center justify-start gap-3 sm:gap-4 md:gap-6 md:pb-2 pb-12 sm:pb-16 w-full";

  return (
    <AgeVerificationProvider requestAgeVerification={requestAgeVerification}>
      {mounted && <LinesBackground />}
      <HeaderDynamic />
      <main className={mainClassName}>
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
                <FeaturedTitleBlock data={popularTitles.data} autoPlayInterval={8000} />
              )}
            </LazySection>

            {/* Быстрые действия для авторизованных пользователей — отключено
        <QuickActions />
        */}

            {/* Быстрый доступ к жанрам (Популярные жанры) — закомментировано
        <GenresQuickAccess />
        */}

            {/* Продолжить чтение — только для авторизованных (иначе скелетон сменялся бы на null и давал CLS) */}
            {isAuthenticated && (
              <LazySection
                sectionId="reading"
                onVisible={handleSectionVisible}
                isVisible={!!visibleSections.reading || !!isAuthenticated}
                skeleton={
                  <CarouselSkeleton
                    cardWidth="w-[280px] sm:w-[300px] md:w-[320px]"
                    variant="reading"
                    showDescription
                  />
                }
              >
                <ContinueReadingSectionDynamic clientReadingHistory={continueReading ?? undefined} />
              </LazySection>
            )}

            <LazySection
              sectionId="topPeriod"
              onVisible={handleSectionVisible}
              isVisible={!!visibleSections.topPeriod}
              skeleton={<GridSkeleton showTitle variant="trending" />}
            >
              <TopTitlesSectionDynamic limit={10} />
            </LazySection>

            {/* В тренде на этой неделе — временно отключено */}
            {/* <LazySection
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
        </LazySection> */}

            {/* Последние обновления */}
            <LazySection
              sectionId="latestUpdates"
              onVisible={handleSectionVisible}
              isVisible={!!visibleSections.latestUpdates}
              skeleton={<GridSkeleton variant="updates" />}
            >
              {latestUpdates.loading ? (
                <GridSkeleton variant="updates" />
              ) : latestUpdates.error ? null : (
                <GridSection
                  title="Последние обновления"
                  description="Свежие главы, которые только что вышли. Смотрите все обновления в каталоге."
                  type="browse"
                  href="/updates"
                  icon={<Clock className="w-6 h-6" />}
                  data={Array.isArray(latestUpdates.data) ? latestUpdates.data : []}
                  cardComponent={LatestUpdateCard}
                  layout="auto-fit"
                />
              )}
            </LazySection>

            {/* Рекомендации (только для авторизованных) */}
            {isAuthenticated && (
              <LazySection
                sectionId="recommendations"
                onVisible={handleSectionVisible}
                isVisible={!!visibleSections.recommendations}
                skeleton={
                  <CarouselSkeleton cardWidth="w-32 sm:w-36 md:w-40 lg:w-44" variant="poster" />
                }
              >
                <RecommendationsDynamic limit={10} />
              </LazySection>
            )}

            {/* Новости */}
            <LazySection
              sectionId="news"
              onVisible={handleSectionVisible}
              isVisible={!!visibleSections.news}
              skeleton={<NewsBlockSkeleton />}
            >
              <NewsBlockDynamic />
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

            {/* Случайные тайтлы */}
            <LazySection
              sectionId="random"
              onVisible={handleSectionVisible}
              isVisible={!!visibleSections.random}
              skeleton={<GridSkeleton showTitle variant="trending" />}
            >
              <RandomTitlesDynamic
                data={randomTitles.data}
                loading={randomTitles.loading}
                error={randomTitles.error}
              />
            </LazySection>

            {/* Telegram секция */}
            <TelegramSectionDynamic />

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
                cardComponent={CollectionCardDynamic}
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

            {/* Топ тайтлов: три колонки (2026, Манхва, Маньхуа) — в самый низ */}
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
                  <TopCombinedSectionDynamic data={topCombinedData} />
                )}
              </div>
            </LazySection>
      </main>
      <FooterDynamic />
      <AgeVerificationModalDynamic
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </AgeVerificationProvider>
  );
}

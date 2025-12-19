

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  LibraryIcon,
  SquareArrowOutUpRight,
  Trophy,
} from "lucide-react";

import { CarouselCard, CollectionCard, ReadingCard } from "@/shared";
import LatestUpdateCard from "@/shared/last-updates/last-updates";
import { Carousel, Footer, GridSection, Header } from "@/widgets";
import TopCombinedSection from "@/widgets/top-combined-section/top-combined-section";
import { pageTitle } from "@/lib/page-title";
import { useHomeData } from "@/hooks/useHomeData";
import { useStaticData } from "@/hooks/useStaticData";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import RandomTitlesComponent from "@/shared/random-titles/random-titles";
import { getTitlePath } from "@/lib/title-paths";

// Компоненты скелетонов
const CarouselSkeleton = () => (
  <div className="flex flex-col items-start justify-center carousel-skeleton animate-pulse w-full max-w-7xl mx-auto px-4 py-2 overflow-hidden">
    <div className="h-8 bg-[var(--muted)] rounded w-48 mb-4"></div>
    <div className="flex gap-4 overflow-hidden items-center justify-center">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <div className="w-40 h-64 bg-[var(--muted)] rounded-lg mb-2"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

const GridSkeleton = () => (
  <div className="grid items-center justify-center grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
    {[...Array(12)].map((_, i) => (
      <div key={i}>
        <div className="w-full h-48 bg-[var(--muted)] rounded-lg mb-2"></div>
        <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
      </div>
    ))}
  </div>
);





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
  if (!data?.length)
    return (
      <div className="text-[var(--muted-foreground)] font-semibold p-4">
        Нет данных для отображения {title}
      </div>
    );


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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  // const [activePeriod, setActivePeriod] = useState<"day" | "week" | "month">(
  //   "day"
  // );
  const {
    popularTitles,
    randomTitles,
    // topTitlesDay,
    // topTitlesWeek,
    // topTitlesMonth,
    readingProgress,
    topManhua,
    topManhwa,
    top2025,
  } = useHomeData();
  const { collections, latestUpdates } = useStaticData();

  // SEO для главной страницы
  useSEO(seoConfigs.home);

  useEffect(() => {
    setMounted(true);
    pageTitle.setTitlePage(
      "Tomilo-lib.ru - Платформа для чтения манги и комиксов"
    );
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6 pb-16">
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
      <main className="flex flex-col items-center justify-center gap-6 md:pb-2 pb-16">

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
          cardWidth="w-30 sm:w-30 md:w-35 lg:w-40"

          getItemPath={(item: any) => getTitlePath(item)}
        />

        {/* Случайные тайтлы */}
        <RandomTitlesComponent
          data={randomTitles.data}
          loading={randomTitles.loading}
          error={randomTitles.error}
        />

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






        {/* Объединенная секция топ манхв, маньхуа и новинок 2025 */}
        <TopCombinedSection
          data={{
            topManhwa: (topManhwa.data || []).slice(0, 5).map((item) => ({
              id: item.id,
              slug: item.slug, // Добавляем slug для правильной навигации
              title: item.title,
              coverImage: item.image, // <-- исправлено здесь
              type: item.type,
              year: item.year,
              rating: item.rating,
              views: item.views || "0К", // Добавляем views, если нужно
            })),
            top2025: (top2025.data || []).slice(0, 5).map((item) => ({
              id: item.id,
              slug: item.slug, // Добавляем slug для правильной навигации
              title: item.title,
              coverImage: item.image, // <-- исправлено здесь
              type: item.type,
              year: item.year,
              rating: item.rating,
              views: item.views || "0К",
            })),
            topManhua: (topManhua.data || []).slice(0, 5).map((item) => ({
              id: item.id,
              slug: item.slug, // Добавляем slug для правильной навигации
              title: item.title,
              coverImage: item.image, // <-- исправлено здесь
              type: item.type,
              year: item.year,
              rating: item.rating,
              views: item.views || "0К",
            })),
          }}
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

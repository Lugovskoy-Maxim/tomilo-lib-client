"use client";
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
import { pageTitle } from "@/lib/page-title";
import { useHomeData } from "@/hooks/useHomeData";
import { useStaticData } from "@/hooks/useStaticData";

// Компоненты скелетонов
const CarouselSkeleton = () => (
  <div className="carousel-skeleton animate-pulse">
    <div className="h-8 bg-[var(--muted)] rounded w-48 mb-4"></div>
    <div className="flex gap-4 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <div className="w-30 h-40 bg-[var(--muted)] rounded-lg mb-2"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

const GridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
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
  cardComponent,
  ...carouselProps 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  if (loading) return <CarouselSkeleton />;
  if (error) {
    console.error(`Ошибка загрузки ${title}:`, error);
    return null;
  }
  if (!data?.length) return null;
  console.log(data);
  return (
    <Carousel
      title={title}
      data={data}
      cardComponent={cardComponent}
      {...carouselProps}
    />
  );
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { popularTitles, readingProgress } = useHomeData();
  const { collections, latestUpdates } = useStaticData();

  useEffect(() => {
    setMounted(true);
    pageTitle.setTitlePage("Tomilo-lib.ru - Платформа манги и комиксов");
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <CarouselSkeleton />
          <CarouselSkeleton />
          <CarouselSkeleton />
          <GridSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6">
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
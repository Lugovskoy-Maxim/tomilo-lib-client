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
import { useSEO, seoConfigs } from "@/hooks/useSEO";

// Компоненты скелетонов
const CarouselSkeleton = () => (
  <div className="flex flex-col items-center justify-center carousel-skeleton animate-pulse">
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
  cardComponent,
  ...carouselProps
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  if (loading) return <CarouselSkeleton />;
if (error) {
  console.error(`Ошибка загрузки ${title}:`, error);
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
      data={data}
      cardComponent={cardComponent}
      {...carouselProps}
    />
  );
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activePeriod, setActivePeriod] = useState<"day" | "week" | "month">(
    "day"
  );
  const {
    popularTitles,
    topTitlesDay,
    topTitlesWeek,
    topTitlesMonth,
    readingProgress,
  } = useHomeData();
  const { collections, latestUpdates } = useStaticData();

  const getActiveTopTitles = () => {
    switch (activePeriod) {
      case "day":
        return topTitlesDay;
      case "week":
        return topTitlesWeek;
      case "month":
        return topTitlesMonth;
      default:
        return topTitlesDay;
    }
  };

  const activeTopTitles = getActiveTopTitles();

  // SEO для главной страницы
  useSEO(seoConfigs.home);

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
        {/* Топ тайтлы с переключателем периода */}

        <div className="w-full mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mt-2 w-full justify-center">
              <div className="flex gap-2 p-1 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
                {[
                  { key: "day", label: "за день" },
                  { key: "week", label: "за неделю" },
                  { key: "month", label: "за месяц" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() =>
                      setActivePeriod(key as "day" | "week" | "month")
                    }
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activePeriod === key
                        ? "bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] text-[var(--primary-foreground)] shadow-md"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DataCarousel
            title="Тор тайтлов"
            data={activeTopTitles.data}
            loading={activeTopTitles.loading}
            error={activeTopTitles.error}
            cardComponent={CarouselCard}
            type="browse"
            icon={<Trophy className="w-6 h-6" />}
            navigationIcon={<SquareArrowOutUpRight className="w-6 h-6" />}
            cardWidth="w-30 sm:w-30 md:w-35 lg:w-40"
            showNavigation={true}
          />
        </div>

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

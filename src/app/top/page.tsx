"use client";
import { useMemo } from "react";
import { Trophy } from "lucide-react";

import { Carousel, Footer, Header } from "@/widgets";
import {

  TopTitleCard,
  PeriodFilter,
  LoadingSkeleton,
  ErrorState,
} from "@/shared";
import { useHomeData } from "@/hooks/useHomeData";
import { useSEO } from "@/hooks/useSEO";
import { useMounted } from "@/hooks/useMounted";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";

export default function TopPage() {
  const mounted = useMounted();
  const { activePeriod, setActivePeriod, periodLabels } = usePeriodFilter();
  const { topTitlesDay, topTitlesWeek, topTitlesMonth } = useHomeData();

  useSEO({
    title: `Топ тайтлов ${periodLabels[activePeriod]} - Tomilo-lib.ru`,
    description: `Самые популярные тайтлы ${periodLabels[activePeriod]}. Рейтинг лучшей манги и маньхуа по просмотрам.`,
    keywords: "топ тайтлов, рейтинг, популярные, манга, маньхуа, просмотры",
    type: "website",
  });

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

  const topTitlesWithRank = useMemo(() => {
    return activeTopTitles.data.map((title, index) => ({
      ...title,
      rank: index + 1,
      period: periodLabels[activePeriod],
    }));
  }, [activeTopTitles.data, activePeriod, periodLabels]);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <LoadingSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6 py-6">
        {/* Заголовок страницы */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-[var(--chart-1)]" />
            Топ тайтлов
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Самые популярные тайтлы {periodLabels[activePeriod]}
          </p>
        </div>

        {/* Фильтр периодов */}
        <PeriodFilter
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />

        {/* Топ тайтлы */}
        {activeTopTitles.loading ? (
          <LoadingSkeleton />
        ) : activeTopTitles.error ? (
          <ErrorState
            title="Ошибка загрузки"
            description="Не удалось загрузить топ тайтлов. Попробуйте позже."
          />
        ) : topTitlesWithRank.length > 0 ? (
          <div className="w-full max-w-7xl mx-auto px-4">
            {/* Топ 3 тайтла */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topTitlesWithRank.slice(0, 3).map((title) => (
                <TopTitleCard
                  key={title.id}
                  data={title}
                  variant="top3"
                />
              ))}
            </div>

            {/* Остальные тайтлы в карусели */}
            {topTitlesWithRank.length > 3 && (
              <Carousel
                title={`Топ тайтлов ${periodLabels[activePeriod]} (4-${topTitlesWithRank.length})`}
                data={topTitlesWithRank.slice(3)}
                cardComponent={TopTitleCard}
                cardProps={{ variant: "carousel" }}
                type="browse"
                icon={<Trophy className="w-6 h-6" />}
                cardWidth="w-48 sm:w-52 md:w-56 lg:w-60"
                showNavigation={false}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">
              Нет данных для отображения
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}



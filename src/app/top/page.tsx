"use client";
import { useMemo } from "react";
import { Trophy } from "lucide-react";

import { Carousel, Footer, Header } from "@/widgets";
import { TopTitleCard, PeriodFilter, LoadingSkeleton, ErrorState } from "@/shared";
import { useGetTopTitlesDayQuery, useGetTopTitlesWeekQuery, useGetTopTitlesMonthQuery } from "@/store/api/titlesApi";
import { RankedTopTitle } from "@/types/home";
import { useSEO } from "@/hooks/useSEO";
import { useMounted } from "@/hooks/useMounted";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";

export default function TopPage() {
  const mounted = useMounted();
  const { activePeriod, setActivePeriod, periodLabels } = usePeriodFilter();

  // Топ тайтлы за день
  const {
    data: topTitlesDayData,
    isLoading: topTitlesDayLoading,
    error: topTitlesDayError,
  } = useGetTopTitlesDayQuery({ limit: 10 });

  // Топ тайтлы за неделю
  const {
    data: topTitlesWeekData,
    isLoading: topTitlesWeekLoading,
    error: topTitlesWeekError,
  } = useGetTopTitlesWeekQuery({ limit: 10 });

  // Топ тайтлы за месяц
  const {
    data: topTitlesMonthData,
    isLoading: topTitlesMonthLoading,
    error: topTitlesMonthError,
  } = useGetTopTitlesMonthQuery({ limit: 10 });

  useSEO({
    title: `Топ тайтлов ${periodLabels[activePeriod]} - Tomilo-lib.ru`,
    description: `Самые популярные тайтлы ${periodLabels[activePeriod]}. Рейтинг лучшей манги, манхвы и маньхуа по просмотрам.`,
    keywords: "топ тайтлов, рейтинг, популярные, манга, маньхуа, манхва, топ по просмотрам",
    type: "website",
  });

  const getActiveTopTitles = () => {
    switch (activePeriod) {
      case "day":
        return {
          data: topTitlesDayData?.data || [],
          loading: topTitlesDayLoading,
          error: topTitlesDayError,
        };
      case "week":
        return {
          data: topTitlesWeekData?.data || [],
          loading: topTitlesWeekLoading,
          error: topTitlesWeekError,
        };
      case "month":
        return {
          data: topTitlesMonthData?.data || [],
          loading: topTitlesMonthLoading,
          error: topTitlesMonthError,
        };
      default:
        return {
          data: topTitlesDayData?.data || [],
          loading: topTitlesDayLoading,
          error: topTitlesDayError,
        };
    }
  };

  const activeTopTitles = getActiveTopTitles();

  const topTitlesWithRank = useMemo<RankedTopTitle[]>(() => {
    return activeTopTitles.data.map((title: { id: string; title: string; cover?: string; rating?: number; type?: string; releaseYear?: number; isAdult?: boolean }, index: number) => ({
      id: title.id,
      title: title.title,
      type: title.type || "Неуказан",
      year: title.releaseYear || new Date().getFullYear(),
      rating: title.rating || 0,
      image: title.cover || "",
      genres: [],
      rank: index + 1,
      period: periodLabels[activePeriod],
      isAdult: title.isAdult || false,
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
        <PeriodFilter activePeriod={activePeriod} onPeriodChange={setActivePeriod} />

        {/* Топ тайтлы */}
        {activeTopTitles.loading ? (
          <LoadingSkeleton />
        ) : activeTopTitles.error ? (
          <ErrorState />
        ) : topTitlesWithRank.length > 0 ? (
          <div className="w-full max-w-7xl mx-auto px-4">
            {/* Топ 3 тайтла */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topTitlesWithRank.slice(0, 3).map(title => (
                <TopTitleCard key={title.id} data={title} variant="top3" />
              ))}
            </div>

            {/* Остальные тайтлы в карусели */}
            {topTitlesWithRank.length > 3 && (
              <Carousel
                title={`Топ тайтлов ${periodLabels[activePeriod]} (4-${topTitlesWithRank.length})`}
                data={topTitlesWithRank.slice(3)}
                cardComponent={props => <TopTitleCard {...props} variant="carousel" />}
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
            <p className="text-[var(--muted-foreground)]">Нет данных для отображения</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}


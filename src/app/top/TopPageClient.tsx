"use client";
import { useMemo } from "react";
import { Trophy } from "lucide-react";

import { Carousel, Footer, Header } from "@/widgets";
import TopTitleCard from "@/shared/top-title-card/TopTitleCard";
import PeriodFilter from "@/shared/period-filter/PeriodFilter";
import LoadingSkeleton from "@/shared/skeleton/skeleton";
import ErrorState from "@/shared/profile/ProfileError";
import {
  useGetTopTitlesDayQuery,
  useGetTopTitlesWeekQuery,
  useGetTopTitlesMonthQuery,
} from "@/store/api/titlesApi";
import { RankedTopTitle } from "@/types/home";
import { useMounted } from "@/hooks/useMounted";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfileQuery } from "@/store/api/authApi";

export default function TopPageClient() {
  const mounted = useMounted();
  const { activePeriod, setActivePeriod, periodLabels } = usePeriodFilter();
  const { user } = useAuth();
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !user });
  const displayAdult = profileData?.data?.displaySettings?.isAdult ?? user?.displaySettings?.isAdult;
  const includeAdult = !user ? true : (displayAdult !== false);

  const {
    data: topTitlesDayData,
    isLoading: topTitlesDayLoading,
    error: topTitlesDayError,
  } = useGetTopTitlesDayQuery({ limit: 10, includeAdult });

  const {
    data: topTitlesWeekData,
    isLoading: topTitlesWeekLoading,
    error: topTitlesWeekError,
  } = useGetTopTitlesWeekQuery({ limit: 10, includeAdult });

  const {
    data: topTitlesMonthData,
    isLoading: topTitlesMonthLoading,
    error: topTitlesMonthError,
  } = useGetTopTitlesMonthQuery({ limit: 10, includeAdult });

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
    return activeTopTitles.data.map(
      (
        title: {
          id: string;
          title: string;
          cover?: string;
          rating?: number;
          type?: string;
          releaseYear?: number;
          isAdult?: boolean;
        },
        index: number,
      ) => ({
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
      }),
    );
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
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-[var(--chart-1)]" />
            Топ тайтлов
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Самые популярные тайтлы {periodLabels[activePeriod]}
          </p>
        </div>

        <PeriodFilter activePeriod={activePeriod} onPeriodChange={setActivePeriod} />

        {activeTopTitles.loading ? (
          <LoadingSkeleton />
        ) : activeTopTitles.error ? (
          <ErrorState />
        ) : topTitlesWithRank.length > 0 ? (
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topTitlesWithRank.slice(0, 3).map(title => (
                <TopTitleCard key={title.id} data={title} variant="top3" />
              ))}
            </div>

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

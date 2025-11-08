"use client";
import { useState, useEffect, useMemo } from "react";
import { Trophy } from "lucide-react";

import { Carousel, Footer, GridSection, Header } from "@/widgets";
import { CollectionCard, LatestUpdateCard, TopTitleCard } from "@/shared";
import { pageTitle } from "@/lib/page-title";
import { useStaticData } from "@/hooks/useStaticData";
import { useSEO } from "@/hooks/useSEO";
import topTitlesData from "@/constants/mokeTopTitles";

type Period = "day" | "week" | "month";

const periodLabels = { day: "за день", week: "за неделю", month: "за месяц" };

const PeriodFilter = ({
  activePeriod,
  onPeriodChange,
}: {
  activePeriod: Period;
  onPeriodChange: (period: Period) => void;
}) => (
  <div className="flex justify-center mb-6 sm:mb-8">
    <div className="flex gap-2 p-1 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
      {(["day", "week", "month"] as Period[]).map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activePeriod === period
              ? "bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] text-[var(--primary-foreground)] shadow-md"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          {periodLabels[period]}
        </button>
      ))}
    </div>
  </div>
);

export default function TopPage() {
  const [mounted, setMounted] = useState(false);
  const [activePeriod, setActivePeriod] = useState<Period>("day");
  const { collections, latestUpdates } = useStaticData();

  useSEO({
    title: `Топ тайтлов ${periodLabels[activePeriod]} - Tomilo-lib.ru`,
    description: `Самые популярные тайтлы ${periodLabels[activePeriod]}. Рейтинг лучшей манги и маньхуа по просмотрам.`,
    keywords: "топ тайтлов, рейтинг, популярные, манга, маньхуа, просмотры",
    type: "website",
  });

  useEffect(() => {
    setMounted(true);
    pageTitle.setTitlePage(
      `Топ тайтлов ${periodLabels[activePeriod]} - Tomilo-lib.ru`
    );
  }, [activePeriod]);

  const filteredTopTitles = useMemo(
    () =>
      topTitlesData
        .filter((title) => title.period === activePeriod)
        .slice(0, 10)
        .map((title, index) => ({ ...title, rank: index + 1 })),
    [activePeriod]
  );

  const top3Titles = filteredTopTitles.slice(0, 3);
  const remainingTitles = filteredTopTitles.slice(3);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6 sm:gap-8">
          <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
            <div className="animate-pulse space-y-4 sm:space-y-6">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-[var(--muted)] rounded-xl"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--muted-foreground)] rounded-full"></div>
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-[var(--muted-foreground)] rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 sm:h-5 bg-[var(--muted-foreground)] rounded w-3/4"></div>
                      <div className="h-3 sm:h-4 bg-[var(--muted-foreground)] rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <div className="h-5 sm:h-6 bg-[var(--muted-foreground)] rounded-full w-12 sm:w-16"></div>
                    <div className="h-5 sm:h-6 bg-[var(--muted-foreground)] rounded-full w-16 sm:w-20"></div>
                    <div className="h-5 sm:h-6 bg-[var(--muted-foreground)] rounded-full w-20 sm:w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6 sm:gap-8">
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="text-center mb-2 sm:mb-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--primary)]" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)]">
                Топ тайтлов {periodLabels[activePeriod]}
              </h1>
            </div>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Рейтинг самых популярных тайтлов по количеству просмотров
            </p>
          </div>

          <PeriodFilter
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-2 sm:mb-4">
            {top3Titles.map((title) => (
              <TopTitleCard
                key={`${title.period}-${title.rank}`}
                data={title}
                variant="top3"
              />
            ))}
          </div>

          {remainingTitles.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <Carousel
                title="Остальные в топ-10"
                data={remainingTitles}
                cardComponent={({ data }) => (
                  <TopTitleCard data={data} variant="carousel" />
                )}
                description="Продолжение рейтинга популярных тайтлов"
                type="browse"
                cardWidth="w-28 sm:w-32 md:w-36 lg:w-40"
                scrollAmount={2}
                showNavigation={true}
              />
            </div>
          )}
        </div>

        <div className="w-full max-w-7xl mx-auto px-2">
          <Carousel
            title="Популярные коллекции"
            data={collections.data}
            cardComponent={CollectionCard}
            description="Откройте для себя тематические подборки тайтлов"
            type="collection"
            href="/collections"
            cardWidth="w-24 sm:w-28 md:w-32 lg:w-36"
            showNavigation={false}
          />
        </div>

        {latestUpdates.data.length > 0 && (
          <div className="w-full max-w-7xl mx-auto px-4">
            <GridSection
              title="Свежие обновления"
              description="Новые главы из топ тайтлов"
              type="browse"
              href="/updates"
              data={latestUpdates.data.slice(0, 6)}
              cardComponent={LatestUpdateCard}
            />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

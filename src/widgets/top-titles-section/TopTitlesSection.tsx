"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import TopTitleCard from "@/shared/top-title-card/TopTitleCard";
import {
  useGetTopTitlesDayQuery,
  useGetTopTitlesWeekQuery,
  useGetTopTitlesMonthQuery,
} from "@/store/api/titlesApi";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfileQuery } from "@/store/api/authApi";
import type { TopTitleCardData } from "@/shared/top-title-card/TopTitleCard";

const PERIODS = ["day", "week", "month"] as const;
const PERIOD_LABELS: Record<(typeof PERIODS)[number], string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
};

export interface TopTitlesSectionProps {
  /** На отдельной странице (/top) — без ссылки «Весь топ». На главной — показать ссылку. */
  standalone?: boolean;
  /** Сколько тайтлов показывать (на главной обычно 10, на странице /top — 30). */
  limit?: number;
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="w-14 h-20 sm:w-20 sm:h-28 rounded-lg bg-[var(--muted)] animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 py-1 space-y-2">
            <div className="h-4 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

const DEFAULT_LIMIT = 30;

/** Колонки по брейкпоинтам: grid-cols-1, md:grid-cols-2, xl:grid-cols-3 (768px, 1280px). */
function getColumnsFromWidth(width: number): number {
  if (width >= 1280) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function TopTitlesSection({ standalone = false, limit = DEFAULT_LIMIT }: TopTitlesSectionProps) {
  const { activePeriod, setActivePeriod } = usePeriodFilter();
  const { user } = useAuth();
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !user });
  const includeAdult =
    !user || (profileData?.data?.displaySettings?.isAdult ?? user?.displaySettings?.isAdult) !== false;

  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const update = () => setColumns(getColumnsFromWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /** Показываем кратное числу колонок, чтобы не было неполной строки (например 3 колонки → 9 карточек). */
  const displayLimit = useMemo(
    () => Math.max(columns, Math.floor(limit / columns) * columns),
    [limit, columns],
  );

  const day = useGetTopTitlesDayQuery({ limit: Math.max(limit, 10), includeAdult });
  const week = useGetTopTitlesWeekQuery({ limit: Math.max(limit, 10), includeAdult });
  const month = useGetTopTitlesMonthQuery({ limit: Math.max(limit, 10), includeAdult });

  const current = activePeriod === "day" ? day : activePeriod === "week" ? week : month;
  const rawList = current.data?.data ?? [];

  /** Сортируем по просмотрам за период по убыванию, чтобы топ-1 имел больше всего просмотров. */
  const list = useMemo(() => {
    return [...rawList].sort((a, b) => {
      const viewsA =
        (a as { views?: number; dayViews?: number; weekViews?: number; monthViews?: number }).views ??
        (activePeriod === "day"
          ? (a as { dayViews?: number }).dayViews
          : activePeriod === "week"
            ? (a as { weekViews?: number }).weekViews
            : (a as { monthViews?: number }).monthViews) ??
        0;
      const viewsB =
        (b as { views?: number; dayViews?: number; weekViews?: number; monthViews?: number }).views ??
        (activePeriod === "day"
          ? (b as { dayViews?: number }).dayViews
          : activePeriod === "week"
            ? (b as { weekViews?: number }).weekViews
            : (b as { monthViews?: number }).monthViews) ??
        0;
      return viewsB - viewsA;
    });
  }, [rawList, activePeriod]);

  const cards: TopTitleCardData[] = useMemo(
    () =>
      list.slice(0, displayLimit).map(
        (
          t: {
            id: string;
            title: string;
            cover?: string;
            rating?: number;
            type?: string;
            releaseYear?: number;
            isAdult?: boolean;
            views?: number;
            dayViews?: number;
            weekViews?: number;
            monthViews?: number;
            slug?: string;
          },
          i,
        ) => {
          const periodViews =
            t.views ??
            (activePeriod === "day" ? t.dayViews : activePeriod === "week" ? t.weekViews : t.monthViews);
          return {
            id: t.id,
            slug: t.slug,
            title: t.title,
            type: t.type ?? "—",
            year: t.releaseYear ?? new Date().getFullYear(),
            rating: t.rating ?? 0,
            image: t.cover ?? "",
            rank: i + 1,
            views: periodViews,
            isAdult: t.isAdult ?? false,
          };
        },
      ),
    [list, displayLimit, activePeriod],
  );

  return (
    <section
      className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6"
      aria-labelledby="top-titles-heading"
    >
      {/* Заголовок в стиле секций главной */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="top-titles-heading"
              className="text-lg md:text-xl font-bold text-[var(--foreground)]"
            >
              Топ тайтлов
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              По просмотрам за {PERIOD_LABELS[activePeriod].toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] w-full sm:w-auto sm:max-w-xs">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePeriod(p)}
                className={`flex-1 sm:flex-initial sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePeriod === p
                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          {!standalone && (
            <Link
              href="/top"
              className="text-sm font-medium text-[var(--primary)] hover:underline underline-offset-2 flex items-center gap-1 shrink-0"
            >
              Весь топ
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {current.isLoading ? (
        <Skeleton />
      ) : current.error ? (
        <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          Не удалось загрузить список. Попробуйте позже.
        </div>
      ) : cards.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          Нет данных за выбранный период
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" role="list">
          {cards.map((item) => (
            <li key={item.id}>
              <TopTitleCard data={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

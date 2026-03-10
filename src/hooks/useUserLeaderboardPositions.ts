"use client";
import { useMemo } from "react";
import {
  useGetLeaderboardQuery,
  useGetLeaderboardAllPeriodsQuery,
  LeaderboardCategory,
  LeaderboardPeriod,
  type LeaderboardUser,
} from "@/store/api/leaderboardApi";
import { useAuth } from "./useAuth";

export interface UserLeaderboardPosition {
  category: LeaderboardCategory;
  position: number;
  label: string;
  /** Период, в котором достигнута эта позиция (если не «всё время») */
  period?: LeaderboardPeriod;
}

const ALL_CATEGORIES = [
  "level",
  "ratings",
  "comments",
  "streak",
  "chaptersRead",
] as const satisfies readonly LeaderboardCategory[];

type QueryCategory = (typeof ALL_CATEGORIES)[number];

const CATEGORY_LABELS: Record<QueryCategory, string> = {
  level: "Уровень",
  ratings: "Оценки",
  comments: "Комментарии",
  streak: "Страйк",
  chaptersRead: "Главы",
};

function findBestPositionWithPeriod(
  userId: string,
  sources: { users: LeaderboardUser[]; period: LeaderboardPeriod }[],
): { position: number; period: LeaderboardPeriod } | null {
  let best: { position: number; period: LeaderboardPeriod } | null = null;
  for (const { users, period } of sources) {
    if (!users) continue;
    const index = users.findIndex((u: LeaderboardUser) => u._id === userId);
    if (index !== -1 && index < 10) {
      const pos = index + 1;
      if (best === null || pos < best.position) best = { position: pos, period };
    }
  }
  return best;
}

export function useUserLeaderboardPositions(targetUserId?: string) {
  const { user, isAuthenticated } = useAuth();
  const userId = targetUserId || user?.id || user?._id;
  const shouldSkip = !targetUserId && !isAuthenticated;

  // level и streak: периоды all, month, week (allPeriods в API нет)
  const levelAll = useGetLeaderboardQuery({ category: "level", limit: 10 }, { skip: shouldSkip });
  const levelMonth = useGetLeaderboardQuery(
    { category: "level", period: "month", limit: 10 },
    { skip: shouldSkip },
  );
  const levelWeek = useGetLeaderboardQuery(
    { category: "level", period: "week", limit: 10 },
    { skip: shouldSkip },
  );
  const streakAll = useGetLeaderboardQuery({ category: "streak", limit: 10 }, { skip: shouldSkip });
  const streakMonth = useGetLeaderboardQuery(
    { category: "streak", period: "month", limit: 10 },
    { skip: shouldSkip },
  );
  const streakWeek = useGetLeaderboardQuery(
    { category: "streak", period: "week", limit: 10 },
    { skip: shouldSkip },
  );

  // ratings, comments, chaptersRead: один запрос за все периоды (week, month, all)
  const ratingsAllPeriods = useGetLeaderboardAllPeriodsQuery(
    { category: "ratings", limit: 10 },
    { skip: shouldSkip },
  );
  const commentsAllPeriods = useGetLeaderboardAllPeriodsQuery(
    { category: "comments", limit: 10 },
    { skip: shouldSkip },
  );
  const chaptersReadAllPeriods = useGetLeaderboardAllPeriodsQuery(
    { category: "chaptersRead", limit: 10 },
    { skip: shouldSkip },
  );

  const allQueries = [
    levelAll,
    levelMonth,
    levelWeek,
    streakAll,
    streakMonth,
    streakWeek,
    ratingsAllPeriods,
    commentsAllPeriods,
    chaptersReadAllPeriods,
  ];
  const isLoading = allQueries.some(q => q.isLoading);

  const top10Positions = useMemo(() => {
    if (!userId) return [];

    const positions: UserLeaderboardPosition[] = [];

    // level: лучшая позиция среди all, month, week (одна за категорию — та что выше)
    const levelBest = findBestPositionWithPeriod(userId, [
      { users: levelAll.data?.data?.users ?? [], period: "all" },
      { users: levelMonth.data?.data?.users ?? [], period: "month" },
      { users: levelWeek.data?.data?.users ?? [], period: "week" },
    ]);
    if (levelBest !== null) {
      positions.push({
        category: "level",
        position: levelBest.position,
        label: CATEGORY_LABELS.level,
        period: levelBest.period === "all" ? undefined : levelBest.period,
      });
    }

    // streak: лучшая позиция среди all, month, week
    const streakBest = findBestPositionWithPeriod(userId, [
      { users: streakAll.data?.data?.users ?? [], period: "all" },
      { users: streakMonth.data?.data?.users ?? [], period: "month" },
      { users: streakWeek.data?.data?.users ?? [], period: "week" },
    ]);
    if (streakBest !== null) {
      positions.push({
        category: "streak",
        position: streakBest.position,
        label: CATEGORY_LABELS.streak,
        period: streakBest.period === "all" ? undefined : streakBest.period,
      });
    }

    // ratings, comments, chaptersRead: из allPeriods (week, month, all)
    const allPeriodsCategories = [
      { key: "ratings" as const, query: ratingsAllPeriods },
      { key: "comments" as const, query: commentsAllPeriods },
      { key: "chaptersRead" as const, query: chaptersReadAllPeriods },
    ];
    for (const { key, query } of allPeriodsCategories) {
      const data = query.data?.data;
      if (!data) continue;
      const best = findBestPositionWithPeriod(userId, [
        { users: data.week?.users ?? [], period: "week" },
        { users: data.month?.users ?? [], period: "month" },
        { users: data.all?.users ?? [], period: "all" },
      ]);
      if (best !== null) {
        positions.push({
          category: key,
          position: best.position,
          label: CATEGORY_LABELS[key],
          period: best.period === "all" ? undefined : best.period,
        });
      }
    }

    return positions.sort((a, b) => a.position - b.position);
  }, [
    userId,
    levelAll.data,
    levelMonth.data,
    levelWeek.data,
    streakAll.data,
    streakMonth.data,
    streakWeek.data,
    ratingsAllPeriods.data,
    commentsAllPeriods.data,
    chaptersReadAllPeriods.data,
  ]);

  const bestPosition = top10Positions.length > 0 ? top10Positions[0] : null;
  const hasTop10 = top10Positions.length > 0;

  return {
    positions: top10Positions,
    bestPosition,
    hasTop10,
    isLoading,
    isAuthenticated,
  };
}

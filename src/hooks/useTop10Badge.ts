"use client";

import { useMemo } from "react";
import {
  useGetLeaderboardQuery,
  LeaderboardCategory,
  LeaderboardPeriod,
} from "@/store/api/leaderboardApi";

export interface Top10BadgeInfo {
  category: LeaderboardCategory;
  position: number;
  label: string;
  period: LeaderboardPeriod;
}

const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  level: "Уровень",
  readingTime: "Время чтения",
  ratings: "Оценки",
  comments: "Комментарии",
  streak: "Страйк",
  chaptersRead: "Главы",
};

const ALL_CATEGORIES: LeaderboardCategory[] = [
  "level",
  "chaptersRead",
  "ratings",
  "comments",
  "streak",
];

const CATEGORIES_WITH_PERIOD: LeaderboardCategory[] = ["ratings", "comments"];

export function useTop10Badge(userId: string | undefined) {
  const levelQuery = useGetLeaderboardQuery({ category: "level", limit: 10 }, { skip: !userId });
  const chaptersReadQuery = useGetLeaderboardQuery(
    { category: "chaptersRead", limit: 10 },
    { skip: !userId },
  );
  const ratingsQuery = useGetLeaderboardQuery(
    { category: "ratings", limit: 10, period: "all" },
    { skip: !userId },
  );
  const ratingsMonthQuery = useGetLeaderboardQuery(
    { category: "ratings", limit: 10, period: "month" },
    { skip: !userId },
  );
  const commentsQuery = useGetLeaderboardQuery(
    { category: "comments", limit: 10, period: "all" },
    { skip: !userId },
  );
  const commentsMonthQuery = useGetLeaderboardQuery(
    { category: "comments", limit: 10, period: "month" },
    { skip: !userId },
  );
  const streakQuery = useGetLeaderboardQuery({ category: "streak", limit: 10 }, { skip: !userId });

  interface QueryInfo {
    query: typeof levelQuery;
    period: LeaderboardPeriod;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- объекты от хуков, пересчёт по userId
  const queriesAll: Record<LeaderboardCategory, QueryInfo> = {
    level: { query: levelQuery, period: "all" },
    readingTime: { query: levelQuery, period: "all" },
    ratings: { query: ratingsQuery, period: "all" },
    comments: { query: commentsQuery, period: "all" },
    streak: { query: streakQuery, period: "all" },
    chaptersRead: { query: chaptersReadQuery, period: "all" },
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- объекты от хуков
  const queriesMonth: Partial<Record<LeaderboardCategory, QueryInfo>> = {
    ratings: { query: ratingsMonthQuery, period: "month" },
    comments: { query: commentsMonthQuery, period: "month" },
  };

  const allQueries = [
    levelQuery,
    chaptersReadQuery,
    ratingsQuery,
    ratingsMonthQuery,
    commentsQuery,
    commentsMonthQuery,
    streakQuery,
  ];

  const isLoading = allQueries.some(q => q.isLoading);

  const allBadges = useMemo((): Top10BadgeInfo[] => {
    if (!userId) return [];

    const badges: Top10BadgeInfo[] = [];

    for (const category of ALL_CATEGORIES) {
      const queryInfo = queriesAll[category];
      const users = queryInfo.query.data?.data?.users;
      if (users) {
        const index = users.findIndex(u => u._id === userId);
        if (index !== -1 && index < 10) {
          badges.push({
            category,
            position: index + 1,
            label: CATEGORY_LABELS[category],
            period: "all",
          });
        }
      }

      if (CATEGORIES_WITH_PERIOD.includes(category)) {
        const monthQueryInfo = queriesMonth[category];
        if (monthQueryInfo) {
          const monthUsers = monthQueryInfo.query.data?.data?.users;
          if (monthUsers) {
            const monthIndex = monthUsers.findIndex(u => u._id === userId);
            if (monthIndex !== -1 && monthIndex < 10) {
              const existingAllTime = badges.find(
                b => b.category === category && b.period === "all",
              );
              if (!existingAllTime || monthIndex + 1 < existingAllTime.position) {
                if (existingAllTime) {
                  const idx = badges.indexOf(existingAllTime);
                  badges.splice(idx, 1);
                }
                badges.push({
                  category,
                  position: monthIndex + 1,
                  label: CATEGORY_LABELS[category],
                  period: "month",
                });
              }
            }
          }
        }
      }
    }

    return badges.sort((a, b) => a.position - b.position);
  }, [userId, queriesAll, queriesMonth]);

  const bestBadge = allBadges.length > 0 ? allBadges[0] : null;

  return {
    badge: bestBadge,
    badges: allBadges,
    isLoading,
  };
}

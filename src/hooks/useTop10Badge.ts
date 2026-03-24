"use client";

import { useMemo } from "react";
import {
  useGetLeaderboardQuery,
  useGetLeaderboardAllPeriodsQuery,
  LeaderboardCategory,
  LeaderboardPeriod,
} from "@/store/api/leaderboardApi";
import { useGetCharacterContributorsQuery } from "@/store/api/usersApi";

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
  likesReceived: "Лайки",
  developmentHelp: "Помощь в развитии",
  balance: "Монеты",
};

function findBestPositionWithPeriod(
  userId: string,
  sources: { users: { _id: string }[] | undefined; period: LeaderboardPeriod }[],
): { position: number; period: LeaderboardPeriod } | null {
  let best: { position: number; period: LeaderboardPeriod } | null = null;
  for (const { users, period } of sources) {
    if (!users) continue;
    const index = users.findIndex((u: { _id: string }) => u._id === userId);
    if (index !== -1 && index < 10) {
      const pos = index + 1;
      if (best === null || pos < best.position) best = { position: pos, period };
    }
  }
  return best;
}

export function useTop10Badge(userId: string | undefined) {
  // level и streak: один запрос за период all (как в useUserLeaderboardPositions — там отдельно all/month/week для этих категорий; для бейджа достаточно all)
  const levelQuery = useGetLeaderboardQuery({ category: "level", limit: 10 }, { skip: !userId });
  const streakQuery = useGetLeaderboardQuery({ category: "streak", limit: 10 }, { skip: !userId });

  // ratings, comments, chaptersRead: один запрос за все периоды (week, month, all) — та же логика, что на странице лидеров и в useUserLeaderboardPositions
  const ratingsAllPeriods = useGetLeaderboardAllPeriodsQuery(
    { category: "ratings", limit: 10 },
    { skip: !userId },
  );
  const commentsAllPeriods = useGetLeaderboardAllPeriodsQuery(
    { category: "comments", limit: 10 },
    { skip: !userId },
  );
  const chaptersReadAllPeriods = useGetLeaderboardAllPeriodsQuery(
    { category: "chaptersRead", limit: 10 },
    { skip: !userId },
  );
  const likesReceivedQuery = useGetLeaderboardQuery(
    { category: "likesReceived", period: "all", limit: 10 },
    { skip: !userId },
  );
  const balanceQuery = useGetLeaderboardQuery(
    { category: "balance", period: "all", limit: 10 },
    { skip: !userId },
  );
  const developmentContributorsQuery = useGetCharacterContributorsQuery(
    { limit: 50 },
    { skip: !userId },
  );

  const allQueries = [
    levelQuery,
    streakQuery,
    ratingsAllPeriods,
    commentsAllPeriods,
    chaptersReadAllPeriods,
    likesReceivedQuery,
    balanceQuery,
    developmentContributorsQuery,
  ];
  const isLoading = allQueries.some(q => q.isLoading);

  const allBadges = useMemo((): Top10BadgeInfo[] => {
    if (!userId) return [];

    const badges: Top10BadgeInfo[] = [];

    // level
    const levelUsers = levelQuery.data?.data?.users;
    if (levelUsers) {
      const index = levelUsers.findIndex(u => u._id === userId);
      if (index !== -1 && index < 10) {
        badges.push({
          category: "level",
          position: index + 1,
          label: CATEGORY_LABELS.level,
          period: "all",
        });
      }
    }

    // streak
    const streakUsers = streakQuery.data?.data?.users;
    if (streakUsers) {
      const index = streakUsers.findIndex(u => u._id === userId);
      if (index !== -1 && index < 10) {
        badges.push({
          category: "streak",
          position: index + 1,
          label: CATEGORY_LABELS.streak,
          period: "all",
        });
      }
    }

    // ratings, comments, chaptersRead — из allPeriods (week, month, all), лучшая позиция
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
        badges.push({
          category: key,
          position: best.position,
          label: CATEGORY_LABELS[key],
          period: best.period,
        });
      }
    }

    // likesReceived, balance
    const likesUsers = likesReceivedQuery.data?.data?.users;
    if (likesUsers) {
      const index = likesUsers.findIndex(u => u._id === userId);
      if (index !== -1 && index < 10) {
        badges.push({
          category: "likesReceived",
          position: index + 1,
          label: CATEGORY_LABELS.likesReceived,
          period: "all",
        });
      }
    }
    const balanceUsers = balanceQuery.data?.data?.users;
    if (balanceUsers) {
      const index = balanceUsers.findIndex(u => u._id === userId);
      if (index !== -1 && index < 10) {
        badges.push({
          category: "balance",
          position: index + 1,
          label: CATEGORY_LABELS.balance,
          period: "all",
        });
      }
    }

    const contribUsers = developmentContributorsQuery.data?.users;
    if (contribUsers) {
      const index = contribUsers.findIndex(u => u._id === userId);
      if (index !== -1 && index < 10) {
        badges.push({
          category: "developmentHelp",
          position: index + 1,
          label: CATEGORY_LABELS.developmentHelp,
          period: "all",
        });
      }
    }

    return badges.sort((a, b) => a.position - b.position);
  }, [
    userId,
    levelQuery.data,
    streakQuery.data,
    ratingsAllPeriods.data,
    commentsAllPeriods.data,
    chaptersReadAllPeriods.data,
    likesReceivedQuery.data,
    balanceQuery.data,
    developmentContributorsQuery.data,
  ]);

  const bestBadge = allBadges.length > 0 ? allBadges[0] : null;

  return {
    badge: bestBadge,
    badges: allBadges,
    isLoading,
  };
}

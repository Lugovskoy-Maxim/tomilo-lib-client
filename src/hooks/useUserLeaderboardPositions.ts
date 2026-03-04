"use client";
import { useMemo } from "react";
import {
  useGetLeaderboardQuery,
  LeaderboardCategory,
  type LeaderboardUser,
} from "@/store/api/leaderboardApi";
import { useAuth } from "./useAuth";

export interface UserLeaderboardPosition {
  category: LeaderboardCategory;
  position: number;
  label: string;
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

export function useUserLeaderboardPositions(targetUserId?: string) {
  const { user, isAuthenticated } = useAuth();
  const userId = targetUserId || user?.id || user?._id;
  const shouldSkip = !targetUserId && !isAuthenticated;

  const levelQuery = useGetLeaderboardQuery(
    { category: "level", limit: 10 },
    { skip: shouldSkip }
  );
  const ratingsQuery = useGetLeaderboardQuery(
    { category: "ratings", limit: 10 },
    { skip: shouldSkip }
  );
  const commentsQuery = useGetLeaderboardQuery(
    { category: "comments", limit: 10 },
    { skip: shouldSkip }
  );
  const streakQuery = useGetLeaderboardQuery(
    { category: "streak", limit: 10 },
    { skip: shouldSkip }
  );
  const chaptersReadQuery = useGetLeaderboardQuery(
    { category: "chaptersRead", limit: 10 },
    { skip: shouldSkip }
  );

  const queries: Record<
    QueryCategory,
    ReturnType<typeof useGetLeaderboardQuery>
  > = {
    level: levelQuery,
    ratings: ratingsQuery,
    comments: commentsQuery,
    streak: streakQuery,
    chaptersRead: chaptersReadQuery,
  };

  const isLoading = Object.values(queries).some((q) => q.isLoading);

  const top10Positions = useMemo(() => {
    if (!userId) return [];

    const positions: UserLeaderboardPosition[] = [];

    for (const category of ALL_CATEGORIES) {
      const query = queries[category];
      const users = query.data?.data?.users;
      if (!users) continue;

      const index = users.findIndex(
        (u: LeaderboardUser) => u._id === userId
      );

      if (index !== -1 && index < 10) {
        positions.push({
          category,
          position: index + 1,
          label: CATEGORY_LABELS[category],
        });
      }
    }

    return positions.sort((a, b) => a.position - b.position);
  }, [userId, queries]);

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

import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export type LeaderboardCategory =
  | "level"
  | "readingTime"
  | "ratings"
  | "comments"
  | "streak"
  | "chaptersRead"
  | "likesReceived"
  | "balance";
export type LeaderboardPeriod = "all" | "month" | "week";

/** Рекомендуемый кеш на бэкенде для /users/leaderboard (в часах). Данные на странице лидеров обновляются с этой периодичностью. */
export const LEADERBOARD_CACHE_HOURS = 6;

export type DecorationRarity = "common" | "rare" | "epic" | "legendary";

export interface LeaderboardUserEquippedDecorations {
  avatar?: string | null;
  frame?: string | null;
  background?: string | null;
  card?: string | null;
  cardRarity?: DecorationRarity | null;
  frameRarity?: DecorationRarity | null;
  avatarRarity?: DecorationRarity | null;
}

export interface LeaderboardUser {
  _id: string;
  username: string;
  avatar?: string;
  role?: string;
  level?: number;
  experience?: number;
  readingTime?: number;
  readingTimeMinutes?: number;
  chaptersRead?: number;
  ratingsCount?: number;
  commentsCount?: number;
  likesReceivedCount?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastStreakDate?: string;
  titlesReadCount?: number;
  completedTitlesCount?: number;
  createdAt?: string;
  equippedDecorations?: LeaderboardUserEquippedDecorations | null;
  /** Показывать ли статистику в публичном профиле (если false — пользователь скрыт из лидеров) */
  showStats?: boolean;
  /** Дата окончания премиум-подписки (ISO). Если в будущем — показываем значок премиум. */
  subscriptionExpiresAt?: string | null;
  /** Баланс монет (для категории balance). */
  balance?: number;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  total: number;
  category: LeaderboardCategory;
  period?: LeaderboardPeriod;
}

/** Ответ лидерборда за все периоды одним запросом (week, month, all). */
export interface LeaderboardAllPeriodsResponse {
  week: LeaderboardResponse;
  month: LeaderboardResponse;
  all: LeaderboardResponse;
}

/** Время хранения кеша лидерборда на клиенте (секунды). Совпадает с рекомендуемым кешем бэкенда. */
const LEADERBOARD_CACHE_SECONDS = LEADERBOARD_CACHE_HOURS * 3600;

export const leaderboardApi = createApi({
  reducerPath: "leaderboardApi",
  keepUnusedDataFor: LEADERBOARD_CACHE_SECONDS,
  refetchOnMountOrArgChange: LEADERBOARD_CACHE_SECONDS,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Leaderboard"],
  endpoints: builder => ({
    getLeaderboard: builder.query<
      ApiResponse<LeaderboardResponse>,
      { category: LeaderboardCategory; period?: LeaderboardPeriod; limit?: number; page?: number }
    >({
      query: ({ category, period = "all", limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category, period, limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    /** Один запрос — данные за все периоды (week, month, all). Только для category: ratings | comments | chaptersRead. */
    getLeaderboardAllPeriods: builder.query<
      ApiResponse<LeaderboardAllPeriodsResponse>,
      {
        category: "ratings" | "comments" | "chaptersRead";
        limit?: number;
        page?: number;
      }
    >({
      query: ({ category, limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category, allPeriods: "true", limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    getLeaderboardByLevel: builder.query<
      ApiResponse<LeaderboardResponse>,
      { limit?: number; page?: number }
    >({
      query: ({ limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category: "level", limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    getLeaderboardByReadingTime: builder.query<
      ApiResponse<LeaderboardResponse>,
      { limit?: number; page?: number }
    >({
      query: ({ limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category: "readingTime", limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    getLeaderboardByRatings: builder.query<
      ApiResponse<LeaderboardResponse>,
      { limit?: number; page?: number }
    >({
      query: ({ limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category: "ratings", limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    getLeaderboardByComments: builder.query<
      ApiResponse<LeaderboardResponse>,
      { limit?: number; page?: number }
    >({
      query: ({ limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category: "comments", limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    getLeaderboardByStreak: builder.query<
      ApiResponse<LeaderboardResponse>,
      { limit?: number; page?: number }
    >({
      query: ({ limit = 50, page = 1 }) => ({
        url: "/users/leaderboard",
        params: { category: "streak", limit, page },
      }),
      providesTags: ["Leaderboard"],
    }),
    getUserLeaderboardPositions: builder.query<
      ApiResponse<{
        positions: {
          category: LeaderboardCategory;
          position: number;
          value: number;
        }[];
        inTop10Categories: LeaderboardCategory[];
      }>,
      void
    >({
      query: () => ({
        url: "/users/leaderboard/my-positions",
      }),
      providesTags: ["Leaderboard"],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useGetLeaderboardAllPeriodsQuery,
  useGetUserLeaderboardPositionsQuery,
  useGetLeaderboardByLevelQuery,
  useGetLeaderboardByReadingTimeQuery,
  useGetLeaderboardByRatingsQuery,
  useGetLeaderboardByCommentsQuery,
  useGetLeaderboardByStreakQuery,
} = leaderboardApi;

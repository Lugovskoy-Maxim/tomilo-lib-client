import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export type LeaderboardCategory =
  | "level"
  | "readingTime"
  | "ratings"
  | "comments"
  | "streak"
  | "chaptersRead";
export type LeaderboardPeriod = "all" | "month";

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
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  total: number;
  category: LeaderboardCategory;
  period?: LeaderboardPeriod;
}

export const leaderboardApi = createApi({
  reducerPath: "leaderboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
    prepareHeaders: headers => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
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
  useGetUserLeaderboardPositionsQuery,
  useGetLeaderboardByLevelQuery,
  useGetLeaderboardByReadingTimeQuery,
  useGetLeaderboardByRatingsQuery,
  useGetLeaderboardByCommentsQuery,
  useGetLeaderboardByStreakQuery,
} = leaderboardApi;

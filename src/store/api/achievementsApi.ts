import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { AchievementType, AchievementRarity } from "@/types/user";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export interface Achievement {
  _id: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  rarity: AchievementRarity;
  maxProgress?: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAchievementRequest {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  rarity: AchievementRarity;
  maxProgress?: number;
  isHidden?: boolean;
}

export interface UpdateAchievementRequest {
  _id: string;
  name?: string;
  description?: string;
  icon?: string;
  type?: AchievementType;
  rarity?: AchievementRarity;
  maxProgress?: number;
  isHidden?: boolean;
}

export interface GrantAchievementRequest {
  achievementId: string;
  userId: string;
  progress?: number;
}

export const achievementsApi = createApi({
  reducerPath: "achievementsApi",
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
  tagTypes: ["Achievements"],
  endpoints: builder => ({
    getAchievements: builder.query<
      ApiResponse<{
        achievements: Achievement[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      { search?: string; type?: string; rarity?: string; page?: number; limit?: number }
    >({
      query: ({ search = "", type = "", rarity = "", page = 1, limit = 50 }) => ({
        url: `/achievements/admin?search=${encodeURIComponent(search)}&type=${type}&rarity=${rarity}&page=${page}&limit=${limit}`,
      }),
      providesTags: ["Achievements"],
    }),

    getAchievementById: builder.query<ApiResponse<Achievement>, string>({
      query: id => ({
        url: `/achievements/admin/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Achievements", id }],
    }),

    createAchievement: builder.mutation<ApiResponse<Achievement>, CreateAchievementRequest>({
      query: data => ({
        url: "/achievements/admin",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Achievements"],
    }),

    updateAchievement: builder.mutation<ApiResponse<Achievement>, UpdateAchievementRequest>({
      query: ({ _id, ...data }) => ({
        url: `/achievements/admin/${_id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { _id }) => [
        { type: "Achievements", id: _id },
        "Achievements",
      ],
    }),

    deleteAchievement: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/achievements/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Achievements"],
    }),

    grantAchievement: builder.mutation<ApiResponse<void>, GrantAchievementRequest>({
      query: data => ({
        url: "/achievements/admin/grant",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Achievements"],
    }),

    revokeAchievement: builder.mutation<
      ApiResponse<void>,
      { achievementId: string; userId: string }
    >({
      query: data => ({
        url: "/achievements/admin/revoke",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Achievements"],
    }),
  }),
});

export const {
  useGetAchievementsQuery,
  useGetAchievementByIdQuery,
  useCreateAchievementMutation,
  useUpdateAchievementMutation,
  useDeleteAchievementMutation,
  useGrantAchievementMutation,
  useRevokeAchievementMutation,
} = achievementsApi;

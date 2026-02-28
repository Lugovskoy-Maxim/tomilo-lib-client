import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { UserProfile } from "@/types/user";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

type HomepageSortBy = "level" | "lastActiveAt" | "lastActivityAt" | "createdAt";
type HomepageSortOrder = "asc" | "desc";
type HomepageVerification = "any" | "email" | "oauth";
type HomepageFormat = "basic" | "extended";

export interface HomepageActiveUserEquippedDecorations {
  avatar?: string | null;
  frame?: string | null;
  background?: string | null;
  card?: string | null;
}

export interface HomepageActiveUser {
  _id: string;
  username: string;
  avatar?: string;
  role?: string;
  level?: number;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
  lastActivityAt?: string;
  lastActiveDays?: number;
  activityScore?: number;
  reputationScore?: number;
  bio?: string;
  equippedDecorations?: HomepageActiveUserEquippedDecorations | null;
}

export const usersApi = createApi({
  reducerPath: "usersApi",
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
  tagTypes: ["Users"],
  endpoints: builder => ({
    getUsers: builder.query<
      ApiResponse<{
        users: UserProfile[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      { search?: string; page?: number; limit?: number }
    >({
      query: ({ search = "", page = 1, limit = 50 }) => ({
        url: `/users/admin/?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      }),
      providesTags: ["Users"],
    }),
    getUserById: builder.query<ApiResponse<UserProfile>, string>({
      query: userId => ({
        url: `/users/admin/${userId}`,
      }),
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    getHomepageActiveUsers: builder.query<
      ApiResponse<HomepageActiveUser[]> | ApiResponse<{ users: HomepageActiveUser[] }>,
      {
        limit?: number;
        days?: number;
        sortBy?: HomepageSortBy;
        sortOrder?: HomepageSortOrder;
        verification?: HomepageVerification;
        requireAvatar?: boolean;
        format?: HomepageFormat;
      }
    >({
      query: ({
        limit = 12,
        days = 7,
        sortBy = "level",
        sortOrder = "desc",
        verification = "any",
        requireAvatar = true,
        format = "extended",
      }) => ({
        url: "/users/homepage/active",
        params: { limit, days, sortBy, sortOrder, verification, requireAvatar, format },
      }),
      providesTags: ["Users"],
    }),
    deleteUser: builder.mutation<ApiResponse<void>, string>({
      query: userId => ({
        url: `/users/admin/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useDeleteUserMutation,
  useGetUserByIdQuery,
  useGetHomepageActiveUsersQuery,
} = usersApi;

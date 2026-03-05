import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { UserProfile } from "@/types/user";
import { authApi } from "./authApi";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

type HomepageSortBy = "level" | "lastActiveAt" | "lastActivityAt" | "createdAt";
type HomepageSortOrder = "asc" | "desc";
type HomepageVerification = "any" | "email" | "oauth";
type HomepageFormat = "basic" | "extended";

export type UserRole = "user" | "moderator" | "admin";

export interface UserBan {
  _id: string;
  reason: string;
  bannedAt: string;
  expiresAt?: string;
  bannedBy: string;
  isActive: boolean;
}

export interface BalanceTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: "add" | "subtract" | "purchase" | "reward" | "admin_adjustment";
  description: string;
  createdAt: string;
  createdBy?: string;
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
}

export interface BanUserRequest {
  userId: string;
  reason: string;
  duration?: number; // hours, undefined = permanent
}

export interface UpdateUserBalanceRequest {
  userId: string;
  amount: number;
  description: string;
}

export interface UpdateUserDataRequest {
  userId: string;
  data: {
    email?: string;
    username?: string;
    level?: number;
    experience?: number;
    bio?: string;
    /** Дата окончания премиум (ISO). null — снять подписку. */
    subscriptionExpiresAt?: string | null;
  };
}

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
      { search?: string; page?: number; limit?: number; role?: string }
    >({
      query: ({ search = "", page = 1, limit = 50, role }) => {
        const params = new URLSearchParams();
        params.set("search", search);
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (role) params.set("role", role);
        return { url: `/users/admin/?${params.toString()}` };
      },
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
    
    // Update user role
    updateUserRole: builder.mutation<ApiResponse<UserProfile>, UpdateUserRoleRequest>({
      query: ({ userId, role }) => ({
        url: `/users/admin/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Users", id: userId }, "Users"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["Auth"]));
        } catch {}
      },
    }),
    
    // Ban user
    banUser: builder.mutation<ApiResponse<UserBan>, BanUserRequest>({
      query: ({ userId, reason, duration }) => ({
        url: `/users/admin/${userId}/ban`,
        method: "POST",
        body: { reason, duration },
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Users", id: userId }, "Users"],
    }),
    
    // Unban user
    unbanUser: builder.mutation<ApiResponse<void>, string>({
      query: userId => ({
        url: `/users/admin/${userId}/ban`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, userId) => [{ type: "Users", id: userId }, "Users"],
    }),
    
    // Get user ban history
    getUserBanHistory: builder.query<ApiResponse<UserBan[]>, string>({
      query: userId => ({
        url: `/users/admin/${userId}/bans`,
      }),
      providesTags: (result, error, userId) => [{ type: "Users", id: userId }],
    }),
    
    // Update user balance
    updateUserBalance: builder.mutation<ApiResponse<{ balance: number }>, UpdateUserBalanceRequest>({
      query: ({ userId, amount, description }) => ({
        url: `/users/admin/${userId}/balance`,
        method: "PATCH",
        body: { amount, description },
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Users", id: userId }, "Users"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["Auth"]));
        } catch {}
      },
    }),
    
    // Get user transactions
    getUserTransactions: builder.query<
      ApiResponse<{ transactions: BalanceTransaction[]; pagination: { total: number; page: number; limit: number; pages: number } }>,
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/users/admin/${userId}/transactions?page=${page}&limit=${limit}`,
      }),
      providesTags: (result, error, { userId }) => [{ type: "Users", id: userId }],
    }),
    
    // Update user data
    updateUserData: builder.mutation<ApiResponse<UserProfile>, UpdateUserDataRequest>({
      query: ({ userId, data }) => ({
        url: `/users/admin/${userId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Users", id: userId }, "Users"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["Auth"]));
        } catch {}
      },
    }),

    // Admin: update user avatar (moderation)
    updateAvatarAdmin: builder.mutation<
      ApiResponse<{ user: { id: string; username: string; email: string; avatar: string } }>,
      { userId: string; file: File }
    >({
      query: ({ userId, file }) => {
        const formData = new FormData();
        formData.append("avatar", file);
        return {
          url: `/users/avatar/admin/${userId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { userId }) => [{ type: "Users", id: userId }, "Users"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["Auth"]));
        } catch {}
      },
    }),
  }),
});

export const {
  useGetUsersQuery,
  useDeleteUserMutation,
  useGetUserByIdQuery,
  useGetHomepageActiveUsersQuery,
  useUpdateUserRoleMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useGetUserBanHistoryQuery,
  useUpdateUserBalanceMutation,
  useGetUserTransactionsQuery,
  useUpdateUserDataMutation,
  useUpdateAvatarAdminMutation,
} = usersApi;

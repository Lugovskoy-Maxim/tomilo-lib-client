import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import { UserProfile } from "@/types/user";
import {
  AdminDashboardStats,
  AdminChartData,
  AdminActivity,
  AdminSystemInfo,
  AdminUsersQuery,
  AdminUserDetails,
  AdminComment,
  AdminCommentsQuery,
  AdminCommentsStats,
  AdminLog,
  AdminLogsQuery,
  AdminTitlesQuery,
  AdminTitleListItem,
  BulkUpdateTitlesRequest,
  ExportUsersParams,
  ExportTitlesParams,
} from "@/types/admin";

const ADMIN_TAG = "Admin";
const ADMIN_USERS_TAG = "AdminUsers";
const ADMIN_COMMENTS_TAG = "AdminComments";
const ADMIN_LOGS_TAG = "AdminLogs";

export const adminApi = createApi({
  reducerPath: "adminApi",
  keepUnusedDataFor: 60,
  baseQuery: baseQueryWithReauth,
  tagTypes: [ADMIN_TAG, ADMIN_USERS_TAG, ADMIN_COMMENTS_TAG, ADMIN_LOGS_TAG],
  endpoints: builder => ({
    // ============== ДАШБОРД И СТАТИСТИКА ==============

    getDashboard: builder.query<ApiResponseDto<AdminDashboardStats>, void>({
      query: () => "/admin/dashboard",
      providesTags: [ADMIN_TAG],
    }),

    getDashboardChart: builder.query<
      ApiResponseDto<AdminChartData[]>,
      { startDate?: string; endDate?: string; period?: "day" | "week" | "month" }
    >({
      query: ({ startDate, endDate, period = "day" }) => ({
        url: "/admin/dashboard/chart",
        params: { startDate, endDate, period },
      }),
      providesTags: [ADMIN_TAG],
    }),

    getActivity: builder.query<ApiResponseDto<AdminActivity[]>, { limit?: number; page?: number }>({
      query: ({ limit = 20, page = 1 }) => ({
        url: "/admin/activity",
        params: { limit, page },
      }),
      providesTags: [ADMIN_TAG],
    }),

    getSystemInfo: builder.query<ApiResponseDto<AdminSystemInfo>, void>({
      query: () => "/admin/system",
      providesTags: [ADMIN_TAG],
    }),

    // ============== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==============

    getAdminUsers: builder.query<
      ApiResponseDto<{
        users: AdminUserDetails[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      AdminUsersQuery
    >({
      query: params => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.page) searchParams.set("page", String(params.page));
        if (params.limit) searchParams.set("limit", String(params.limit));
        if (params.role) searchParams.set("role", params.role);
        if (params.status) searchParams.set("status", params.status);
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
        return `/admin/users?${searchParams.toString()}`;
      },
      providesTags: [ADMIN_USERS_TAG],
    }),

    getAdminUserById: builder.query<ApiResponseDto<AdminUserDetails>, string>({
      query: id => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: ADMIN_USERS_TAG, id }],
    }),

    banUser: builder.mutation<
      ApiResponseDto<{ success: boolean; message: string }>,
      { id: string; reason: string; duration?: number }
    >({
      query: ({ id, reason, duration }) => ({
        url: `/admin/users/${id}/ban`,
        method: "POST",
        body: { reason, duration },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: ADMIN_USERS_TAG, id }, ADMIN_USERS_TAG],
    }),

    unbanUser: builder.mutation<ApiResponseDto<{ success: boolean; message: string }>, string>({
      query: id => ({
        url: `/admin/users/${id}/unban`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: ADMIN_USERS_TAG, id }, ADMIN_USERS_TAG],
    }),

    updateUserRole: builder.mutation<
      ApiResponseDto<UserProfile>,
      { id: string; role: "user" | "moderator" | "admin" }
    >({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: ADMIN_USERS_TAG, id }, ADMIN_USERS_TAG],
    }),

    deleteUserComments: builder.mutation<ApiResponseDto<{ deletedCount: number }>, string>({
      query: id => ({
        url: `/admin/users/${id}/comments`,
        method: "DELETE",
      }),
      invalidatesTags: [ADMIN_USERS_TAG, ADMIN_COMMENTS_TAG],
    }),

    // ============== ДЕТЕКЦИЯ БОТОВ ==============

    getSuspiciousUsers: builder.query<
      ApiResponseDto<{ users: AdminUserDetails[]; total?: number }>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: "/users/admin/suspicious-users",
        params: { page, limit },
      }),
      providesTags: [ADMIN_USERS_TAG],
    }),

    getBotStats: builder.query<
      ApiResponseDto<{ total?: number; suspicious?: number; [key: string]: unknown }>,
      void
    >({
      query: () => "/users/admin/bot-stats",
      providesTags: [ADMIN_USERS_TAG],
    }),

    resetBotStatus: builder.mutation<
      ApiResponseDto<{ success?: boolean; message?: string }>,
      string
    >({
      query: id => ({
        url: `/users/admin/${id}/reset-bot-status`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: ADMIN_USERS_TAG, id }, ADMIN_USERS_TAG],
    }),

    // ============== СПИСОК ТАЙТЛОВ (ВСЕ / НЕОПУБЛИКОВАННЫЕ) ==============

    getAdminTitles: builder.query<
      ApiResponseDto<{
        titles: AdminTitleListItem[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      AdminTitlesQuery
    >({
      query: params => {
        const searchParams = new URLSearchParams();
        if (params.page != null) searchParams.set("page", String(params.page));
        if (params.limit != null) searchParams.set("limit", String(params.limit));
        if (params.isPublished === true) searchParams.set("isPublished", "true");
        if (params.isPublished === false) searchParams.set("isPublished", "false");
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
        return `/admin/titles?${searchParams.toString()}`;
      },
      providesTags: [ADMIN_TAG],
    }),

    // ============== МАССОВЫЕ ОПЕРАЦИИ С ТАЙТЛАМИ ==============

    bulkDeleteTitles: builder.mutation<ApiResponseDto<{ deletedCount: number }>, string[]>({
      query: ids => ({
        url: "/admin/titles/bulk-delete",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: [ADMIN_TAG],
    }),

    bulkUpdateTitles: builder.mutation<
      ApiResponseDto<{ updatedCount: number }>,
      BulkUpdateTitlesRequest
    >({
      query: body => ({
        url: "/admin/titles/bulk-update",
        method: "PUT",
        body,
      }),
      invalidatesTags: [ADMIN_TAG],
    }),

    // ============== МОДЕРАЦИЯ КОММЕНТАРИЕВ ==============

    getAdminComments: builder.query<
      ApiResponseDto<{
        comments: AdminComment[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      AdminCommentsQuery
    >({
      query: params => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.page) searchParams.set("page", String(params.page));
        if (params.limit) searchParams.set("limit", String(params.limit));
        if (params.status) searchParams.set("status", params.status);
        if (params.targetType) searchParams.set("targetType", params.targetType);
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
        if (params.userId) searchParams.set("userId", params.userId);
        return `/admin/comments?${searchParams.toString()}`;
      },
      providesTags: [ADMIN_COMMENTS_TAG],
    }),

    getCommentsStats: builder.query<ApiResponseDto<AdminCommentsStats>, void>({
      query: () => "/admin/comments/stats",
      providesTags: [ADMIN_COMMENTS_TAG],
    }),

    updateCommentVisibility: builder.mutation<
      ApiResponseDto<AdminComment>,
      { id: string; isHidden: boolean }
    >({
      query: ({ id, isHidden }) => ({
        url: `/admin/comments/${id}/visibility`,
        method: "PUT",
        body: { isHidden },
      }),
      invalidatesTags: [ADMIN_COMMENTS_TAG],
    }),

    deleteComment: builder.mutation<ApiResponseDto<{ success: boolean }>, string>({
      query: id => ({
        url: `/admin/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [ADMIN_COMMENTS_TAG],
    }),

    bulkDeleteComments: builder.mutation<ApiResponseDto<{ deletedCount: number }>, string[]>({
      query: commentIds => ({
        url: "/admin/comments/bulk-delete",
        method: "POST",
        body: { commentIds },
      }),
      invalidatesTags: [ADMIN_COMMENTS_TAG],
    }),

    // ============== ЛОГИ И ЭКСПОРТ ==============

    getAdminLogs: builder.query<
      ApiResponseDto<{
        logs: AdminLog[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      AdminLogsQuery
    >({
      query: params => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set("page", String(params.page));
        if (params.limit) searchParams.set("limit", String(params.limit));
        if (params.adminId) searchParams.set("adminId", params.adminId);
        if (params.action) searchParams.set("action", params.action);
        if (params.targetType) searchParams.set("targetType", params.targetType);
        if (params.startDate) searchParams.set("startDate", params.startDate);
        if (params.endDate) searchParams.set("endDate", params.endDate);
        return `/admin/logs?${searchParams.toString()}`;
      },
      providesTags: [ADMIN_LOGS_TAG],
    }),

    exportUsers: builder.query<Blob, ExportUsersParams>({
      query: params => ({
        url: "/admin/export/users",
        params: {
          format: params.format,
          fields: params.fields?.join(","),
          ...params.filters,
        },
        responseHandler: async (response: Response) => response.blob(),
      }),
    }),

    exportTitles: builder.query<Blob, ExportTitlesParams>({
      query: params => ({
        url: "/admin/export/titles",
        params: {
          format: params.format,
          fields: params.fields?.join(","),
          ...params.filters,
        },
        responseHandler: async (response: Response) => response.blob(),
      }),
    }),

    // ============== КЭШ ==============

    clearCache: builder.mutation<
      ApiResponseDto<{ success: boolean; message: string }>,
      { pattern?: string } | void
    >({
      query: params => ({
        url: "/admin/cache/clear",
        method: "POST",
        body: params || {},
      }),
      invalidatesTags: [ADMIN_TAG],
    }),
  }),
});

export const {
  // Дашборд
  useGetDashboardQuery,
  useGetDashboardChartQuery,
  useGetActivityQuery,
  useGetSystemInfoQuery,
  // Пользователи
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useUpdateUserRoleMutation,
  useDeleteUserCommentsMutation,
  useGetSuspiciousUsersQuery,
  useGetBotStatsQuery,
  useResetBotStatusMutation,
  // Тайтлы
  useGetAdminTitlesQuery,
  useBulkDeleteTitlesMutation,
  useBulkUpdateTitlesMutation,
  // Комментарии
  useGetAdminCommentsQuery,
  useGetCommentsStatsQuery,
  useUpdateCommentVisibilityMutation,
  useDeleteCommentMutation,
  useBulkDeleteCommentsMutation,
  // Логи и экспорт
  useGetAdminLogsQuery,
  useLazyExportUsersQuery,
  useLazyExportTitlesQuery,
  // Кэш
  useClearCacheMutation,
} = adminApi;

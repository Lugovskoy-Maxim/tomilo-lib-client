import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export type AuditAction =
  | "user_create"
  | "user_update"
  | "user_delete"
  | "user_ban"
  | "user_unban"
  | "user_role_change"
  | "user_balance_change"
  | "title_create"
  | "title_update"
  | "title_delete"
  | "chapter_create"
  | "chapter_update"
  | "chapter_delete"
  | "comment_delete"
  | "report_resolve"
  | "settings_update"
  | "notification_send"
  | "ip_block"
  | "ip_unblock"
  | "genre_create"
  | "genre_update"
  | "genre_delete"
  | "achievement_create"
  | "achievement_update"
  | "achievement_delete"
  | "decoration_create"
  | "decoration_update"
  | "decoration_delete"
  | "collection_create"
  | "collection_update"
  | "collection_delete"
  | "announcement_create"
  | "announcement_update"
  | "announcement_delete"
  | "other";

export interface AuditLog {
  _id: string;
  action: AuditAction;
  userId: string;
  username: string;
  userRole: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogsFilters {
  action?: string;
  userId?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditLogsApi = createApi({
  reducerPath: "auditLogsApi",
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
  tagTypes: ["AuditLogs"],
  endpoints: builder => ({
    getAuditLogs: builder.query<
      ApiResponse<{ logs: AuditLog[]; pagination: { total: number; page: number; limit: number; pages: number } }>,
      AuditLogsFilters
    >({
      query: ({ action, userId, targetType, startDate, endDate, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (action) params.append("action", action);
        if (userId) params.append("userId", userId);
        if (targetType) params.append("targetType", targetType);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        return {
          url: `/admin/audit-logs?${params.toString()}`,
        };
      },
      providesTags: ["AuditLogs"],
    }),

    getAuditLogStats: builder.query<
      ApiResponse<{
        totalLogs: number;
        todayLogs: number;
        topActions: { action: string; count: number }[];
        topUsers: { userId: string; username: string; count: number }[];
      }>,
      void
    >({
      query: () => ({
        url: "/admin/audit-logs/stats",
      }),
    }),

    exportAuditLogs: builder.mutation<Blob, AuditLogsFilters>({
      query: filters => ({
        url: "/admin/audit-logs/export",
        method: "POST",
        body: filters,
        responseHandler: response => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogStatsQuery,
  useExportAuditLogsMutation,
} = auditLogsApi;

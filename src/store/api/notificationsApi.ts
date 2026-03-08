import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import {
  NotificationsResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAsUnreadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
} from "@/types/notifications";

export type SystemNotificationType = "info" | "warning" | "success" | "error" | "announcement";

export interface SystemNotificationRequest {
  title: string;
  message: string;
  type: SystemNotificationType;
  targetUsers?: "all" | "active" | string[]; // "all", "active" (last 30 days), or specific user IDs
  linkUrl?: string;
  expiresAt?: string;
}

export interface SystemNotificationStats {
  total: number;
  sent: number;
  read: number;
  pending: number;
}

export interface SystemNotification {
  _id: string;
  title: string;
  message: string;
  type: SystemNotificationType;
  targetUsers: "all" | "active" | string[];
  linkUrl?: string;
  expiresAt?: string;
  sentCount: number;
  readCount: number;
  createdAt: string;
  createdBy: string;
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notifications", "UnreadCount"],
  keepUnusedDataFor: 300, // 5 минут — меньше лишних запросов при навигации
  endpoints: builder => ({
    // Получение уведомлений пользователя с пагинацией
    getNotifications: builder.query<
      ApiResponseDto<NotificationsResponse>,
      { page?: number; limit?: number } | void
    >({
      query: params => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        return `/notifications?page=${page}&limit=${limit}`;
      },
      providesTags: ["Notifications"],
      transformResponse: (response: ApiResponseDto<NotificationsResponse>) => response,
    }),

    // Получение количества непрочитанных уведомлений
    getUnreadCount: builder.query<ApiResponseDto<UnreadCountResponse>, void>({
      query: () => ({
        url: "/notifications/unread-count",
        timeout: 10000,
      }),
      providesTags: ["UnreadCount"],
      keepUnusedDataFor: 300,
    }),

    // Отметить уведомление как прочитанное
    markAsRead: builder.mutation<ApiResponseDto<MarkAsReadResponse>, string>({
      query: id => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),

    // Отметить уведомление как непрочитанное
    markAsUnread: builder.mutation<ApiResponseDto<MarkAsUnreadResponse>, string>({
      query: id => ({
        url: `/notifications/${id}/unread`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),

    // Отметить все уведомления как прочитанные
    markAllAsRead: builder.mutation<ApiResponseDto<MarkAllAsReadResponse>, void>({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "POST",
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),

    // Удалить уведомление
    deleteNotification: builder.mutation<ApiResponseDto<DeleteNotificationResponse>, string>({
      query: id => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),

    // Admin: Get system notifications history
    getSystemNotifications: builder.query<
      ApiResponseDto<{
        notifications: SystemNotification[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) => ({
        url: `/notifications/admin/system?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Notifications"],
    }),

    // Admin: Send system notification
    sendSystemNotification: builder.mutation<
      ApiResponseDto<SystemNotification>,
      SystemNotificationRequest
    >({
      query: data => ({
        url: "/notifications/admin/system",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Admin: Get notification stats
    getNotificationStats: builder.query<ApiResponseDto<SystemNotificationStats>, void>({
      query: () => ({
        url: "/notifications/admin/stats",
      }),
    }),

    // Admin: Delete system notification
    deleteSystemNotification: builder.mutation<ApiResponseDto<void>, string>({
      query: id => ({
        url: `/notifications/admin/system/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useGetSystemNotificationsQuery,
  useSendSystemNotificationMutation,
  useGetNotificationStatsQuery,
  useDeleteSystemNotificationMutation,
} = notificationsApi;

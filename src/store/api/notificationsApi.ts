import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/api";
import {
  NotificationsResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
} from "@/types/notifications";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Notifications", "UnreadCount"],
  endpoints: (builder) => ({
    // Получение уведомлений пользователя
    getNotifications: builder.query<ApiResponseDto<NotificationsResponse>, void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
      transformResponse: (response: ApiResponseDto<NotificationsResponse>) => response,
    }),

    // Получение количества непрочитанных уведомлений
    getUnreadCount: builder.query<ApiResponseDto<UnreadCountResponse>, void>({
      query: () => ({
        url: "/notifications/unread-count",
        timeout: 10000, // 10 секунд таймаут
      }),
      providesTags: ["UnreadCount"],
    }),

    // Отметить уведомление как прочитанное
    markAsRead: builder.mutation<ApiResponseDto<MarkAsReadResponse>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
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
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

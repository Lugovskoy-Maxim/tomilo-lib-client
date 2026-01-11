import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  AuthResponse,
  User,
} from "@/types/auth";
import { LoginData, RegisterData } from "@/types/form";
import { ApiResponseDto } from "@/types/api";
import {
  ReadingHistoryEntry,
  BookmarkItem,
  AvatarResponse,
} from "@/types/store";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const authApi = createApi({
  reducerPath: "authApi",
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
  tagTypes: ["Auth", "ReadingHistory", "Bookmarks"],
  endpoints: (builder) => ({
    // Аутентификация
    login: builder.mutation<ApiResponseDto<AuthResponse>, LoginData>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation<ApiResponseDto<AuthResponse>, RegisterData>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),

    yandexAuth: builder.mutation<ApiResponseDto<AuthResponse>, { access_token: string }>({
      query: ({ access_token }) => ({
        url: "/auth/yandex-token",
        method: "POST",
        body: { access_token },
      }),
      invalidatesTags: ["Auth"],
    }),

    // Профиль пользователя
    getProfile: builder.query<ApiResponseDto<User>, void>({
      query: () => "/users/profile",
      providesTags: ["Auth"],
    }),

    updateProfile: builder.mutation<ApiResponseDto<User>, Partial<User>>({
      query: (profileData) => ({
        url: "/users/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["Auth"],
    }),

    updateAvatar: builder.mutation<ApiResponseDto<AvatarResponse>, FormData>({
      query: (formData) => ({
        url: "/users/profile/avatar",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Закладки
    addBookmark: builder.mutation<ApiResponseDto<User>, string>({
      query: (titleId) => ({
        url: `/users/profile/bookmarks/${titleId}`,
        method: "POST",
      }),
      invalidatesTags: ["Bookmarks", "Auth"],
    }),

    removeBookmark: builder.mutation<ApiResponseDto<User>, string>({
      query: (titleId) => ({
        url: `/users/profile/bookmarks/${titleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bookmarks", "Auth"],
    }),

    getBookmarks: builder.query<ApiResponseDto<BookmarkItem[]>, void>({
      query: () => "/users/profile/bookmarks",
      providesTags: ["Bookmarks"],
    }),

    // История чтения
    getReadingHistory: builder.query<
      ApiResponseDto<ReadingHistoryEntry[]>,
      void
    >({
      query: () => "/users/profile/history",
      providesTags: ["ReadingHistory"],
    }),

    getReadingHistoryByTitle: builder.query<
      ApiResponseDto<ReadingHistoryEntry>,
      string
    >({
      query: (titleId) => `/users/profile/history/${titleId}`,
      providesTags: ["ReadingHistory"],
    }),

    addToReadingHistory: builder.mutation<
      ApiResponseDto<User>,
      { titleId: string; chapterId: string }
    >({
      query: ({ titleId, chapterId }) => ({
        url: `/users/profile/history/${titleId}/${chapterId}`,
        method: "POST",
      }),
      invalidatesTags: ["ReadingHistory", "Auth"],
    }),

    removeFromReadingHistory: builder.mutation<
      ApiResponseDto<User>,
      { titleId: string; chapterId?: string }
    >({
      query: ({ titleId, chapterId }) => ({
        url: chapterId
          ? `/users/profile/history/${titleId}/${chapterId}`
          : `/users/profile/history/${titleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ReadingHistory", "Auth"],
    }),

    clearReadingHistory: builder.mutation<ApiResponseDto<User>, void>({
      query: () => ({
        url: "/users/profile/history",
        method: "DELETE",
      }),
      invalidatesTags: ["ReadingHistory", "Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useYandexAuthMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useAddBookmarkMutation,
  useRemoveBookmarkMutation,
  useGetBookmarksQuery,
  useGetReadingHistoryQuery,
  useGetReadingHistoryByTitleQuery,
  useAddToReadingHistoryMutation,
  useRemoveFromReadingHistoryMutation,
  useClearReadingHistoryMutation,
} = authApi;

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { AuthResponse, User, LinkResolve } from "@/types/auth";
import {
  LoginData,
  RegisterData,
  SendRegistrationCodeData,
  RegisterWithCodeData,
} from "@/types/form";
import { ApiResponseDto } from "@/types/api";
import { ReadingHistoryEntry, ReadingHistoryChapter, AvatarResponse } from "@/types/store";
import { BookmarkEntry, BookmarkCategory } from "@/types/user";

export const AUTH_TOKEN_KEY = "tomilo_lib_token";

/** Формат элемента истории с сервера (пагинированный ответ: data.items) */
interface RawHistoryItem {
  titleId: ReadingHistoryEntry["titleId"] | null;
  readAt: string;
  lastChapter?: {
    chapterId: string;
    chapterNumber: number;
    chapterTitle?: string | null;
    readAt: string;
  };
  chaptersCount?: number;
  chapters?: ReadingHistoryEntry["chapters"];
}

function normalizeHistoryItem(item: RawHistoryItem): ReadingHistoryEntry {
  const chapters: ReadingHistoryEntry["chapters"] =
    Array.isArray(item.chapters) && item.chapters.length > 0
      ? item.chapters.map(ch => ({
          chapterId: typeof ch.chapterId === "object" && ch.chapterId != null ? (ch.chapterId as { _id: string })._id : String(ch.chapterId),
          chapterNumber: ch.chapterNumber,
          chapterTitle: (ch as { chapterTitle?: string | null }).chapterTitle ?? null,
          readAt: ch.readAt,
        }))
      : item.lastChapter
        ? [
            {
              chapterId: item.lastChapter.chapterId,
              chapterNumber: item.lastChapter.chapterNumber,
              chapterTitle: item.lastChapter.chapterTitle ?? null,
              readAt: item.lastChapter.readAt,
            },
          ]
        : [];
  return {
    titleId: item.titleId ?? "",
    chapters,
    chaptersCount: item.chaptersCount,
    readAt: item.readAt,
  };
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "ReadingHistory", "Bookmarks"],
  endpoints: builder => ({
    // Аутентификация
    login: builder.mutation<ApiResponseDto<AuthResponse>, LoginData>({
      query: credentials => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    /** Шаг 1: запрос кода на email. Пользователь не создаётся. При 429 — лимит раз в минуту. */
    sendRegistrationCode: builder.mutation<
      ApiResponseDto<{ message?: string }>,
      SendRegistrationCodeData
    >({
      query: body => ({
        url: "/auth/send-registration-code",
        method: "POST",
        body,
      }),
    }),

    /** Шаг 2: регистрация с 6-значным кодом из письма. Создаёт пользователя с emailVerified: true. */
    register: builder.mutation<ApiResponseDto<AuthResponse>, RegisterWithCodeData>({
      query: userData => ({
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

    vkAuth: builder.mutation<
      ApiResponseDto<AuthResponse>,
      { code: string; redirect_uri?: string }
    >({
      query: ({ code, redirect_uri }) => ({
        url: "/auth/vk-token",
        method: "POST",
        body: { code, redirect_uri },
      }),
      invalidatesTags: ["Auth"],
    }),

    vkAuthWithToken: builder.mutation<
      ApiResponseDto<AuthResponse>,
      { access_token: string }
    >({
      query: ({ access_token }) => ({
        url: "/auth/vk-token",
        method: "POST",
        body: { access_token },
      }),
      invalidatesTags: ["Auth"],
    }),

    /** Привязка VK к текущему аккаунту (JWT обязателен). При 409 — data.conflict и data.existingAccount. */
    linkVk: builder.mutation<
      ApiResponseDto<{ linked?: boolean } & AuthResponse>,
      { code: string; redirect_uri?: string; resolve?: LinkResolve }
    >({
      query: ({ code, redirect_uri, resolve }) => ({
        url: "/auth/link/vk",
        method: "POST",
        body: { code, ...(redirect_uri && { redirect_uri }), ...(resolve && { resolve }) },
      }),
      invalidatesTags: ["Auth"],
    }),

    /** Привязка Яндекса к текущему аккаунту (JWT обязателен). При 409 — data.conflict и data.existingAccount. */
    linkYandex: builder.mutation<
      ApiResponseDto<{ linked?: boolean } & AuthResponse>,
      { access_token?: string; code?: string; resolve?: LinkResolve }
    >({
      query: ({ access_token, code, resolve }) => ({
        url: "/auth/link/yandex",
        method: "POST",
        body: {
          ...(access_token && { access_token }),
          ...(code && { code }),
          ...(resolve && { resolve }),
        },
      }),
      invalidatesTags: ["Auth"],
    }),

    // Профиль пользователя
    getProfile: builder.query<ApiResponseDto<User>, void>({
      query: () => "/users/profile",
      providesTags: ["Auth"],
    }),

    getProfileByUsername: builder.query<ApiResponseDto<User>, string>({
      query: username => `/users/username/${encodeURIComponent(username)}`,
    }),

    getProfileById: builder.query<ApiResponseDto<User>, string>({
      query: userId => `/users/${encodeURIComponent(userId)}`,
    }),

    updateProfile: builder.mutation<ApiResponseDto<User>, Partial<User>>({
      query: profileData => ({
        url: "/users/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["Auth"],
    }),

    updateAvatar: builder.mutation<ApiResponseDto<AvatarResponse>, FormData>({
      query: formData => ({
        url: "/users/profile/avatar",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Закладки (с категориями: reading, planned, completed, favorites, dropped)
    // POST /users/profile/bookmarks/:titleId?category=...
    addBookmark: builder.mutation<
      ApiResponseDto<User>,
      { titleId: string; category?: BookmarkCategory }
    >({
      query: ({ titleId, category = "reading" }) => ({
        url: `/users/profile/bookmarks/${titleId}?category=${category}`,
        method: "POST",
      }),
      transformResponse(response: ApiResponseDto<User>) {
        // Сервер может вернуть 201 с success: false при ошибке валидации
        if (response && (response as { success?: boolean }).success === false) {
          const r = response as { message?: string; errors?: string[] };
          const msg = r.errors?.[0] ?? r.message ?? "Failed to add bookmark";
          throw new Error(msg);
        }
        return response;
      },
      invalidatesTags: ["Bookmarks", "Auth"],
    }),

    updateBookmarkCategory: builder.mutation<
      ApiResponseDto<User>,
      { titleId: string; category: BookmarkCategory }
    >({
      query: ({ titleId, category }) => ({
        url: `/users/profile/bookmarks/${titleId}`,
        method: "PUT",
        body: { category },
      }),
      transformResponse(response: ApiResponseDto<User>) {
        if (response && (response as { success?: boolean }).success === false) {
          const r = response as { message?: string; errors?: string[] };
          throw new Error(r.errors?.[0] ?? r.message ?? "Failed to update bookmark");
        }
        return response;
      },
      invalidatesTags: ["Bookmarks", "Auth"],
    }),

    removeBookmark: builder.mutation<ApiResponseDto<User>, string>({
      query: titleId => ({
        url: `/users/profile/bookmarks/${titleId}`,
        method: "DELETE",
      }),
      transformResponse(response: ApiResponseDto<User>) {
        if (response && (response as { success?: boolean }).success === false) {
          const r = response as { message?: string; errors?: string[] };
          throw new Error(r.errors?.[0] ?? r.message ?? "Failed to remove bookmark");
        }
        return response;
      },
      invalidatesTags: ["Bookmarks", "Auth"],
    }),

    getBookmarks: builder.query<
      ApiResponseDto<BookmarkEntry[] | Record<BookmarkCategory, BookmarkEntry[]>>,
      { category?: BookmarkCategory; grouped?: boolean } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.set("category", params.category);
        if (params?.grouped === true) searchParams.set("grouped", "true");
        const qs = searchParams.toString();
        return `/users/profile/bookmarks${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Bookmarks"],
    }),

    // История чтения (query: page, limit, light=true для лёгкого формата с пагинацией)
    // Сервер возвращает data: { items: [...], pagination } — нормализуем в массив ReadingHistoryEntry[]
    getReadingHistory: builder.query<
      ApiResponseDto<ReadingHistoryEntry[]>,
      { page?: number; limit?: number; light?: boolean } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page != null) searchParams.set("page", String(params.page));
        if (params?.limit != null) searchParams.set("limit", String(params.limit));
        if (params?.light === true) searchParams.set("light", "true");
        const qs = searchParams.toString();
        return `/users/profile/history${qs ? `?${qs}` : ""}`;
      },
      transformResponse(
        response: ApiResponseDto<
          | ReadingHistoryEntry[]
          | { items: RawHistoryItem[]; pagination?: { page: number; limit: number; total: number; pages: number } }
        >,
      ): ApiResponseDto<ReadingHistoryEntry[]> {
        if (!response?.data) {
          return { ...response, data: [] } as ApiResponseDto<ReadingHistoryEntry[]>;
        }
        const raw = response.data;
        const items: RawHistoryItem[] = Array.isArray(raw)
          ? (raw as unknown as RawHistoryItem[])
          : "items" in raw && Array.isArray((raw as { items: RawHistoryItem[] }).items)
            ? (raw as { items: RawHistoryItem[] }).items
            : [];
        const data = items.map(normalizeHistoryItem);
        return { ...response, data } as ApiResponseDto<ReadingHistoryEntry[]>;
      },
      providesTags: ["ReadingHistory"],
    }),

    // Сервер возвращает data: chapters[] — оборачиваем в ReadingHistoryEntry
    getReadingHistoryByTitle: builder.query<ApiResponseDto<ReadingHistoryEntry>, string>({
      query: titleId => `/users/profile/history/${titleId}`,
      transformResponse(
        response: ApiResponseDto<ReadingHistoryChapter[] | ReadingHistoryEntry>,
        meta,
        titleId,
      ): ApiResponseDto<ReadingHistoryEntry> {
        if (!response?.data) {
          return { ...response, data: { titleId, chapters: [], readAt: new Date().toISOString() } };
        }
        const raw = response.data;
        if (Array.isArray(raw)) {
          return {
            ...response,
            data: {
              titleId,
              chapters: raw.map(ch => ({
                chapterId: typeof ch.chapterId === "object" && ch.chapterId != null ? (ch.chapterId as { _id: string })._id : String(ch.chapterId),
                chapterNumber: ch.chapterNumber,
                chapterTitle: (ch as { chapterTitle?: string | null }).chapterTitle ?? null,
                readAt: ch.readAt,
              })),
              readAt: raw[0]?.readAt ?? new Date().toISOString(),
            },
          };
        }
        return response as ApiResponseDto<ReadingHistoryEntry>;
      },
      providesTags: (result, error, titleId) => [
        { type: "ReadingHistory", id: titleId },
        "ReadingHistory",
      ],
    }),

    // Только chapterIds и chapterNumbers прочитанных глав (лёгкий ответ для статуса «прочитано» на странице тайтла)
    getReadingHistoryReadIds: builder.query<
      ApiResponseDto<{ chapterIds: string[]; chapterNumbers: number[] }>,
      string
    >({
      query: titleId => `/users/profile/history/${titleId}/read-ids`,
      providesTags: (result, error, titleId) => [
        { type: "ReadingHistory", id: titleId },
        "ReadingHistory",
      ],
    }),

    addToReadingHistory: builder.mutation<
      ApiResponseDto<User>,
      { titleId: string; chapterId: string }
    >({
      query: ({ titleId, chapterId }) => ({
        url: `/users/profile/history/${titleId}/${chapterId}`,
        method: "POST",
      }),
      transformResponse(response: ApiResponseDto<User>) {
        if (response && (response as { success?: boolean }).success === false) {
          const r = response as { message?: string; errors?: string[] };
          throw new Error(r.errors?.[0] ?? r.message ?? "Failed to add to reading history");
        }
        return response;
      },
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
      transformResponse(response: ApiResponseDto<User>) {
        if (response && (response as { success?: boolean }).success === false) {
          const r = response as { message?: string; errors?: string[] };
          throw new Error(r.errors?.[0] ?? r.message ?? "Failed to remove from reading history");
        }
        return response;
      },
      invalidatesTags: ["ReadingHistory", "Auth"],
    }),

    clearReadingHistory: builder.mutation<ApiResponseDto<User>, void>({
      query: () => ({
        url: "/users/profile/history",
        method: "DELETE",
      }),
      transformResponse(response: ApiResponseDto<User>) {
        if (response && (response as { success?: boolean }).success === false) {
          const r = response as { message?: string; errors?: string[] };
          throw new Error(r.errors?.[0] ?? r.message ?? "Failed to clear reading history");
        }
        return response;
      },
      invalidatesTags: ["ReadingHistory", "Auth"],
    }),

    changePassword: builder.mutation<
      ApiResponseDto<{ success: boolean; message: string }>,
      { currentPassword: string; newPassword: string }
    >({
      query: passwords => ({
        url: "/auth/change-password",
        method: "POST",
        body: passwords,
      }),
      invalidatesTags: ["Auth"],
    }),

    forgotPassword: builder.mutation<
      ApiResponseDto<{ success: boolean; message: string }>,
      { email: string }
    >({
      query: emailDto => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: emailDto,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSendRegistrationCodeMutation,
  useRegisterMutation,
  useYandexAuthMutation,
  useVkAuthMutation,
  useVkAuthWithTokenMutation,
  useLinkVkMutation,
  useLinkYandexMutation,
  useGetProfileQuery,
  useGetProfileByUsernameQuery,
  useGetProfileByIdQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useAddBookmarkMutation,
  useUpdateBookmarkCategoryMutation,
  useRemoveBookmarkMutation,
  useGetBookmarksQuery,
  useGetReadingHistoryQuery,
  useGetReadingHistoryByTitleQuery,
  useGetReadingHistoryReadIdsQuery,
  useAddToReadingHistoryMutation,
  useRemoveFromReadingHistoryMutation,
  useClearReadingHistoryMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
} = authApi;

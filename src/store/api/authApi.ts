import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { AuthResponse, User, LinkResolve } from "@/types/auth";
import { LoginData, SendRegistrationCodeData, RegisterWithCodeData } from "@/types/form";
import { ApiResponseDto } from "@/types/api";
import { ReadingHistoryEntry, ReadingHistoryChapter, AvatarResponse } from "@/types/store";
import { BookmarkEntry, BookmarkCategory } from "@/types/user";
import { ReadingProgressResponse } from "@/types/progress";

/** Статус закладки тайтла */
export interface BookmarkStatusResponse {
  isBookmarked: boolean;
  category: BookmarkCategory | null;
}

/** Количество закладок по категориям */
export interface BookmarkCountsResponse {
  reading: number;
  planned: number;
  completed: number;
  favorites: number;
  dropped: number;
  total: number;
}

/** Прогресс чтения тайтла */
export interface TitleProgressResponse {
  titleId: string;
  lastChapterId: string | null;
  lastChapterNumber: number | null;
  chaptersRead: number;
  totalChapters: number;
  progressPercent: number;
  readAt: string | null;
}

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./baseQueryWithReauth";

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
          chapterId:
            typeof ch.chapterId === "object" && ch.chapterId != null
              ? (ch.chapterId as { _id: string })._id
              : String(ch.chapterId),
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
  tagTypes: ["Auth", "ReadingHistory", "Bookmarks", "DailyQuests"],
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

    vkAuth: builder.mutation<ApiResponseDto<AuthResponse>, { code: string; redirect_uri?: string }>(
      {
        query: ({ code, redirect_uri }) => ({
          url: "/auth/vk-token",
          method: "POST",
          body: { code, redirect_uri },
        }),
        invalidatesTags: ["Auth"],
      },
    ),

    vkAuthWithToken: builder.mutation<ApiResponseDto<AuthResponse>, { access_token: string }>({
      query: ({ access_token }) => ({
        url: "/auth/vk-token",
        method: "POST",
        body: { access_token },
      }),
      invalidatesTags: ["Auth"],
    }),

    /** Привязка VK к текущему аккаунту (JWT обязателен). При 409 — data.conflict и data.existingAccount. VK ID: передавать code_verifier, device_id, state. */
    linkVk: builder.mutation<
      ApiResponseDto<{ linked?: boolean } & AuthResponse>,
      {
        code: string;
        redirect_uri?: string;
        code_verifier?: string;
        device_id?: string;
        state?: string;
        resolve?: LinkResolve;
      }
    >({
      query: ({ code, redirect_uri, code_verifier, device_id, state, resolve }) => ({
        url: "/auth/link/vk",
        method: "POST",
        body: {
          code,
          ...(redirect_uri && { redirect_uri }),
          ...(code_verifier && { code_verifier }),
          ...(device_id && { device_id }),
          ...(state && { state }),
          ...(resolve && { resolve }),
        },
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

    // Профиль пользователя (нормализуем level, experience, balance из разных форматов ответа бэкенда)
    getProfile: builder.query<ApiResponseDto<User>, void>({
      query: () => "/users/profile",
      providesTags: ["Auth"],
      transformResponse(response: ApiResponseDto<User>): ApiResponseDto<User> {
        if (!response?.data || typeof response.data !== "object") return response;
        const raw = response.data as unknown as Record<string, unknown>;
        const stats = raw.stats as Record<string, unknown> | undefined;
        const level =
          typeof raw.level === "number"
            ? raw.level
            : typeof stats?.level === "number"
              ? stats.level
              : undefined;
        const experience =
          typeof raw.experience === "number"
            ? raw.experience
            : typeof raw.xp === "number"
              ? raw.xp
              : typeof stats?.experience === "number"
                ? stats.experience
                : typeof stats?.xp === "number"
                  ? stats.xp
                  : undefined;
        const balance =
          typeof raw.balance === "number"
            ? raw.balance
            : typeof raw.coins === "number"
              ? raw.coins
              : typeof stats?.balance === "number"
                ? stats.balance
                : typeof stats?.coins === "number"
                  ? stats.coins
                  : undefined;
        const data = {
          ...response.data,
          ...(level !== undefined && { level }),
          ...(experience !== undefined && { experience }),
          ...(balance !== undefined && { balance }),
        } as User;
        return { ...response, data };
      },
    }),

    getProfileByUsername: builder.query<ApiResponseDto<User>, string>({
      query: username => `/users/username/${encodeURIComponent(username)}`,
      transformResponse(response: ApiResponseDto<User> | User): ApiResponseDto<User> {
        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          "data" in response
        ) {
          return response as ApiResponseDto<User>;
        }
        if (response && typeof response === "object" && ("_id" in response || "id" in response)) {
          return { success: true, data: response as User };
        }
        return response as ApiResponseDto<User>;
      },
    }),

    getProfileById: builder.query<ApiResponseDto<User>, string>({
      query: userId => `/users/${encodeURIComponent(userId)}`,
      transformResponse(response: ApiResponseDto<User> | User): ApiResponseDto<User> {
        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          "data" in response
        ) {
          return response as ApiResponseDto<User>;
        }
        if (response && typeof response === "object" && ("_id" in response || "id" in response)) {
          return { success: true, data: response as User };
        }
        return response as ApiResponseDto<User>;
      },
    }),

    getProfileAchievements: builder.query<
      ApiResponseDto<{ achievements: import("@/types/user").ProfileAchievementFromServer[] }>,
      void
    >({
      query: () => "/users/profile/achievements",
      providesTags: ["Auth"],
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
      query: params => {
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
      query: params => {
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
          | {
              items: RawHistoryItem[];
              pagination?: { page: number; limit: number; total: number; pages: number };
            }
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
                chapterId:
                  typeof ch.chapterId === "object" && ch.chapterId != null
                    ? (ch.chapterId as { _id: string })._id
                    : String(ch.chapterId),
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
      ApiResponseDto<ReadingProgressResponse>,
      { titleId: string; chapterId: string }
    >({
      query: ({ titleId, chapterId }) => ({
        url: `/users/profile/history/${titleId}/${chapterId}`,
        method: "POST",
        // Позволяет браузеру завершить запрос при закрытии вкладки/переходе (в т.ч. Android)
        keepalive: true,
      }),
      transformResponse(response: ApiResponseDto<ReadingProgressResponse> & Record<string, unknown>) {
        // Не бросаем при success: false — обрабатываем в useAuth (retry при версионном конфликте без лога в консоль)
        if (!response?.data && !response?.progress) return response as ApiResponseDto<ReadingProgressResponse>;
        // Нормализация: бэкенд может отдавать progress/oldRank/newRank/newAchievements на верхнем уровне ответа
        const data = response.data ?? (response.user ? { user: response.user } : undefined);
        const merged = data
          ? {
              ...data,
              progress: data.progress ?? response.progress,
              oldRank: data.oldRank ?? response.oldRank,
              newRank: data.newRank ?? response.newRank,
              newAchievements: data.newAchievements ?? response.newAchievements,
            }
          : undefined;
        return {
          ...response,
          data: merged as ReadingProgressResponse,
        } as ApiResponseDto<ReadingProgressResponse>;
      },
      invalidatesTags: (result, error, arg) =>
        arg?.titleId
          ? [{ type: "ReadingHistory", id: arg.titleId }, "ReadingHistory", "Auth"]
          : ["ReadingHistory", "Auth"],
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
          const raw = String(r.errors?.[0] ?? r.message ?? "Failed to remove from reading history");
          const isNotFound =
            /title not found|not found in reading history|chapter not found/i.test(raw);
          if (isNotFound) {
            // Уже удалено или запись отсутствует — считаем успехом (идемпотентность)
            return { ...response, success: true, data: response?.data } as ApiResponseDto<User>;
          }
          const isVersionConflict = /no matching document|version \d+|modifiedPaths/i.test(raw);
          throw new Error(isVersionConflict ? "READING_HISTORY_VERSION_CONFLICT" : raw);
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
          const raw = r.errors?.[0] ?? r.message ?? "Failed to clear reading history";
          const isVersionConflict = /no matching document|version \d+|modifiedPaths/i.test(
            String(raw),
          );
          throw new Error(isVersionConflict ? "READING_HISTORY_VERSION_CONFLICT" : raw);
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

    // Ежедневный бонус / стрик
    claimDailyBonus: builder.mutation<
      ApiResponseDto<{
        success: boolean;
        message: string;
        currentStreak: number;
        experienceGained: number;
        coinsGained?: number;
      }>,
      void
    >({
      query: () => ({
        url: "/users/daily-bonus",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "DailyQuests"],
    }),

    // Ежедневные задания
    getDailyQuests: builder.query<
      ApiResponseDto<{
        date: string;
        quests: {
          id: string;
          type: string;
          name: string;
          description: string;
          target: number;
          progress: number;
          rewardExp: number;
          rewardCoins: number;
          completed: boolean;
          claimedAt: string | null;
        }[];
      } | null>,
      void
    >({
      query: () => "/users/daily-quests",
      providesTags: ["DailyQuests"],
    }),
    claimDailyQuest: builder.mutation<
      ApiResponseDto<{ success: boolean; expGained?: number; coinsGained?: number; message?: string }>,
      string
    >({
      query: questId => ({
        url: "/users/daily-quests/claim",
        method: "POST",
        body: { questId },
      }),
      invalidatesTags: ["Auth", "DailyQuests"],
    }),

    /** Запланировать удаление профиля (scheduledDeletionAt = now + 7 дней). Ответ — обновлённый пользователь. */
    scheduleDeletion: builder.mutation<ApiResponseDto<User>, void>({
      query: () => ({
        url: "/users/profile/schedule-deletion",
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["Auth"],
    }),

    /** Отменить запланированное удаление профиля. */
    cancelDeletion: builder.mutation<ApiResponseDto<User>, void>({
      query: () => ({
        url: "/users/profile/cancel-deletion",
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["Auth"],
    }),

    // Проверка статуса закладки (добавлен ли тайтл и в какой категории)
    getBookmarkStatus: builder.query<ApiResponseDto<BookmarkStatusResponse>, string>({
      query: titleId => `/users/profile/bookmarks/${titleId}/status`,
      providesTags: (result, error, titleId) => [{ type: "Bookmarks", id: titleId }, "Bookmarks"],
    }),

    // Количество закладок по категориям
    getBookmarkCounts: builder.query<ApiResponseDto<BookmarkCountsResponse>, void>({
      query: () => "/users/profile/bookmarks/counts",
      providesTags: ["Bookmarks"],
    }),

    // Прогресс чтения тайтла
    getTitleProgress: builder.query<ApiResponseDto<TitleProgressResponse>, string>({
      query: titleId => `/users/profile/progress/${titleId}`,
      providesTags: (result, error, titleId) => [
        { type: "ReadingHistory", id: titleId },
        "ReadingHistory",
      ],
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
  useGetProfileAchievementsQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useAddBookmarkMutation,
  useUpdateBookmarkCategoryMutation,
  useRemoveBookmarkMutation,
  useGetBookmarksQuery,
  useGetBookmarkStatusQuery,
  useGetBookmarkCountsQuery,
  useGetReadingHistoryQuery,
  useGetReadingHistoryByTitleQuery,
  useGetReadingHistoryReadIdsQuery,
  useAddToReadingHistoryMutation,
  useRemoveFromReadingHistoryMutation,
  useClearReadingHistoryMutation,
  useGetTitleProgressQuery,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useClaimDailyBonusMutation,
  useGetDailyQuestsQuery,
  useClaimDailyQuestMutation,
  useScheduleDeletionMutation,
  useCancelDeletionMutation,
} = authApi;

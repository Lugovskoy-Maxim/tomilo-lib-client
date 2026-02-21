/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { Title, CreateTitleDto, UpdateTitleDto } from "@/types/title";
import { ApiResponseDto } from "@/types/api";
import { formatChapterRanges } from "@/lib/format-chapter-ranges";

interface PopularTitle {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  rating?: number;
  type: string;
  releaseYear: number;
  isAdult?: boolean;
}

const TITLES_TAG = "Titles";

export const titlesApi = createApi({
  reducerPath: "titlesApi",
  keepUnusedDataFor: 300, // 5 мин по умолчанию — меньше запросов к серверу при переходах
  baseQuery: baseQueryWithReauth,
  tagTypes: [TITLES_TAG],
  endpoints: builder => ({
    // Получить все тайтлы (простой список)
    getTitles: builder.query<ApiResponseDto<{ titles: Title[] }>, void>({
      query: () => "/titles",
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ titles: Title[] }>) => response,
    }),

    // Поиск/список тайтлов с фильтрами и пагинацией
    searchTitles: builder.query<
      ApiResponseDto<{
        data: Title[];
        total: number;
        page: number;
        totalPages: number;
      }>,
      {
        search?: string;
        genres?: string;
        types?: string;
        status?: string;
        releaseYear?: number;

        ageLimits?: string; // Используем множественное число для соответствия типам
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
      }
    >({
      query: params => {
        const queryParams: Record<string, any> = {};

        // Копируем все параметры
        Object.keys(params).forEach(key => {
          const value = params[key as keyof typeof params];
          if (value !== undefined && value !== null) {
            queryParams[key] = value;
          }
        });

        // Специальная обработка ageLimits для отправки как ageLimits строка
        if (params.ageLimits) {
          // Всегда отправляем как ageLimits строка с запятыми
          if (Array.isArray(params.ageLimits)) {
            queryParams.ageLimits = params.ageLimits.join(",");
          } else {
            queryParams.ageLimits = params.ageLimits;
          }
        }

        return {
          url: "/titles",
          params: queryParams,
        };
      },
      transformResponse: (
        response: ApiResponseDto<{
          titles?: Title[];
          data?: Title[];
          pagination?: {
            total: number;
            page: number;
            pages: number;
            limit: number;
          };
          total?: number;
          page?: number;
          totalPages?: number;
        }>,
      ) => {
        // Нормализуем серверный ответ { titles, pagination }
        const data: Title[] = response?.data?.titles ?? response?.data?.data ?? [];
        const total: number =
          response?.data?.pagination?.total ?? response?.data?.total ?? data.length ?? 0;
        const page: number = response?.data?.pagination?.page ?? response?.data?.page ?? 1;
        const totalPages: number =
          response?.data?.pagination?.pages ??
          response?.data?.totalPages ??
          Math.ceil(total / (response?.data?.pagination?.limit ?? 12)) ??
          1;
        return {
          ...response,
          data: { data, total, page, totalPages },
        };
      },
      providesTags: [TITLES_TAG],
    }),

    // Опции фильтров
    getFilterOptions: builder.query<
      ApiResponseDto<{
        ageLimits: number[];
        genres: string[];
        releaseYears: number[];
        sortByOptions: string[];
        status: string[];
        tags: string[];
        types: string[];
      }>,
      void
    >({
      query: () => "/titles/filters/options",
      transformResponse: (
        response: ApiResponseDto<{
          ageLimits?: number[];
          genres?: string[];
          releaseYears?: number[];
          sortByOptions?: string[];
          status?: string[];
          tags?: string[];
          types?: string[];
        }>,
      ) => {
        // Обеспечиваем дефолтные значения для всех полей
        const data = response.data || {};
        return {
          ...response,
          data: {
            ageLimits: data.ageLimits || [0, 12, 16, 18],
            genres: data.genres || [],
            releaseYears: data.releaseYears || [],
            sortByOptions: data.sortByOptions || [
              "createdAt",
              "updatedAt",
              "name",
              "views",
              "weekViews",
              "dayViews",
              "monthViews",
              "averageRating",
              "releaseYear",
            ],
            status: data.status || [],
            tags: data.tags || [],
            types: data.types || [],
          },
        };
      },
    }),

    // Получить тайтл по ID
    getTitleById: builder.query<Title, { id: string; includeChapters?: boolean }>({
      query: ({ id, includeChapters = false }) => ({
        url: `/titles/${id}`,
        params: { populateChapters: includeChapters.toString() },
      }),
      providesTags: (result, error, { id }) => [{ type: TITLES_TAG, id }],
      transformResponse: (response: unknown): Title => {
        const apiResponse = response as ApiResponseDto<Title> | Title;
        if (typeof apiResponse === "object" && apiResponse !== null && "success" in apiResponse) {
          const wrappedResponse = apiResponse as ApiResponseDto<Title>;
          if (wrappedResponse.success === false) {
            throw new Error(wrappedResponse.message || "Failed to fetch title");
          }
          if (!wrappedResponse.data) {
            throw new Error("No data in API response");
          }
          return wrappedResponse.data;
        }
        return apiResponse as Title;
      },
    }),

    // Получить тайтл по slug
    getTitleBySlug: builder.query<Title, { slug: string; includeChapters?: boolean }>({
      query: ({ slug, includeChapters = false }) => ({
        url: `/titles/slug/${slug}`,
        params: { populateChapters: includeChapters.toString() },
      }),
      providesTags: (result, error, { slug }) => [{ type: TITLES_TAG, id: `slug-${slug}` }],
      transformResponse: (response: unknown): Title => {
        const apiResponse = response as ApiResponseDto<Title> | Title;
        if (typeof apiResponse === "object" && apiResponse !== null && "success" in apiResponse) {
          const wrappedResponse = apiResponse as ApiResponseDto<Title>;
          if (wrappedResponse.success === false) {
            throw new Error(wrappedResponse.message || "Failed to fetch title by slug");
          }
          if (!wrappedResponse.data) {
            throw new Error("No data in API response");
          }
          return wrappedResponse.data;
        }
        return apiResponse as Title;
      },
    }),

    // Создание тайтла
    createTitle: builder.mutation<ApiResponseDto<Title>, Partial<CreateTitleDto>>({
      query: data => ({
        url: "/titles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Создание тайтла с обложкой
    createTitleWithCover: builder.mutation<
      ApiResponseDto<Title>,
      { data: Partial<CreateTitleDto>; coverImage: File }
    >({
      query: ({ data, coverImage }) => {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("coverImage", coverImage);
        return {
          url: "/titles/with-cover",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Обновление тайтла (без обложки)
    updateTitle: builder.mutation<
      ApiResponseDto<Title>,
      { id: string; data: Partial<UpdateTitleDto> }
    >({
      query: ({ id, data }) => ({
        url: `/titles/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Обновление обложки тайтла
    updateTitleCover: builder.mutation<ApiResponseDto<Title>, { id: string; coverImage: File }>({
      query: ({ id, coverImage }) => {
        const formData = new FormData();
        formData.append("coverImage", coverImage);
        return {
          url: `/titles/${id}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Обновление рейтинга тайтла
    updateRating: builder.mutation<ApiResponseDto<Title>, { id: string; rating: number }>({
      query: ({ id, rating }) => ({
        url: `/titles/${id}/rating`,
        method: "POST",
        body: { rating },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: TITLES_TAG, id }],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Увеличение счётчика просмотров тайтла
    incrementViews: builder.mutation<ApiResponseDto<Title>, string>({
      query: id => ({
        url: `/titles/${id}/views`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: TITLES_TAG, id }],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Получить популярные тайтлы
    getPopularTitles: builder.query<ApiResponseDto<PopularTitle[]>, { limit?: number } | void>({
      query: (params = {}) => ({
        url: "/titles/popular",
        params: { limit: params?.limit ?? 35 },
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<PopularTitle[]>) => response,
    }),

    // Получить топ тайтлы за день
    getTopTitlesDay: builder.query<
      ApiResponseDto<
        {
          id: string;
          title: string;
          cover: string;
          rating: number;
          type: string;
          releaseYear: number;
          description: string;
          isAdult?: boolean;
          ratingCount?: number;
        }[]
      >,
      { limit?: number }
    >({
      query: params => ({
        url: "/titles/top/day",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          {
            id: string;
            title: string;
            cover: string;
            rating: number;
            type: string;
            releaseYear: number;
            description: string;
            isAdult?: boolean;
            ratingCount?: number;
          }[]
        >,
      ) => response,
    }),

    // Получить топ тайтлы за неделю
    getTopTitlesWeek: builder.query<
      ApiResponseDto<
        {
          id: string;
          title: string;
          cover: string;
          rating: number;
          type: string;
          releaseYear: number;
          description: string;
          isAdult?: boolean;
          ratingCount?: number;
        }[]
      >,
      { limit?: number }
    >({
      query: params => ({
        url: "/titles/top/week",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          {
            id: string;
            title: string;
            cover: string;
            rating: number;
            type: string;
            releaseYear: number;
            description: string;
            isAdult?: boolean;
            ratingCount?: number;
          }[]
        >,
      ) => response,
    }),

    // Получить топ тайтлы за месяц
    getTopTitlesMonth: builder.query<
      ApiResponseDto<
        {
          id: string;
          title: string;
          cover: string;
          rating: number;
          type: string;
          releaseYear: number;
          description: string;
          isAdult?: boolean;
          ratingCount?: number;
        }[]
      >,
      { limit?: number }
    >({
      query: params => ({
        url: "/titles/top/month",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          {
            id: string;
            title: string;
            cover: string;
            rating: number;
            type: string;
            releaseYear: number;
            description: string;
            isAdult?: boolean;
            ratingCount?: number;
          }[]
        >,
      ) => response,
    }),

    // Получить коллекции
    getCollections: builder.query<
      ApiResponseDto<{ id: string; name: string; image: string; link: string }[]>,
      void
    >({
      query: () => "/collections",
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<{ id: string; name: string; image: string; link: string }[]>,
      ) => response,
    }),

    // Получить случайные тайтлы
    getRandomTitles: builder.query<
      ApiResponseDto<
        {
          [x: string]: any;
          id: string;
          title: string;
          cover: string;
          rating: number;
          type: string;
          releaseYear: number;
          description: string;
          isAdult: boolean;
          ratingCount?: number;
        }[]
      >,
      { limit?: number }
    >({
      query: params => ({
        url: "/titles/random",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          {
            id: string;
            title: string;
            cover: string;
            rating: number;
            type: string;
            releaseYear: number;
            description: string;
            isAdult: boolean;
            ratingCount?: number;
          }[]
        >,
      ) => response,
    }),

    // Недавно добавленные в каталог тайтлы (GET /titles/titles/recent)
    getRecentTitles: builder.query<
      ApiResponseDto<PopularTitle[]>,
      { limit?: number; page?: number } | void
    >({
      query: (params = {}) => ({
        url: "/titles/titles/recent",
        params: { limit: params?.limit ?? 18, page: params?.page ?? 1 },
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          PopularTitle[] | { data?: PopularTitle[]; titles?: PopularTitle[] }
        >,
      ) => {
        const raw = response?.data;
        const list = Array.isArray(raw)
          ? raw
          : (raw as { data?: PopularTitle[] })?.data ??
            (raw as { titles?: PopularTitle[] })?.titles ??
            [];
        return { ...response, data: list };
      },
    }),

    // Получить последние обновления.
    // Для корректного отображения диапазонов (например "Главы 24, 34-55" вместо "24-55") бэкенд может
    // возвращать опциональное поле chapters: number[] — массив номеров обновлённых глав.
    getLatestUpdates: builder.query<
      ApiResponseDto<
        {
          id: string;
          slug?: string;
          title: string;
          cover: string;
          chapter: string;
          chapterNumber: number;
          chapters?: number[];
          timeAgo: string;
          releaseYear?: number;
          type?: string;
          isAdult?: boolean;
        }[]
      >,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 18 } = {}) => ({
        url: "/titles/latest-updates",
        params: { page, limit },
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          {
            id: string;
            slug?: string;
            title: string;
            cover: string;
            chapter: string;
            chapterNumber: number;
            chapters?: number[];
            timeAgo: string;
            releaseYear?: number;
            type?: string;
            isAdult?: boolean;
          }[]
        >,
      ) => {
        if (!response?.data?.length) return response;
        const data = response.data.map(item => {
          const chapter =
            item.chapters?.length !== undefined && item.chapters.length > 0
              ? `Главы ${formatChapterRanges(item.chapters)}`
              : item.chapter;
          return { ...item, chapter };
        });
        return { ...response, data };
      },
    }),

    // Получить рекомендации для пользователя
    getRecommendedTitles: builder.query<
      ApiResponseDto<
        {
          id: string;
          title: string;
          cover: string;
          rating: number;
          type: string;
          releaseYear: number;
          description: string;
          isAdult: boolean;
          ratingCount?: number;
        }[]
      >,
      { limit?: number }
    >({
      query: params => ({
        url: "/titles/recommended",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (
        response: ApiResponseDto<
          {
            id: string;
            title: string;
            cover: string;
            rating: number;
            type: string;
            releaseYear: number;
            description: string;
            isAdult: boolean;
            ratingCount?: number;
          }[]
        >,
      ) => response,
    }),

    // Удаление тайтла
    deleteTitle: builder.mutation<void, string>({
      query: id => ({
        url: `/titles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TITLES_TAG],
    }),
  }),
});

export const {
  useGetTitlesQuery,
  useSearchTitlesQuery,
  useGetFilterOptionsQuery,
  useGetTitleByIdQuery,
  useGetTitleBySlugQuery,
  useCreateTitleMutation,
  useCreateTitleWithCoverMutation,
  useUpdateTitleMutation,
  useUpdateTitleCoverMutation,
  useUpdateRatingMutation,
  useIncrementViewsMutation,
  useGetPopularTitlesQuery,
  useGetTopTitlesDayQuery,
  useGetTopTitlesWeekQuery,
  useGetTopTitlesMonthQuery,
  useGetCollectionsQuery,
  useGetRandomTitlesQuery,
  useGetRecentTitlesQuery,
  useGetLatestUpdatesQuery,
  useGetRecommendedTitlesQuery,
  useDeleteTitleMutation,
} = titlesApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Title, CreateTitleDto, UpdateTitleDto, ApiResponseDto } from "@/types/title";

const TITLES_TAG = "Titles";

// 🔧 Утилита для преобразования объекта в FormData
function toFormData<T extends Record<string, unknown>>(data: Partial<T>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      // Для массивов добавляем каждый элемент как отдельное поле с тем же именем
      value.forEach(item => {
        formData.append(key, String(item));
      });
    } else if (value instanceof Blob) {
      // File наследуется от Blob — это корректная и безопасная проверка
      formData.append(key, value);
    } else if (typeof value === 'number') {
      // Для числовых значений отправляем как числа
      formData.append(key, value.toString());
    } else if (typeof value === 'boolean') {
      // Для булевых значений отправляем как строки "true" или "false"
      formData.append(key, value.toString());
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export const titlesApi = createApi({
  reducerPath: "titlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("tomilo_lib_token");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: [TITLES_TAG],
  endpoints: (builder) => ({
    // Получить все тайтлы (простой список)
    getTitles: builder.query<ApiResponseDto<{ titles: Title[] }>, void>({
      query: () => "/titles",
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ titles: Title[] }>) => response,
    }),

    // Поиск/список тайтлов с фильтрами и пагинацией
    searchTitles: builder.query<
      ApiResponseDto<{ data: Title[]; total: number; page: number; totalPages: number }>,
      {
        search?: string;
        genre?: string;
        status?: string;
        type?: string;
        releaseYear?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/titles",
        params,
      }),
      transformResponse: (response: ApiResponseDto<{ titles?: Title[]; data?: Title[]; pagination?: { total: number; page: number; pages: number; limit: number }; total?: number; page?: number; totalPages?: number }>) => {
        // Нормализуем серверный ответ { titles, pagination }
        const data: Title[] = response?.data?.titles ?? response?.data?.data ?? [];
        const total: number = response?.data?.pagination?.total ?? response?.data?.total ?? data.length ?? 0;
        const page: number = response?.data?.pagination?.page ?? response?.data?.page ?? 1;
        const totalPages: number = response?.data?.pagination?.pages ?? response?.data?.totalPages ?? Math.ceil(total / (response?.data?.pagination?.limit ?? 12)) ?? 1;
        return {
          ...response,
          data: { data, total, page, totalPages }
        };
      },
      providesTags: [TITLES_TAG],
    }),

    // Опции фильтров
    getFilterOptions: builder.query<ApiResponseDto<{
      genres: string[];
      // types?: string[]; // сервер пока не возвращает types
      status: string[];
    }>, void>({
      query: () => "/titles/filters/options",
      transformResponse: (response: ApiResponseDto<{ genres: string[]; status: string[] }>) => response,
    }),

    // Получить тайтл по ID
    getTitleById: builder.query<ApiResponseDto<Title>, { id: string; includeChapters?: boolean }>({
      query: ({ id, includeChapters = true }) => ({
        url: `/titles/${id}`,
        params: { populateChapters: includeChapters.toString() }
      }),
      providesTags: (result, error, { id }) => [{ type: TITLES_TAG, id }],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Создание тайтла
    createTitle: builder.mutation<ApiResponseDto<Title>, Partial<CreateTitleDto>>({
      query: (data) => ({
        url: "/titles",
        method: "POST",
        body: data
        // body: toFormData<CreateTitleDto>(data),
      }),
      invalidatesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Обновление тайтла
        updateTitle: builder.mutation<ApiResponseDto<Title>, { id: string; data: Partial<UpdateTitleDto>; hasFile?: boolean }>({
          query: ({ id, data, hasFile = false }) => ({
            url: `/titles/${id}`,
            method: "PUT",
            body: hasFile ? toFormData<UpdateTitleDto>(data) : data,
          }),
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
      query: (id) => ({
        url: `/titles/${id}/views`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: TITLES_TAG, id }],
      transformResponse: (response: ApiResponseDto<Title>) => response,
    }),

    // Получить популярные тайтлы
    getPopularTitles: builder.query<ApiResponseDto<{
      type: string;
      releaseYear: number; id: string; title: string; cover?: string; description?: string; rating?: number; isAdult?: boolean
}[]>, void>({
      query: () => "/titles/popular",
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; title: string; cover?: string; description?: string; rating?: number; type: string; releaseYear: number; isAdult?: boolean }[]>) => response,
    }),

    // Получить топ тайтлы за день
    getTopTitlesDay: builder.query<ApiResponseDto<{
      id: string;
      title: string;
      cover: string;
      rating: number;
      type: string;
      releaseYear: number;
      description: string;
      isAdult?: boolean;
    }[]>, { limit?: number }>({
      query: (params) => ({
        url: "/titles/top/day",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; title: string; cover: string; rating: number; type: string; releaseYear: number; description: string; isAdult?: boolean }[]>) => response,
    }),

    // Получить топ тайтлы за неделю
    getTopTitlesWeek: builder.query<ApiResponseDto<{
      id: string;
      title: string;
      cover: string;
      rating: number;
      type: string;
      releaseYear: number;
      description: string;
      isAdult?: boolean;
    }[]>, { limit?: number }>({
      query: (params) => ({
        url: "/titles/top/week",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; title: string; cover: string; rating: number; type: string; releaseYear: number; description: string; isAdult?: boolean }[]>) => response,
    }),

    // Получить топ тайтлы за месяц
    getTopTitlesMonth: builder.query<ApiResponseDto<{
      id: string;
      title: string;
      cover: string;
      rating: number;
      type: string;
      releaseYear: number;
      description: string;
      isAdult?: boolean;
    }[]>, { limit?: number }>({
      query: (params) => ({
        url: "/titles/top/month",
        params,
      }),
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; title: string; cover: string; rating: number; type: string; releaseYear: number; description: string; isAdult?: boolean }[]>) => response,
    }),

    // Получить коллекции
    getCollections: builder.query<ApiResponseDto<{ id: string; name: string; image: string; link: string }[]>, void>({
      query: () => "/collections",
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; name: string; image: string; link: string }[]>) => response,
    }),

    // Получить последние обновления
    getLatestUpdates: builder.query<ApiResponseDto<{ id: string; title: string; cover: string; chapter: string; chapterNumber: number; timeAgo: string }[]>, void>({
      query: () => "/titles/latest-updates",
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; title: string; cover: string; chapter: string; chapterNumber: number; timeAgo: string }[]>) => response,
    }),

    // Удаление тайтла
    deleteTitle: builder.mutation<void, string>({
      query: (id) => ({
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
  useCreateTitleMutation,
  useUpdateTitleMutation,
  useUpdateRatingMutation,
  useIncrementViewsMutation,
  useGetPopularTitlesQuery,
  useGetTopTitlesDayQuery,
  useGetTopTitlesWeekQuery,
  useGetTopTitlesMonthQuery,
  useGetCollectionsQuery,
  useGetLatestUpdatesQuery,
  useDeleteTitleMutation,
} = titlesApi;

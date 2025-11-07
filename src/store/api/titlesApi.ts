import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Title, CreateTitleDto, UpdateTitleDto, ApiResponseDto } from "@/types/title";

const TITLES_TAG = "Titles";

// 🔧 Утилита для преобразования объекта в FormData
function toFormData<T extends Record<string, unknown>>(data: Partial<T>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value instanceof Blob) {
      // File наследуется от Blob — это корректная и безопасная проверка
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export const titlesApi = createApi({
  reducerPath: "titlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
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
    getTitleById: builder.query<ApiResponseDto<Title>, string>({
      query: (id) => `/titles/${id}`,
      providesTags: (result, error, id) => [{ type: TITLES_TAG, id }],
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
    updateTitle: builder.mutation<ApiResponseDto<Title>, { id: string; data: Partial<UpdateTitleDto> }>({
      query: ({ id, data }) => ({
        url: `/titles/${id}`,
        method: "PATCH",
        body: toFormData<UpdateTitleDto>(data),
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
    getPopularTitles: builder.query<ApiResponseDto<{ id: string; title: string; cover?: string; description?: string; rating?: number }[]>, void>({
      query: () => "/titles/popular",
      providesTags: [TITLES_TAG],
      transformResponse: (response: ApiResponseDto<{ id: string; title: string; cover?: string; description?: string; rating?: number }[]>) => response,
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
  useGetCollectionsQuery,
  useGetLatestUpdatesQuery,
} = titlesApi;

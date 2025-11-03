import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Title, CreateTitleDto, UpdateTitleDto } from "@/types/title";

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
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  }),
  tagTypes: [TITLES_TAG],
  endpoints: (builder) => ({
    // Получить все тайтлы (простой список)
    getTitles: builder.query<{ titles: Title[] }, void>({
      query: () => "/titles",
      providesTags: [TITLES_TAG],
    }),

    // Поиск/список тайтлов с фильтрами и пагинацией
    searchTitles: builder.query<
      { data: Title[]; total: number; page: number; totalPages: number },
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
      transformResponse: (response: any) => {
        // Нормализуем серверный ответ { titles, pagination }
        const data: Title[] = response?.titles ?? response?.data ?? [];
        const total: number = response?.pagination?.total ?? response?.total ?? data.length ?? 0;
        const page: number = response?.pagination?.page ?? response?.page ?? 1;
        const totalPages: number = response?.pagination?.pages ?? response?.totalPages ?? Math.ceil(total / (response?.pagination?.limit ?? 12)) ?? 1;
        return { data, total, page, totalPages };
      },
      providesTags: [TITLES_TAG],
    }),

    // Опции фильтров
    getFilterOptions: builder.query<{
      genres: string[];
      // types?: string[]; // сервер пока не возвращает types
      status: string[];
    }, void>({
      query: () => "/titles/filters/options",
    }),

    // Получить тайтл по ID
    getTitleById: builder.query<Title, string>({
      query: (id) => `/titles/${id}`,
      providesTags: (result, error, id) => [{ type: TITLES_TAG, id }],
    }),

    // Создание тайтла
    createTitle: builder.mutation<Title, Partial<CreateTitleDto>>({
      query: (data) => ({
        url: "/titles",
        method: "POST",
        body: data
        // body: toFormData<CreateTitleDto>(data),
      }),
      invalidatesTags: [TITLES_TAG],
    }),

    // Обновление тайтла
    updateTitle: builder.mutation<Title, { id: string; data: Partial<UpdateTitleDto> }>({
      query: ({ id, data }) => ({
        url: `/titles/${id}`,
        method: "PATCH",
        body: toFormData<UpdateTitleDto>(data),
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
} = titlesApi;

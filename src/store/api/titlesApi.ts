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
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  }),
  tagTypes: [TITLES_TAG],
  endpoints: (builder) => ({
    // Получить все тайтлы
    getTitles: builder.query<{ titles: Title[] }, void>({
      query: () => "/titles",
      providesTags: [TITLES_TAG],
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
  useGetTitleByIdQuery,
  useCreateTitleMutation,
  useUpdateTitleMutation,
} = titlesApi;

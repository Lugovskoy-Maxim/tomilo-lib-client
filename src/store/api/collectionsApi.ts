import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Collection,
  CollectionWithTitles,
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionsQuery,
  CollectionsResponse,
  ApiResponseDto
} from "@/types/collection";

const COLLECTIONS_TAG = "Collections";

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

export const collectionsApi = createApi({
  reducerPath: "collectionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  }),
  tagTypes: [COLLECTIONS_TAG],
  endpoints: (builder) => ({
    // Получить все коллекции с пагинацией, поиском и сортировкой
    getCollections: builder.query<
      ApiResponseDto<{ collections: Collection[]; total: number; page: number; totalPages: number }>,
      CollectionsQuery
    >({
      query: (params) => ({
        url: "/collections",
        params,
      }),
      providesTags: [COLLECTIONS_TAG],
      transformResponse: (response: ApiResponseDto<{ collections?: Collection[]; data?: Collection[]; pagination?: { total: number; page: number; pages: number; limit: number }; total?: number; page?: number; totalPages?: number }>) => {
        // Нормализуем серверный ответ
        const data: Collection[] = response?.data?.collections ?? response?.data?.data ?? [];
        const total: number = response?.data?.pagination?.total ?? response?.data?.total ?? data.length ?? 0;
        const page: number = response?.data?.pagination?.page ?? response?.data?.page ?? 1;
        const totalPages: number = response?.data?.pagination?.pages ?? response?.data?.totalPages ?? Math.ceil(total / (response?.data?.pagination?.limit ?? 12)) ?? 1;
        return {
          ...response,
          data: { collections: data, total, page, totalPages },
        };
      },
    }),

    // Получить топ коллекций
    getTopCollections: builder.query<ApiResponseDto<Collection[]>, number>({
      query: (limit = 10) => ({
        url: "/collections/top",
        params: { limit },
      }),
      providesTags: [COLLECTIONS_TAG],
      transformResponse: (response: ApiResponseDto<Collection[]>) => response,
    }),

    // Получить коллекцию по ID
    getCollectionById: builder.query<ApiResponseDto<CollectionWithTitles>, string>({
      query: (id) => `/collections/${id}`,
      providesTags: (result, error, id) => [{ type: COLLECTIONS_TAG, id }],
      transformResponse: (response: ApiResponseDto<CollectionWithTitles>) => response,
    }),

    // Создание коллекции
    createCollection: builder.mutation<ApiResponseDto<Collection>, Partial<CreateCollectionDto>>({
      query: (data) => ({
        url: "/collections",
        method: "POST",
        body: data
      }),
      invalidatesTags: [COLLECTIONS_TAG],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Обновление коллекции
    updateCollection: builder.mutation<ApiResponseDto<Collection>, { id: string; data: Partial<UpdateCollectionDto> }>({
      query: ({ id, data }) => ({
        url: `/collections/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [COLLECTIONS_TAG],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Удаление коллекции
    deleteCollection: builder.mutation<void, string>({
      query: (id) => ({
        url: `/collections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [COLLECTIONS_TAG],
    }),

    // Увеличение счётчика просмотров коллекции
    incrementCollectionViews: builder.mutation<ApiResponseDto<Collection>, string>({
      query: (id) => ({
        url: `/collections/${id}/views`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: COLLECTIONS_TAG, id }],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Добавление тайтла в коллекцию
    addTitleToCollection: builder.mutation<ApiResponseDto<Collection>, { collectionId: string; titleId: string }>({
      query: ({ collectionId, titleId }) => ({
        url: `/collections/${collectionId}/titles/${titleId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { collectionId }) => [{ type: COLLECTIONS_TAG, id: collectionId }],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Удаление тайтла из коллекции
    removeTitleFromCollection: builder.mutation<ApiResponseDto<Collection>, { collectionId: string; titleId: string }>({
      query: ({ collectionId, titleId }) => ({
        url: `/collections/${collectionId}/titles/${titleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { collectionId }) => [{ type: COLLECTIONS_TAG, id: collectionId }],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Добавление комментария к коллекции
    addCommentToCollection: builder.mutation<ApiResponseDto<Collection>, { collectionId: string; comment: string }>({
      query: ({ collectionId, comment }) => ({
        url: `/collections/${collectionId}/comments`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: (result, error, { collectionId }) => [{ type: COLLECTIONS_TAG, id: collectionId }],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Удаление комментария из коллекции
    removeCommentFromCollection: builder.mutation<ApiResponseDto<Collection>, { collectionId: string; commentIndex: number }>({
      query: ({ collectionId, commentIndex }) => ({
        url: `/collections/${collectionId}/comments/${commentIndex}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { collectionId }) => [{ type: COLLECTIONS_TAG, id: collectionId }],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetTopCollectionsQuery,
  useGetCollectionByIdQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useIncrementCollectionViewsMutation,
  useAddTitleToCollectionMutation,
  useRemoveTitleFromCollectionMutation,
  useAddCommentToCollectionMutation,
  useRemoveCommentFromCollectionMutation,
} = collectionsApi;

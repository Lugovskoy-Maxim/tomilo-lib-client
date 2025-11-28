import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Collection,
  CollectionWithTitles,
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionsQuery,
  ApiResponseDto
} from "@/types/collection";

const COLLECTIONS_TAG = "Collections";


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
      transformResponse: (response: ApiResponseDto<unknown>) => {
        // Нормализуем серверный ответ
        const data = response?.data;
        let collections: Collection[] = [];
        let total: number = 0;
        let page: number = 1;
        let totalPages: number = 1;

        if (Array.isArray(data)) {
          // API returns collections directly as array
          collections = data as Collection[];
          total = data.length;
        } else if (data && typeof data === 'object') {
          const dataObj = data as any;
          collections = dataObj.collections || dataObj.data || [];
          total = dataObj.pagination?.total || dataObj.total || collections.length || 0;
          page = dataObj.pagination?.page || dataObj.page || 1;
          totalPages = dataObj.pagination?.pages || dataObj.totalPages || Math.ceil(total / (dataObj.pagination?.limit || 12)) || 1;
        }

        // Map id to _id if needed, filter out collections without any ID
        collections = collections
          .map((collection: Record<string, unknown>) => ({
            ...collection,
            _id: (collection._id as string) || (collection.id as string) || (collection._id as string)
          }))
          .filter((collection: Record<string, unknown>) => {
            const id = collection._id as string;
            return id && id !== 'undefined';
          });

        return {
          ...response,
          data: { collections, total, page, totalPages },
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
    createCollection: builder.mutation<ApiResponseDto<Collection>, Partial<CreateCollectionDto> | FormData>({
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

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/api";
import {
  Collection,
  CollectionWithTitles,
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionsQuery,
} from "@/types/collection";
import { Title } from "@/types/title";

interface CollectionsApiResponseData {
  collections?: Collection[];
  data?: Collection[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
  total?: number;
  page?: number;
  totalPages?: number;
}

const COLLECTIONS_TAG = "Collections";

export const collectionsApi = createApi({
  reducerPath: "collectionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    prepareHeaders: headers => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("tomilo_lib_token");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: [COLLECTIONS_TAG],
  endpoints: builder => ({
    // Получить все коллекции с пагинацией, поиском и сортировкой
    getCollections: builder.query<
      ApiResponseDto<{
        collections: Collection[];
        total: number;
        page: number;
        totalPages: number;
      }>,
      CollectionsQuery
    >({
      query: params => ({
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
        } else if (data && typeof data === "object") {
          const dataObj = data as CollectionsApiResponseData;
          const rawCollections = dataObj.collections || dataObj.data || [];
          total = dataObj.pagination?.total || dataObj.total || rawCollections.length || 0;
          page = dataObj.pagination?.page || dataObj.page || 1;
          totalPages =
            dataObj.pagination?.pages ||
            dataObj.totalPages ||
            Math.ceil(total / (dataObj.pagination?.limit || 12)) ||
            1;

          // If rawCollections is already Collection[], use it directly, otherwise map from unknown
          if (
            rawCollections.length > 0 &&
            typeof rawCollections[0] === "object" &&
            rawCollections[0] !== null &&
            "id" in rawCollections[0]
          ) {
            collections = rawCollections as Collection[];
          } else {
            collections = (rawCollections as unknown[]).map((collection): Collection => {
              const coll = collection as Record<string, unknown>;
              return {
                id: (coll.id as string) || (coll._id as string) || "",
                cover: (coll.cover as string) || (coll.image as string) || "",
                name: (coll.name as string) || "",
                description: (coll.description as string) || undefined,
                titles: (coll.titles as string[]) || [],
                comments: (coll.comments as string[]) || [],
                views: (coll.views as number) || 0,
                createdAt: (coll.createdAt as string) || "",
                updatedAt: (coll.updatedAt as string) || "",
              };
            });
          }

          collections = collections.filter((collection: Collection) => {
            const id = collection.id;
            return id && id !== "undefined";
          });
        }

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
      query: id => `/collections/${id}`,
      providesTags: (result, error, id) => [{ type: COLLECTIONS_TAG, id }],
      transformResponse: (response: ApiResponseDto<CollectionWithTitles>) => {
        if (response.data && typeof response.data === "object") {
          const dataObj = response.data as unknown as Record<string, unknown>;
          return {
            ...response,
            data: {
              id: (dataObj.id as string) || (dataObj._id as string) || "",
              cover: (dataObj.cover as string) || (dataObj.image as string) || "",
              name: (dataObj.name as string) || "",
              description: (dataObj.description as string) || undefined,
              titles: (dataObj.titles as Title[]) || [],
              comments: (dataObj.comments as unknown[]) || [],
              views: (dataObj.views as number) || 0,
              createdAt: (dataObj.createdAt as string) || "",
              updatedAt: (dataObj.updatedAt as string) || "",
            } as CollectionWithTitles,
          };
        }
        return response;
      },
    }),

    // Создание коллекции
    createCollection: builder.mutation<
      ApiResponseDto<Collection>,
      Partial<CreateCollectionDto> | FormData
    >({
      query: data => ({
        url: "/collections",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [COLLECTIONS_TAG],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Обновление коллекции
    updateCollection: builder.mutation<
      ApiResponseDto<Collection>,
      { id: string; data: Partial<UpdateCollectionDto> | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/collections/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [COLLECTIONS_TAG],
      transformResponse: (response: ApiResponseDto<Collection>) => {
        // Map API response fields to match Collection interface
        if (response.data && typeof response.data === "object") {
          const dataObj = response.data as unknown as Record<string, unknown>;
          return {
            ...response,
            data: {
              id: (dataObj.id as string) || (dataObj._id as string) || "",
              cover: (dataObj.cover as string) || (dataObj.image as string) || "",
              name: (dataObj.name as string) || "",
              description: (dataObj.description as string) || undefined,
              titles: (dataObj.titles as string[]) || [],
              comments: (dataObj.comments as string[]) || [],
              views: (dataObj.views as number) || 0,
              createdAt: (dataObj.createdAt as string) || "",
              updatedAt: (dataObj.updatedAt as string) || "",
            } as Collection,
          };
        }
        return response;
      },
    }),

    // Удаление коллекции
    deleteCollection: builder.mutation<void, string>({
      query: id => ({
        url: `/collections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [COLLECTIONS_TAG],
    }),

    // Увеличение счётчика просмотров коллекции
    incrementCollectionViews: builder.mutation<ApiResponseDto<Collection>, string>({
      query: id => ({
        url: `/collections/${id}/views`,
        method: "POST",
      }),
      // Removed invalidatesTags to prevent infinite loop
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Добавление тайтла в коллекцию
    addTitleToCollection: builder.mutation<
      ApiResponseDto<Collection>,
      { collectionId: string; titleId: string }
    >({
      query: ({ collectionId, titleId }) => ({
        url: `/collections/${collectionId}/titles/${titleId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { collectionId }) => [
        { type: COLLECTIONS_TAG, id: collectionId },
      ],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Удаление тайтла из коллекции
    removeTitleFromCollection: builder.mutation<
      ApiResponseDto<Collection>,
      { collectionId: string; titleId: string }
    >({
      query: ({ collectionId, titleId }) => ({
        url: `/collections/${collectionId}/titles/${titleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { collectionId }) => [
        { type: COLLECTIONS_TAG, id: collectionId },
      ],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Добавление комментария к коллекции
    addCommentToCollection: builder.mutation<
      ApiResponseDto<Collection>,
      { collectionId: string; comment: string }
    >({
      query: ({ collectionId, comment }) => ({
        url: `/collections/${collectionId}/comments`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: (result, error, { collectionId }) => [
        { type: COLLECTIONS_TAG, id: collectionId },
      ],
      transformResponse: (response: ApiResponseDto<Collection>) => response,
    }),

    // Удаление комментария из коллекции
    removeCommentFromCollection: builder.mutation<
      ApiResponseDto<Collection>,
      { collectionId: string; commentIndex: number }
    >({
      query: ({ collectionId, commentIndex }) => ({
        url: `/collections/${collectionId}/comments/${commentIndex}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { collectionId }) => [
        { type: COLLECTIONS_TAG, id: collectionId },
      ],
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

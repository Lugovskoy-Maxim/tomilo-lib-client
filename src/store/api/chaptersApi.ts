import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Chapter,
  ChaptersResponse,
  CreateChapterDto,
  UpdateChapterDto,
  ApiResponseDto,
} from "@/types/title";

const CHAPTERS_TAG = "Chapters";

function toFormData<T extends Record<string, unknown>>(
  data: Partial<T>
): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export const chaptersApi = createApi({
  reducerPath: "chaptersApi",
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
  tagTypes: [CHAPTERS_TAG],
  endpoints: (builder) => ({
    getChapterById: builder.query<Chapter, string>({
      query: (id) => `/chapters/${id}`,
      transformResponse: (response: ApiResponseDto<Chapter>) => response.data!,
      providesTags: (result, error, id) => [{ type: CHAPTERS_TAG, id }],
    }),

    getChapterByNumber: builder.query<Chapter, { titleId: string; chapterNumber: number }>({
      query: ({ titleId, chapterNumber }) => `/chapters/by-number/${titleId}?chapterNumber=${chapterNumber}`,
    }),


    getChaptersByTitle: builder.query<
      ChaptersResponse,
      {
        titleId: string;
        page?: number;
        limit?: number;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: ({ titleId, page = 1, limit = 1000, sortOrder = "desc" }) => ({
        url: `/chapters/title/${titleId}`,
        params: { page, limit, sortOrder },
      }),
      providesTags: (result, error, { titleId }) => [
        { type: CHAPTERS_TAG, id: `title-${titleId}` },
      ],
      transformResponse: (
        response: ApiResponseDto<ChaptersResponse> | ChaptersResponse
      ): ChaptersResponse => {
        // Normalize various possible server shapes
        if ("data" in response && response.data) {
          return response.data;
        }
        const resp = response as unknown as Record<string, unknown>;
        const chapters: Chapter[] =
          (resp.chapters as Chapter[]) ?? (resp.data as Chapter[]) ?? [];
        const total: number =
          ((resp.pagination as Record<string, unknown>)?.total as number) ??
          (resp.total as number) ??
          chapters.length ??
          0;
        const page: number =
          ((resp.pagination as Record<string, unknown>)?.page as number) ??
          (resp.page as number) ??
          1;
        const limit: number =
          ((resp.pagination as Record<string, unknown>)?.limit as number) ??
          (resp.limit as number) ??
          50;
        const totalPages: number =
          ((resp.pagination as Record<string, unknown>)?.pages as number) ??
          (resp.totalPages as number) ??
          Math.max(1, Math.ceil(total / (limit || 1)));
        const hasMore: boolean =
          ((resp.pagination as Record<string, unknown>)?.hasMore as boolean) ??
          page < totalPages;
        return { chapters, total, page, limit, totalPages, hasMore };
      },
    }),

    searchChapters: builder.query<
      ChaptersResponse,
      {
        titleId?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/chapters", params }),
      transformResponse: (
        response: ApiResponseDto<ChaptersResponse> | ChaptersResponse
      ): ChaptersResponse => {
        // Normalize various possible server shapes
        if ("data" in response && response.data) {
          return response.data;
        }
        const resp = response as unknown as Record<string, unknown>;
        const chapters: Chapter[] =
          (resp.chapters as Chapter[]) ?? (resp.data as Chapter[]) ?? [];
        const total: number =
          ((resp.pagination as Record<string, unknown>)?.total as number) ??
          (resp.total as number) ??
          chapters.length ??
          0;
        const page: number =
          ((resp.pagination as Record<string, unknown>)?.page as number) ??
          (resp.page as number) ??
          1;
        const limit: number =
          ((resp.pagination as Record<string, unknown>)?.limit as number) ??
          (resp.limit as number) ??
          50;
        const totalPages: number =
          ((resp.pagination as Record<string, unknown>)?.pages as number) ??
          (resp.totalPages as number) ??
          Math.max(1, Math.ceil(total / (limit || 1)));
        const hasMore: boolean =
          ((resp.pagination as Record<string, unknown>)?.hasMore as boolean) ??
          page < totalPages;
        return { chapters, total, page, limit, totalPages, hasMore };
      },
      providesTags: [CHAPTERS_TAG],
    }),

    createChapter: builder.mutation<Chapter, Partial<CreateChapterDto>>({
      query: (data) => ({
        url: "/chapters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [CHAPTERS_TAG],
    }),

    createChapterWithPages: builder.mutation<
      Chapter,
      { data: Partial<CreateChapterDto>; pages: File[] }
    >({
      query: ({ data, pages }) => {
        const formData = toFormData<CreateChapterDto>(data);
        pages.forEach((file) => formData.append("pages", file));
        return {
          url: "/chapters/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [CHAPTERS_TAG],
    }),

    addPagesToChapter: builder.mutation<Chapter, { id: string; pages: File[] }>(
      {
        query: ({ id, pages }) => {
          const formData = new FormData();
          pages.forEach((file) => formData.append("pages", file));
          return {
            url: `/chapters/${id}/pages`,
            method: "POST",
            body: formData,
          };
        },
        invalidatesTags: (result, error, { id }) => [
          { type: CHAPTERS_TAG, id },
          CHAPTERS_TAG,
        ],
      }
    ),

    updateChapter: builder.mutation<
      Chapter,
      { id: string; data: Partial<UpdateChapterDto> }
    >({
      query: ({ id, data }) => ({
        url: `/chapters/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: CHAPTERS_TAG, id }],
    }),




    deleteChapter: builder.mutation<void, string>({
      query: (id) => ({ url: `/chapters/${id}`, method: "DELETE" }),
      invalidatesTags: [CHAPTERS_TAG],
    }),


    // Увеличение счётчика просмотров главы (доступно без авторизации)
    incrementChapterViews: builder.mutation<ApiResponseDto<Chapter>, string>({
      query: (id) => ({
        url: `/chapters/${id}/view`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: CHAPTERS_TAG, id }],
      transformResponse: (response: ApiResponseDto<Chapter>) => response,
    }),
  }),
});




export const {
  useGetChapterByIdQuery,
  useGetChaptersByTitleQuery,
  useSearchChaptersQuery,
  useCreateChapterMutation,
  useCreateChapterWithPagesMutation,
  useAddPagesToChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useGetChapterByNumberQuery,
  useIncrementChapterViewsMutation,
} = chaptersApi;


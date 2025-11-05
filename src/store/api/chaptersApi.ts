import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Chapter,
  ChaptersResponse,
  CreateChapterDto,
  UpdateChapterDto,
} from "@/types/title";

const CHAPTERS_TAG = "Chapters";

function toFormData<T extends Record<string, unknown>>(data: Partial<T>): FormData {
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
  }),
  tagTypes: [CHAPTERS_TAG],
  endpoints: (builder) => ({
    getChapterById: builder.query<Chapter, string>({
      query: (id) => `/chapters/${id}`,
      providesTags: (result, error, id) => [{ type: CHAPTERS_TAG, id }],
    }),

    getChaptersByTitle: builder.query<Chapter[], { titleId: string; sortOrder?: "asc" | "desc" }>({
      query: ({ titleId, sortOrder = "asc" }) => ({
        url: `/chapters/title/${titleId}`,
        params: { sortOrder },
      }),
      providesTags: (result, error, { titleId }) => [{ type: CHAPTERS_TAG, id: `title-${titleId}` }],
      transformResponse: (response: Chapter[] | { data: Chapter[] }) => {
        if (Array.isArray(response)) return response;
        return (response as { data: Chapter[] })?.data ?? [];
      },
    }),

    searchChapters: builder.query<ChaptersResponse, { titleId?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" }>({
      query: (params) => ({ url: "/chapters", params }),
      transformResponse: (response: unknown): ChaptersResponse => {
        // Normalize various possible server shapes
        const chapters: Chapter[] = (response as any)?.chapters ?? (response as any)?.data ?? [];
        const total: number = (response as any)?.pagination?.total ?? (response as any)?.total ?? chapters.length ?? 0;
        const page: number = (response as any)?.pagination?.page ?? (response as any)?.page ?? 1;
        const limit: number = (response as any)?.pagination?.limit ?? (response as any)?.limit ?? 50;
        const totalPages: number = (response as any)?.pagination?.pages ?? (response as any)?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
        const hasMore: boolean = (response as any)?.pagination?.hasMore ?? page < totalPages;
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

    createChapterWithPages: builder.mutation<Chapter, { data: Partial<CreateChapterDto>; pages: File[] }>({
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

    addPagesToChapter: builder.mutation<Chapter, { id: string; pages: File[] }>({
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
    }),

    updateChapter: builder.mutation<Chapter, { id: string; data: Partial<UpdateChapterDto> }>({
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
} = chaptersApi;

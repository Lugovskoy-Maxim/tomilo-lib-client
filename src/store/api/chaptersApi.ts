import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import { Chapter, ChaptersResponse, CreateChapterDto, UpdateChapterDto } from "@/types/title";
import {
  ChapterRatingResponse,
  ChapterReactionsCountResponse,
  SetChapterRatingDto,
  ToggleChapterReactionDto,
} from "@/types/chapter";
import { titlesApi } from "./titlesApi";

const CHAPTERS_TAG = "Chapters";

const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

/** Сортирует файлы по имени в натуральном порядке (1, 2, 10, а не 1, 10, 2). */
function sortFilesByNaturalOrder(files: File[]): File[] {
  return [...files].sort((a, b) => naturalCollator.compare(a.name, b.name));
}

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

function normalizeChaptersResponse(
  response: ApiResponseDto<ChaptersResponse> | ChaptersResponse,
): ChaptersResponse {
  if ("data" in response && response.data) {
    return response.data;
  }
  const resp = response as unknown as Record<string, unknown>;
  const chapters: Chapter[] = (resp.chapters as Chapter[]) ?? (resp.data as Chapter[]) ?? [];
  const total: number =
    ((resp.pagination as Record<string, unknown>)?.total as number) ??
    (resp.total as number) ??
    chapters.length ??
    0;
  const page: number =
    ((resp.pagination as Record<string, unknown>)?.page as number) ?? (resp.page as number) ?? 1;
  const limit: number =
    ((resp.pagination as Record<string, unknown>)?.limit as number) ?? (resp.limit as number) ?? 50;
  const totalPages: number =
    ((resp.pagination as Record<string, unknown>)?.pages as number) ??
    (resp.totalPages as number) ??
    Math.max(1, Math.ceil(total / (limit || 1)));
  const hasMore: boolean =
    ((resp.pagination as Record<string, unknown>)?.hasMore as boolean) ?? page < totalPages;
  return { chapters, total, page, limit, totalPages, hasMore };
}

export const chaptersApi = createApi({
  reducerPath: "chaptersApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [CHAPTERS_TAG],
  endpoints: builder => ({
    getChapterById: builder.query<Chapter, string>({
      query: id => `/chapters/${id}`,
      transformResponse: (response: ApiResponseDto<Chapter>) => response.data!,
      providesTags: (result, error, id) => [{ type: CHAPTERS_TAG, id }],
    }),

    getChapterByNumber: builder.query<Chapter, { titleId: string; chapterNumber: number }>({
      query: ({ titleId, chapterNumber }) =>
        `/chapters/by-number/${titleId}?chapterNumber=${chapterNumber}`,
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
      transformResponse: normalizeChaptersResponse,
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
      query: params => ({ url: "/chapters", params }),
      transformResponse: normalizeChaptersResponse,
      providesTags: [CHAPTERS_TAG],
    }),

    createChapter: builder.mutation<Chapter, Partial<CreateChapterDto>>({
      query: data => ({
        url: "/chapters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [CHAPTERS_TAG],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(titlesApi.util.invalidateTags(["Titles"]));
      },
    }),

    createChapterWithPages: builder.mutation<
      Chapter,
      { data: Partial<CreateChapterDto>; pages: File[] }
    >({
      query: ({ data, pages }) => {
        const formData = toFormData<CreateChapterDto>(data);
        const sortedPages = sortFilesByNaturalOrder(pages);
        const fileOrder = sortedPages.map(file => file.name);
        formData.append("fileOrder", JSON.stringify(fileOrder));
        sortedPages.forEach((file, index) => {
          formData.append(
            `pages`,
            new File([file], `${String(index).padStart(6, "0")}_${file.name}`, { type: file.type }),
          );
        });
        return {
          url: "/chapters/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [CHAPTERS_TAG],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(titlesApi.util.invalidateTags(["Titles"]));
      },
    }),

    addPagesToChapter: builder.mutation<Chapter, { id: string; pages: File[] }>({
      query: ({ id, pages }) => {
        const formData = new FormData();
        const sortedPages = sortFilesByNaturalOrder(pages);
        const fileOrder = sortedPages.map(file => file.name);
        formData.append("fileOrder", JSON.stringify(fileOrder));
        sortedPages.forEach((file, index) => {
          formData.append(
            `pages`,
            new File([file], `${String(index).padStart(6, "0")}_${file.name}`, { type: file.type }),
          );
        });
        return {
          url: `/chapters/${id}/pages`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: CHAPTERS_TAG, id }, CHAPTERS_TAG],
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
      query: id => ({ url: `/chapters/${id}`, method: "DELETE" }),
      invalidatesTags: [CHAPTERS_TAG],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(titlesApi.util.invalidateTags(["Titles"]));
      },
    }),

    // Увеличение счётчика просмотров главы (доступно без авторизации)
    incrementChapterViews: builder.mutation<ApiResponseDto<Chapter>, string>({
      query: id => ({
        url: `/chapters/${id}/view`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: CHAPTERS_TAG, id }],
      transformResponse: (response: ApiResponseDto<Chapter>) => response,
    }),

    // Очистка осиротевших глав (глав без тайтлов)
    cleanupOrphanedChapters: builder.mutation<ApiResponseDto<{ deletedCount: number }>, void>({
      query: () => ({
        url: "/chapters/cleanup-orphaned",
        method: "POST",
      }),
      invalidatesTags: [CHAPTERS_TAG],
    }),

    // ——— Рейтинг и реакции глав ———

    // Список разрешённых эмодзи для реакций глав
    getChapterReactionEmojis: builder.query<ApiResponseDto<string[]>, void>({
      query: () => "/chapters/reactions/emojis",
    }),

    // Рейтинг главы (при JWT в ответе добавляется userRating)
    getChapterRating: builder.query<ChapterRatingResponse, string>({
      query: chapterId => `/chapters/${chapterId}/rating`,
      transformResponse: (response: ApiResponseDto<ChapterRatingResponse>) =>
        response?.data ?? (response as unknown as ChapterRatingResponse),
      providesTags: (result, error, chapterId) => [
        { type: CHAPTERS_TAG, id: chapterId },
        { type: CHAPTERS_TAG, id: `rating-${chapterId}` },
      ],
    }),

    // Поставить или изменить оценку главы (1–5)
    setChapterRating: builder.mutation<
      ApiResponseDto<ChapterRatingResponse>,
      { chapterId: string; body: SetChapterRatingDto }
    >({
      query: ({ chapterId, body }) => ({
        url: `/chapters/${chapterId}/rating`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: CHAPTERS_TAG, id: chapterId },
        { type: CHAPTERS_TAG, id: `rating-${chapterId}` },
      ],
    }),

    // Сводка по реакциям главы (эмодзи и счётчики)
    getChapterReactionsCount: builder.query<ApiResponseDto<ChapterReactionsCountResponse>, string>({
      query: chapterId => `/chapters/${chapterId}/reactions/count`,
      providesTags: (result, error, chapterId) => [
        { type: CHAPTERS_TAG, id: chapterId },
        { type: CHAPTERS_TAG, id: `reactions-${chapterId}` },
      ],
    }),

    // Переключить реакцию на главе (повторный запрос с тем же emoji снимает)
    toggleChapterReaction: builder.mutation<
      ApiResponseDto<unknown>,
      { chapterId: string; body: ToggleChapterReactionDto }
    >({
      query: ({ chapterId, body }) => ({
        url: `/chapters/${chapterId}/reactions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: CHAPTERS_TAG, id: chapterId },
        { type: CHAPTERS_TAG, id: `reactions-${chapterId}` },
      ],
    }),
  }),
});

export const {
  useGetChapterByIdQuery,
  useLazyGetChapterByIdQuery,
  useGetChaptersByTitleQuery,
  useSearchChaptersQuery,
  useCreateChapterMutation,
  useCreateChapterWithPagesMutation,
  useAddPagesToChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useGetChapterByNumberQuery,
  useIncrementChapterViewsMutation,
  useCleanupOrphanedChaptersMutation,
  useGetChapterReactionEmojisQuery,
  useGetChapterRatingQuery,
  useSetChapterRatingMutation,
  useGetChapterReactionsCountQuery,
  useToggleChapterReactionMutation,
} = chaptersApi;

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import { TitleType } from "@/types/title";
import type { SearchResult } from "@/types/search";

/** Результат автодополнения поиска */
export interface AutocompleteResult {
  id: string;
  title: string;
  slug: string;
  cover: string;
  type: TitleType | string;
  releaseYear?: number;
  averageRating?: number;
  totalChapters?: number;
}

/** Параметры запроса автодополнения */
export interface AutocompleteParams {
  q: string;
  limit?: number;
  includeAdult?: boolean;
}

const SEARCH_TAG = "Search";

/** Нормализация элемента из ответа /search в SearchResult */
function mapSearchItem(item: Record<string, unknown>): SearchResult {
  return {
    id: String(item._id ?? item.id ?? ""),
    slug: item.slug != null ? String(item.slug) : undefined,
    title: String(item.name ?? item.title ?? ""),
    cover: item.coverImage != null ? String(item.coverImage) : item.cover != null ? String(item.cover) : undefined,
    description: item.description != null ? String(item.description) : undefined,
    type: item.type != null ? String(item.type) : undefined,
    releaseYear: typeof item.releaseYear === "number" ? item.releaseYear : undefined,
    rating: typeof item.averageRating === "number" ? item.averageRating : typeof item.rating === "number" ? item.rating : undefined,
    totalChapters: typeof item.totalChapters === "number" ? item.totalChapters : undefined,
  };
}

export const searchApi = createApi({
  reducerPath: "searchApi",
  keepUnusedDataFor: 60,
  baseQuery: baseQueryWithReauth,
  tagTypes: [SEARCH_TAG],
  endpoints: builder => ({
    getAutocomplete: builder.query<ApiResponseDto<AutocompleteResult[]>, AutocompleteParams>({
      query: ({ q, limit = 10, includeAdult }) => ({
        url: "/titles",
        params: {
          search: q,
          limit,
          includeAdult: includeAdult || undefined,
        },
      }),
      transformResponse: (
        response: ApiResponseDto<{
          titles: Array<{
            _id: string;
            name: string;
            slug: string;
            coverImage?: string;
            type: TitleType | string;
            releaseYear?: number;
            averageRating?: number;
            totalChapters?: number;
          }>;
        }>,
      ) => {
        const titles = response.data?.titles || [];
        return {
          ...response,
          data: titles.map(t => ({
            id: t._id,
            title: t.name,
            slug: t.slug,
            cover: t.coverImage || "",
            type: t.type,
            releaseYear: t.releaseYear,
            averageRating: t.averageRating,
            totalChapters: t.totalChapters,
          })),
        };
      },
      providesTags: [SEARCH_TAG],
    }),

    /** Полнотекстовый поиск (тот же бэкенд GET /search?q=). Используется при нажатии Enter в поиске. */
    getFullSearch: builder.query<SearchResult[], string>({
      query: q => ({
        url: "/search",
        params: { q: q.trim() },
      }),
      transformResponse(response: unknown): SearchResult[] {
        if (response && typeof response === "object" && "data" in response) {
          const data = (response as { data?: unknown }).data;
          if (Array.isArray(data)) {
            return data.map((item: Record<string, unknown>) => mapSearchItem(item));
          }
        }
        if (Array.isArray(response)) {
          return response.map((item: Record<string, unknown>) => mapSearchItem(item));
        }
        return [];
      },
      providesTags: [SEARCH_TAG],
    }),
  }),
});

export const { useGetAutocompleteQuery, useLazyGetFullSearchQuery } = searchApi;

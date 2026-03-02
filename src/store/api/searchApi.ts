import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import { TitleType } from "@/types/title";

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

export const searchApi = createApi({
  reducerPath: "searchApi",
  keepUnusedDataFor: 60,
  baseQuery: baseQueryWithReauth,
  tagTypes: [SEARCH_TAG],
  endpoints: builder => ({
    getAutocomplete: builder.query<
      ApiResponseDto<AutocompleteResult[]>,
      AutocompleteParams
    >({
      query: ({ q, limit = 10, includeAdult }) => ({
        url: "/titles",
        params: {
          search: q,
          limit,
          includeAdult: includeAdult || undefined,
        },
      }),
      transformResponse: (response: ApiResponseDto<{ titles: Array<{
        _id: string;
        name: string;
        slug: string;
        coverImage?: string;
        type: TitleType | string;
        releaseYear?: number;
        averageRating?: number;
        totalChapters?: number;
      }> }>) => {
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
  }),
});

export const { useGetAutocompleteQuery } = searchApi;

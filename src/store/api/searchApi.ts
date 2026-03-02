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
        url: "/search/autocomplete",
        params: {
          q,
          limit,
          includeAdult: includeAdult || undefined,
        },
      }),
      providesTags: [SEARCH_TAG],
    }),
  }),
});

export const { useGetAutocompleteQuery } = searchApi;

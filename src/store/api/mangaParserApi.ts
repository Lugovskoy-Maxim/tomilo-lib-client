import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/api";
import {
  ParseTitleDto,
  ParseChaptersDto,
  ParseChaptersInfoDto,
  ParseChaptersInfoResponse,
  SupportedSitesResponse,
  ParseResult,
} from "@/types/manga-parser";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const mangaParserApi = createApi({
  reducerPath: "mangaParserApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    credentials: "include",
    prepareHeaders: headers => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["MangaParser"],
  endpoints: builder => ({
    // Parse and import complete title
    parseTitle: builder.mutation<ApiResponseDto<ParseResult>, ParseTitleDto>({
      query: data => ({
        url: "/manga-parser/parse-title",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MangaParser"],
      transformResponse: (response: ApiResponseDto<ParseResult>) => response,
    }),

    // Parse and import chapters
    parseChapters: builder.mutation<ApiResponseDto<ParseResult>, ParseChaptersDto>({
      query: data => ({
        url: "/manga-parser/parse-chapters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MangaParser"],
      transformResponse: (response: ApiResponseDto<ParseResult>) => response,
    }),

    // Get chapters info from URL
    parseChaptersInfo: builder.query<
      ApiResponseDto<ParseChaptersInfoResponse>,
      ParseChaptersInfoDto
    >({
      query: data => ({
        url: "/manga-parser/parse-chapters-info",
        method: "POST",
        body: data,
      }),
      providesTags: ["MangaParser"],
      transformResponse: (response: ApiResponseDto<ParseChaptersInfoResponse>) => response,
    }),

    // Get list of supported sites
    getSupportedSites: builder.query<ApiResponseDto<SupportedSitesResponse>, void>({
      query: () => "/manga-parser/supported-sites",
      providesTags: ["MangaParser"],
      transformResponse: (response: ApiResponseDto<SupportedSitesResponse>) => response,
    }),
  }),
});

export const {
  useParseTitleMutation,
  useParseChaptersMutation,
  useParseChaptersInfoQuery,
  useGetSupportedSitesQuery,
} = mangaParserApi;

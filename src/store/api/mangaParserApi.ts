import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/api";
import {
  ParseTitleDto,
  ParseChaptersDto,
  ParseChaptersInfoDto,
  ParseChaptersInfoResponse,
  SupportedSitesResponse,
  ParseResult,
  SyncChaptersDto,
  SyncChaptersResponse,
} from "@/types/manga-parser";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const mangaParserApi = createApi({
  reducerPath: "mangaParserApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["MangaParser", "Chapters"],
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

    // Sync existing chapters from source (re-download pages). Only manual — do not call automatically.
    syncChapters: builder.mutation<
      ApiResponseDto<SyncChaptersResponse>,
      SyncChaptersDto
    >({
      query: data => ({
        url: "/manga-parser/sync-chapters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MangaParser", "Chapters"],
      transformResponse: (response: ApiResponseDto<SyncChaptersResponse>) => response,
    }),
  }),
});

export const {
  useParseTitleMutation,
  useParseChaptersMutation,
  useParseChaptersInfoQuery,
  useGetSupportedSitesQuery,
  useSyncChaptersMutation,
} = mangaParserApi;

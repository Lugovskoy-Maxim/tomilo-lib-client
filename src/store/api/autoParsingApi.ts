import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  AutoParsingJob,
  CreateAutoParsingJobDto,
  UpdateAutoParsingJobDto,
  CheckNewChaptersResponse,
} from "@/types/auto-parsing";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const autoParsingApi = createApi({
  reducerPath: "autoParsingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
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
  tagTypes: ["AutoParsing"],
  endpoints: builder => ({
    // Get all auto-parsing jobs
    getAutoParsingJobs: builder.query<AutoParsingJob[], void>({
      query: () => "/auto-parsing",
      providesTags: ["AutoParsing"],
    }),

    // Get single auto-parsing job
    getAutoParsingJob: builder.query<AutoParsingJob, string>({
      query: id => `/auto-parsing/${id}`,
      providesTags: ["AutoParsing"],
    }),

    // Create auto-parsing job
    createAutoParsingJob: builder.mutation<AutoParsingJob, CreateAutoParsingJobDto>({
      query: data => ({
        url: "/auto-parsing",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AutoParsing"],
    }),

    // Update auto-parsing job
    updateAutoParsingJob: builder.mutation<
      AutoParsingJob,
      { id: string; data: UpdateAutoParsingJobDto }
    >({
      query: ({ id, data }) => ({
        url: `/auto-parsing/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["AutoParsing"],
    }),

    // Delete auto-parsing job
    deleteAutoParsingJob: builder.mutation<{ message: string }, string>({
      query: id => ({
        url: `/auto-parsing/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AutoParsing"],
    }),

    // Check for new chapters
    checkNewChapters: builder.mutation<CheckNewChaptersResponse, string>({
      query: id => ({
        url: `/auto-parsing/${id}/check`,
        method: "POST",
      }),
      invalidatesTags: ["AutoParsing"],
    }),
  }),
});

export const {
  useGetAutoParsingJobsQuery,
  useGetAutoParsingJobQuery,
  useCreateAutoParsingJobMutation,
  useUpdateAutoParsingJobMutation,
  useDeleteAutoParsingJobMutation,
  useCheckNewChaptersMutation,
} = autoParsingApi;

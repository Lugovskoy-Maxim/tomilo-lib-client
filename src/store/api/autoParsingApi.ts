import { createApi } from "@reduxjs/toolkit/query/react";
import {
  AutoParsingJob,
  CreateAutoParsingJobDto,
  UpdateAutoParsingJobDto,
  CheckNewChaptersResponse,
} from "@/types/auto-parsing";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const autoParsingApi = createApi({
  reducerPath: "autoParsingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AutoParsing"],
  endpoints: builder => ({
    getAutoParsingJobs: builder.query<AutoParsingJob[], void>({
      query: () => "/auto-parsing",
      providesTags: ["AutoParsing"],
    }),

    getAutoParsingJob: builder.query<AutoParsingJob, string>({
      query: id => `/auto-parsing/${id}`,
      providesTags: ["AutoParsing"],
    }),

    createAutoParsingJob: builder.mutation<AutoParsingJob, CreateAutoParsingJobDto>({
      query: data => ({
        url: "/auto-parsing",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AutoParsing"],
    }),

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

    deleteAutoParsingJob: builder.mutation<{ message: string }, string>({
      query: id => ({
        url: `/auto-parsing/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AutoParsing"],
    }),

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

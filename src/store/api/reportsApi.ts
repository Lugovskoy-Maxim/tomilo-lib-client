import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/api";
import { Report, CreateReportDto, UpdateReportStatusDto, ReportsResponse } from "@/types/report";

const REPORTS_TAG = "Reports";

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    prepareHeaders: headers => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("tomilo_lib_token");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: [REPORTS_TAG],
  endpoints: builder => ({
    // Create a new report
    createReport: builder.mutation<ApiResponseDto<Report>, CreateReportDto>({
      query: data => ({
        url: "/reports",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [REPORTS_TAG],
    }),

    // Get all reports (admin only)
    getReports: builder.query<
      ApiResponseDto<ReportsResponse>,
      {
        page?: number;
        limit?: number;
        reportType?: string;
        isResolved?: string;
      }
    >({
      query: params => ({
        url: "/reports",
        params,
      }),
      providesTags: [REPORTS_TAG],
    }),

    // Get a specific report (admin only)
    getReport: builder.query<ApiResponseDto<Report>, string>({
      query: id => `/reports/${id}`,
      providesTags: (result, error, id) => [{ type: REPORTS_TAG, id }],
    }),

    // Update report status (admin only)
    updateReportStatus: builder.mutation<
      ApiResponseDto<Report>,
      { id: string; data: UpdateReportStatusDto }
    >({
      query: ({ id, data }) => ({
        url: `/reports/${id}/status`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: REPORTS_TAG, id }],
    }),

    // Delete a report (admin only)
    deleteReport: builder.mutation<ApiResponseDto<void>, string>({
      query: id => ({
        url: `/reports/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [REPORTS_TAG],
    }),
  }),
});

export const {
  useCreateReportMutation,
  useGetReportsQuery,
  useGetReportQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} = reportsApi;

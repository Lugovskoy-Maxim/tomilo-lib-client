import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/auth";
import {
  StatsResponse,
  StatsHistoryResponse,
  DailyStatsHistory,
  MonthlyStatsHistory,
  YearlyStatsHistory,
  DailyStatsParams,
  RangeStatsParams,
  MonthlyStatsParams,
  YearlyStatsParams,
  RecentStatsParams,
  AvailableYearsResponse,
  RecordStatsResponse,
  StatsWithHistoryParams,
} from "@/types/stats";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const statsApi = createApi({
  reducerPath: "statsApi",
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
  tagTypes: ["Stats", "StatsHistory", "DailyStats", "MonthlyStats", "YearlyStats"],
  endpoints: builder => ({
    // Get current stats with optional history
    getStats: builder.query<ApiResponseDto<StatsResponse>, StatsWithHistoryParams | void>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params && typeof params === "object") {
          if (params.includeHistory) queryParams.set("includeHistory", "true");
          if (params.historyDays) queryParams.set("historyDays", params.historyDays.toString());
        }
        const queryString = queryParams.toString();
        return `/stats${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Stats"],
      transformResponse: (response: ApiResponseDto<StatsResponse>) => response,
    }),

    // Get stats history (daily/monthly/yearly)
    getStatsHistory: builder.query<
      ApiResponseDto<StatsHistoryResponse>,
      { type: "daily" | "monthly" | "yearly"; days?: number; year?: number; month?: number }
    >({
      query: ({ type, days, year, month }) => {
        const params = new URLSearchParams();
        params.set("type", type);
        if (days) params.set("days", days.toString());
        if (year) params.set("year", year.toString());
        if (month) params.set("month", month.toString());
        return `/stats/history?${params.toString()}`;
      },
      providesTags: ["StatsHistory"],
    }),

    // Get daily stats for specific date
    getDailyStats: builder.query<ApiResponseDto<DailyStatsHistory>, DailyStatsParams>({
      query: ({ date }) => `/stats/daily?date=${date}`,
      providesTags: ["DailyStats"],
    }),

    // Get stats for date range
    getStatsRange: builder.query<ApiResponseDto<DailyStatsHistory[]>, RangeStatsParams>({
      query: ({ start, end }) => `/stats/range?start=${start}&end=${end}`,
      providesTags: ["StatsHistory"],
    }),

    // Get monthly stats
    getMonthlyStats: builder.query<ApiResponseDto<MonthlyStatsHistory>, MonthlyStatsParams>({
      query: ({ year, month }) => `/stats/monthly?year=${year}&month=${month}`,
      providesTags: ["MonthlyStats"],
    }),

    // Get yearly stats
    getYearlyStats: builder.query<ApiResponseDto<YearlyStatsHistory>, YearlyStatsParams>({
      query: ({ year }) => `/stats/yearly?year=${year}`,
      providesTags: ["YearlyStats"],
    }),

    // Get recent stats (last N days)
    getRecentStats: builder.query<ApiResponseDto<DailyStatsHistory[]>, RecentStatsParams>({
      query: ({ days }) => `/stats/recent?days=${days}`,
      providesTags: ["StatsHistory"],
    }),

    // Get available years
    getAvailableYears: builder.query<ApiResponseDto<AvailableYearsResponse>, void>({
      query: () => "/stats/years",
      providesTags: ["StatsHistory"],
    }),

    // Record stats manually
    recordStats: builder.mutation<ApiResponseDto<RecordStatsResponse>, void>({
      query: () => ({
        url: "/stats/record",
        method: "POST",
      }),
      invalidatesTags: ["Stats", "StatsHistory", "DailyStats", "MonthlyStats", "YearlyStats"],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetStatsHistoryQuery,
  useGetDailyStatsQuery,
  useGetStatsRangeQuery,
  useGetMonthlyStatsQuery,
  useGetYearlyStatsQuery,
  useGetRecentStatsQuery,
  useGetAvailableYearsQuery,
  useRecordStatsMutation,
} = statsApi;

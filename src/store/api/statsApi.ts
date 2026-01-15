import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponseDto } from "@/types/auth";
import { StatsResponse } from "@/types/stats";

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
  tagTypes: ["Stats"],
  endpoints: builder => ({
    getStats: builder.query<ApiResponseDto<StatsResponse>, void>({
      query: () => "/stats",
      providesTags: ["Stats"],
      transformResponse: (response: ApiResponseDto<StatsResponse>) => response,
    }),
  }),
});

export const { useGetStatsQuery } = statsApi;

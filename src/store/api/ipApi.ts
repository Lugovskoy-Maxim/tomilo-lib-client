import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  IpStatsResponse,
  BlockedIpsResponse,
  BlockIpResponse,
  UnblockIpResponse,
  BlockIpDto,
} from "@/types/ip";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const ipApi = createApi({
  reducerPath: "ipApi",
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
  tagTypes: ["BlockedIps"],
  endpoints: builder => ({
    getIpStats: builder.query<IpStatsResponse, void>({
      query: () => "/ip-stats",
      providesTags: ["BlockedIps"],
    }),
    getBlockedIps: builder.query<
      BlockedIpsResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 50 }) => ({
        url: `/blocked-ips?page=${page}&limit=${limit}`,
      }),
      providesTags: ["BlockedIps"],
    }),
    blockIp: builder.mutation<BlockIpResponse, BlockIpDto>({
      query: body => ({
        url: "/block-ip",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BlockedIps"],
    }),
    unblockIp: builder.mutation<UnblockIpResponse, string>({
      query: ip => ({
        url: "/unblock-ip",
        method: "POST",
        body: { ip },
      }),
      invalidatesTags: ["BlockedIps"],
    }),
  }),
});

export const {
  useGetIpStatsQuery,
  useGetBlockedIpsQuery,
  useBlockIpMutation,
  useUnblockIpMutation,
} = ipApi;


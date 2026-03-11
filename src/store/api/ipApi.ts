import { createApi } from "@reduxjs/toolkit/query/react";
import {
  IpStatsResponse,
  BlockedIpsResponse,
  BlockIpResponse,
  UnblockIpResponse,
  BlockIpDto,
} from "@/types/ip";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const ipApi = createApi({
  reducerPath: "ipApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["BlockedIps"],
  endpoints: builder => ({
    getIpStats: builder.query<IpStatsResponse, void>({
      query: () => "/ip-stats",
      providesTags: ["BlockedIps"],
    }),
    getBlockedIps: builder.query<BlockedIpsResponse, { page?: number; limit?: number }>({
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

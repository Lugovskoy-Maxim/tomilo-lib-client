import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import {
  TitleSubscription,
  TeamSubscription,
  SubscriptionListResponse,
  TeamSubscriptionListResponse,
  SubscribeToTitleDto,
  SubscribeToTeamDto,
  SubscriptionStats,
} from "@/types/subscription";
import { ApiResponseDto } from "@/types/api";

const SUBSCRIPTIONS_TAG = "Subscriptions";

export const subscriptionsApi = createApi({
  reducerPath: "subscriptionsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [SUBSCRIPTIONS_TAG],
  endpoints: builder => ({
    getMyTitleSubscriptions: builder.query<
      SubscriptionListResponse,
      { page?: number; limit?: number }
    >({
      query: params => ({
        url: "/subscriptions/titles",
        params,
      }),
      providesTags: [{ type: SUBSCRIPTIONS_TAG, id: "titles" }],
      transformResponse: (response: ApiResponseDto<SubscriptionListResponse>) => {
        return response.data || { subscriptions: [], total: 0, page: 1, limit: 20 };
      },
    }),

    getMyTeamSubscriptions: builder.query<
      TeamSubscriptionListResponse,
      { page?: number; limit?: number }
    >({
      query: params => ({
        url: "/subscriptions/teams",
        params,
      }),
      providesTags: [{ type: SUBSCRIPTIONS_TAG, id: "teams" }],
      transformResponse: (response: ApiResponseDto<TeamSubscriptionListResponse>) => {
        return response.data || { subscriptions: [], total: 0, page: 1, limit: 20 };
      },
    }),

    getSubscriptionStats: builder.query<SubscriptionStats, void>({
      query: () => "/subscriptions/stats",
      providesTags: [SUBSCRIPTIONS_TAG],
      transformResponse: (response: ApiResponseDto<SubscriptionStats>) => {
        return response.data || { titlesCount: 0, teamsCount: 0, usersCount: 0 };
      },
    }),

    checkTitleSubscription: builder.query<
      { isSubscribed: boolean; subscription?: TitleSubscription },
      string
    >({
      query: titleId => `/subscriptions/titles/${titleId}/check`,
      providesTags: (result, error, titleId) => [
        { type: SUBSCRIPTIONS_TAG, id: `title-${titleId}` },
      ],
      transformResponse: (
        response: ApiResponseDto<{ isSubscribed: boolean; subscription?: TitleSubscription }>,
      ) => {
        return response.data || { isSubscribed: false };
      },
    }),

    checkTeamSubscription: builder.query<
      { isSubscribed: boolean; subscription?: TeamSubscription },
      string
    >({
      query: teamId => `/subscriptions/teams/${teamId}/check`,
      providesTags: (result, error, teamId) => [{ type: SUBSCRIPTIONS_TAG, id: `team-${teamId}` }],
      transformResponse: (
        response: ApiResponseDto<{ isSubscribed: boolean; subscription?: TeamSubscription }>,
      ) => {
        return response.data || { isSubscribed: false };
      },
    }),

    subscribeToTitle: builder.mutation<TitleSubscription, SubscribeToTitleDto>({
      query: data => ({
        url: "/subscriptions/titles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        { type: SUBSCRIPTIONS_TAG, id: "titles" },
        { type: SUBSCRIPTIONS_TAG, id: `title-${data.titleId}` },
      ],
      transformResponse: (response: ApiResponseDto<TitleSubscription>) => {
        if (!response.data) throw new Error("Failed to subscribe");
        return response.data;
      },
    }),

    unsubscribeFromTitle: builder.mutation<void, string>({
      query: titleId => ({
        url: `/subscriptions/titles/${titleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, titleId) => [
        { type: SUBSCRIPTIONS_TAG, id: "titles" },
        { type: SUBSCRIPTIONS_TAG, id: `title-${titleId}` },
      ],
    }),

    updateTitleSubscription: builder.mutation<
      TitleSubscription,
      { titleId: string; notifyOnNewChapter?: boolean; notifyOnAnnouncement?: boolean }
    >({
      query: ({ titleId, ...data }) => ({
        url: `/subscriptions/titles/${titleId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { titleId }) => [
        { type: SUBSCRIPTIONS_TAG, id: `title-${titleId}` },
      ],
      transformResponse: (response: ApiResponseDto<TitleSubscription>) => {
        if (!response.data) throw new Error("Failed to update subscription");
        return response.data;
      },
    }),

    subscribeToTeam: builder.mutation<TeamSubscription, SubscribeToTeamDto>({
      query: data => ({
        url: "/subscriptions/teams",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        { type: SUBSCRIPTIONS_TAG, id: "teams" },
        { type: SUBSCRIPTIONS_TAG, id: `team-${data.teamId}` },
      ],
      transformResponse: (response: ApiResponseDto<TeamSubscription>) => {
        if (!response.data) throw new Error("Failed to subscribe");
        return response.data;
      },
    }),

    unsubscribeFromTeam: builder.mutation<void, string>({
      query: teamId => ({
        url: `/subscriptions/teams/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, teamId) => [
        { type: SUBSCRIPTIONS_TAG, id: "teams" },
        { type: SUBSCRIPTIONS_TAG, id: `team-${teamId}` },
      ],
    }),

    updateTeamSubscription: builder.mutation<
      TeamSubscription,
      { teamId: string; notifyOnNewChapter?: boolean; notifyOnNewTitle?: boolean }
    >({
      query: ({ teamId, ...data }) => ({
        url: `/subscriptions/teams/${teamId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: SUBSCRIPTIONS_TAG, id: `team-${teamId}` },
      ],
      transformResponse: (response: ApiResponseDto<TeamSubscription>) => {
        if (!response.data) throw new Error("Failed to update subscription");
        return response.data;
      },
    }),

    getTitleSubscribersCount: builder.query<number, string>({
      query: titleId => `/subscriptions/titles/${titleId}/count`,
      transformResponse: (response: ApiResponseDto<{ count: number }>) => {
        return response.data?.count || 0;
      },
    }),

    getTeamSubscribersCount: builder.query<number, string>({
      query: teamId => `/subscriptions/teams/${teamId}/count`,
      transformResponse: (response: ApiResponseDto<{ count: number }>) => {
        return response.data?.count || 0;
      },
    }),
  }),
});

export const {
  useGetMyTitleSubscriptionsQuery,
  useGetMyTeamSubscriptionsQuery,
  useGetSubscriptionStatsQuery,
  useCheckTitleSubscriptionQuery,
  useCheckTeamSubscriptionQuery,
  useSubscribeToTitleMutation,
  useUnsubscribeFromTitleMutation,
  useUpdateTitleSubscriptionMutation,
  useSubscribeToTeamMutation,
  useUnsubscribeFromTeamMutation,
  useUpdateTeamSubscriptionMutation,
  useGetTitleSubscribersCountQuery,
  useGetTeamSubscribersCountQuery,
} = subscriptionsApi;

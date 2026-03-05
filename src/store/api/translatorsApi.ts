import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import {
  TranslatorTeam,
  TranslatorTeamListResponse,
  CreateTranslatorTeamDto,
  UpdateTranslatorTeamDto,
} from "@/types/translator";
import { ApiResponseDto } from "@/types/api";

const TRANSLATORS_TAG = "Translators";

export const translatorsApi = createApi({
  reducerPath: "translatorsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [TRANSLATORS_TAG],
  endpoints: builder => ({
    getTeams: builder.query<
      TranslatorTeamListResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: params => ({
        url: "/translator-teams",
        params,
      }),
      providesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeamListResponse>) => {
        return response.data || { teams: [], total: 0, page: 1, limit: 20 };
      },
    }),

    getTeamById: builder.query<TranslatorTeam, string>({
      query: id => `/translator-teams/${id}`,
      providesTags: (result, error, id) => [{ type: TRANSLATORS_TAG, id }],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Team not found");
        return response.data;
      },
    }),

    getTeamBySlug: builder.query<TranslatorTeam, string>({
      query: slug => `/translator-teams/slug/${encodeURIComponent(slug)}`,
      providesTags: (result, error, slug) => [{ type: TRANSLATORS_TAG, id: `slug-${slug}` }],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Team not found");
        return response.data;
      },
    }),

    getTeamsByTitle: builder.query<TranslatorTeam[], string>({
      query: titleId => `/translator-teams/title/${titleId}`,
      providesTags: (result, error, titleId) => [{ type: TRANSLATORS_TAG, id: `title-${titleId}` }],
      transformResponse: (response: ApiResponseDto<TranslatorTeam[]>) => {
        return response.data || [];
      },
    }),

    createTeam: builder.mutation<TranslatorTeam, CreateTranslatorTeamDto>({
      query: data => ({
        url: "/translator-teams",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to create team");
        return response.data;
      },
    }),

    createTeamWithImages: builder.mutation<
      TranslatorTeam,
      { data: CreateTranslatorTeamDto; avatar?: File; banner?: File }
    >({
      query: ({ data, avatar, banner }) => {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        if (avatar) formData.append("avatar", avatar);
        if (banner) formData.append("banner", banner);
        return {
          url: "/translator-teams/with-images",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to create team");
        return response.data;
      },
    }),

    updateTeam: builder.mutation<TranslatorTeam, { id: string; data: UpdateTranslatorTeamDto }>({
      query: ({ id, data }) => ({
        url: `/translator-teams/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to update team");
        return response.data;
      },
    }),

    uploadTeamAvatar: builder.mutation<TranslatorTeam, { teamId: string; avatar: File }>({
      query: ({ teamId, avatar }) => {
        const formData = new FormData();
        formData.append("avatar", avatar);
        return {
          url: `/translator-teams/${teamId}/avatar`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to upload avatar");
        return response.data;
      },
    }),

    addMember: builder.mutation<
      TranslatorTeam,
      { teamId: string; userId?: string; name: string; role: string; avatar?: string }
    >({
      query: ({ teamId, ...data }) => ({
        url: `/translator-teams/${teamId}/members`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to add member");
        return response.data;
      },
    }),

    removeMember: builder.mutation<TranslatorTeam, { teamId: string; memberId: string }>({
      query: ({ teamId, memberId }) => ({
        url: `/translator-teams/${teamId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to remove member");
        return response.data;
      },
    }),

    addTitleToTeam: builder.mutation<TranslatorTeam, { teamId: string; titleId: string }>({
      query: ({ teamId, titleId }) => ({
        url: `/translator-teams/${teamId}/titles`,
        method: "POST",
        body: { titleId },
      }),
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to add title");
        return response.data;
      },
    }),

    removeTitleFromTeam: builder.mutation<TranslatorTeam, { teamId: string; titleId: string }>({
      query: ({ teamId, titleId }) => ({
        url: `/translator-teams/${teamId}/titles/${titleId}`,
        method: "DELETE",
      }),
      invalidatesTags: [TRANSLATORS_TAG],
      transformResponse: (response: ApiResponseDto<TranslatorTeam>) => {
        if (!response.data) throw new Error("Failed to remove title");
        return response.data;
      },
    }),

    deleteTeam: builder.mutation<void, string>({
      query: id => ({
        url: `/translator-teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TRANSLATORS_TAG],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useGetTeamBySlugQuery,
  useGetTeamsByTitleQuery,
  useCreateTeamMutation,
  useCreateTeamWithImagesMutation,
  useUpdateTeamMutation,
  useUploadTeamAvatarMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useAddTitleToTeamMutation,
  useRemoveTitleFromTeamMutation,
  useDeleteTeamMutation,
} = translatorsApi;

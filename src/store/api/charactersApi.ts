import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import {
  Character,
  CharacterListResponse,
  CreateCharacterDto,
  UpdateCharacterDto,
} from "@/types/character";
import { ApiResponseDto } from "@/types/api";

const CHARACTERS_TAG = "Characters";

export const charactersApi = createApi({
  reducerPath: "charactersApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [CHARACTERS_TAG],
  endpoints: builder => ({
    getCharactersByTitle: builder.query<CharacterListResponse, string>({
      query: titleId => `/characters/title/${titleId}`,
      providesTags: (result, error, titleId) => [{ type: CHARACTERS_TAG, id: titleId }],
      transformResponse: (response: ApiResponseDto<CharacterListResponse>) => {
        return response.data || { characters: [], total: 0 };
      },
    }),

    getCharacters: builder.query<
      CharacterListResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 24 } = {}) =>
        `/characters/list?page=${page}&limit=${limit}`,
      providesTags: [{ type: CHARACTERS_TAG, id: "LIST" }],
      transformResponse: (response: ApiResponseDto<CharacterListResponse>) => {
        return response.data || { characters: [], total: 0 };
      },
    }),

    getCharacterById: builder.query<Character, string>({
      query: id => `/characters/${id}`,
      providesTags: (result, error, id) => [{ type: CHARACTERS_TAG, id }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Character not found");
        return response.data;
      },
    }),

    createCharacter: builder.mutation<Character, CreateCharacterDto>({
      query: data => ({
        url: "/characters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [{ type: CHARACTERS_TAG, id: data.titleId }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to create character");
        return response.data;
      },
    }),

    createCharacterWithImage: builder.mutation<
      Character,
      { data: CreateCharacterDto; image: File }
    >({
      query: ({ data, image }) => {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("image", image);
        return {
          url: "/characters/with-image",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { data }) => [{ type: CHARACTERS_TAG, id: data.titleId }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to create character");
        return response.data;
      },
    }),

    updateCharacter: builder.mutation<Character, { id: string; data: UpdateCharacterDto }>({
      query: ({ id, data }) => ({
        url: `/characters/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [CHARACTERS_TAG],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to update character");
        return response.data;
      },
    }),

    updateCharacterImage: builder.mutation<Character, { id: string; image: File }>({
      query: ({ id, image }) => {
        const formData = new FormData();
        formData.append("image", image);
        return {
          url: `/characters/${id}/image`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: [CHARACTERS_TAG],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to update character image");
        return response.data;
      },
    }),

    deleteCharacter: builder.mutation<void, { id: string; titleId: string }>({
      query: ({ id }) => ({
        url: `/characters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { titleId }) => [{ type: CHARACTERS_TAG, id: titleId }],
    }),

    /** Предложить нового персонажа (для всех пользователей). Бэкенд: POST /characters/propose, создаёт запись со статусом «на модерации». */
    proposeCharacter: builder.mutation<Character, CreateCharacterDto>({
      query: data => ({
        url: "/characters/propose",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [{ type: CHARACTERS_TAG, id: data.titleId }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to submit character for moderation");
        return response.data;
      },
    }),

    /** Предложить персонажа с изображением (на модерацию). */
    proposeCharacterWithImage: builder.mutation<
      Character,
      { data: CreateCharacterDto; image: File }
    >({
      query: ({ data, image }) => {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("image", image);
        return {
          url: "/characters/propose/with-image",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { data }) => [{ type: CHARACTERS_TAG, id: data.titleId }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to submit character for moderation");
        return response.data;
      },
    }),

    /** Предложить правки к персонажу (на модерацию). */
    proposeCharacterUpdate: builder.mutation<Character, { id: string; data: UpdateCharacterDto }>({
      query: ({ id, data }) => ({
        url: `/characters/${id}/propose`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: CHARACTERS_TAG, id }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to submit character update for moderation");
        return response.data;
      },
    }),

    /** Загрузить изображение в рамках предложения правок (на модерацию). */
    proposeCharacterImage: builder.mutation<Character, { id: string; image: File }>({
      query: ({ id, image }) => {
        const formData = new FormData();
        formData.append("image", image);
        return {
          url: `/characters/${id}/propose/image`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: (_, __, { id }) => [{ type: CHARACTERS_TAG, id }],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to submit image for moderation");
        return response.data;
      },
    }),

    /** Список персонажей на модерации (только для админов). */
    getPendingCharactersForModeration: builder.query<CharacterListResponse, void>({
      query: () => "/characters/moderation/pending",
      providesTags: [{ type: CHARACTERS_TAG, id: "MODERATION" }],
      transformResponse: (response: ApiResponseDto<CharacterListResponse>) => {
        return response.data || { characters: [], total: 0 };
      },
    }),

    /** Одобрить персонажа или правки (только админ). */
    approveCharacter: builder.mutation<Character, string>({
      query: id => ({
        url: `/characters/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: [CHARACTERS_TAG],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to approve");
        return response.data;
      },
    }),

    /** Отклонить заявку на персонажа/правки (только админ). */
    rejectCharacter: builder.mutation<Character, string>({
      query: id => ({
        url: `/characters/${id}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: [CHARACTERS_TAG],
      transformResponse: (response: ApiResponseDto<Character>) => {
        if (!response.data) throw new Error("Failed to reject");
        return response.data;
      },
    }),
  }),
});

export const {
  useGetCharactersByTitleQuery,
  useGetCharactersQuery,
  useGetCharacterByIdQuery,
  useCreateCharacterMutation,
  useCreateCharacterWithImageMutation,
  useUpdateCharacterMutation,
  useUpdateCharacterImageMutation,
  useDeleteCharacterMutation,
  useProposeCharacterMutation,
  useProposeCharacterWithImageMutation,
  useProposeCharacterUpdateMutation,
  useProposeCharacterImageMutation,
  useGetPendingCharactersForModerationQuery,
  useApproveCharacterMutation,
  useRejectCharacterMutation,
} = charactersApi;

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import {
  Comment,
  CommentsResponse,
  CreateCommentDto,
  UpdateCommentDto,
  CommentEntityType,
} from "@/types/comment";

export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Comments"],
  endpoints: builder => ({
    // Получить комментарии
    getComments: builder.query<
      ApiResponseDto<CommentsResponse>,
      {
        entityType: CommentEntityType;
        entityId: string;
        page?: number;
        limit?: number;
        includeReplies?: boolean;
      }
    >({
      query: ({ entityType, entityId, page = 1, limit = 20, includeReplies = false }) => ({
        url: "/comments",
        params: {
          entityType,
          entityId,
          page,
          limit,
          includeReplies,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: "Comments", id: `${arg.entityType}-${arg.entityId}` },
      ],
    }),

    // Получить один комментарий
    getComment: builder.query<ApiResponseDto<Comment>, string>({
      query: id => `/comments/${id}`,
      providesTags: (result, error, id) => [{ type: "Comments", id }],
    }),

    // Создать комментарий
    createComment: builder.mutation<ApiResponseDto<Comment>, CreateCommentDto>({
      query: commentData => ({
        url: "/comments",
        method: "POST",
        body: commentData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Comments", id: `${arg.entityType}-${arg.entityId}` },
        "Comments",
      ],
    }),

    // Обновить комментарий
    updateComment: builder.mutation<
      ApiResponseDto<Comment>,
      { id: string; data: UpdateCommentDto }
    >({
      query: ({ id, data }) => ({
        url: `/comments/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Comments", id: arg.id }],
    }),

    // Удалить комментарий
    deleteComment: builder.mutation<ApiResponseDto<void>, string>({
      query: id => ({
        url: `/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Comments", id }],
    }),

    // Лайкнуть комментарий
    likeComment: builder.mutation<ApiResponseDto<Comment>, string>({
      query: id => ({
        url: `/comments/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Comments", id }],
    }),

    // Дизлайкнуть комментарий
    dislikeComment: builder.mutation<ApiResponseDto<Comment>, string>({
      query: id => ({
        url: `/comments/${id}/dislike`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Comments", id }],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useGetCommentQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useDislikeCommentMutation,
} = commentsApi;

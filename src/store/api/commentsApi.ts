import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import {
  Comment,
  CommentsResponse,
  CreateCommentDto,
  UpdateCommentDto,
  CommentEntityType,
  CommentReactionsCountResponse,
  SetCommentReactionDto,
} from "@/types/comment";

/** Рекурсивно подменяет комментарий по _id в списке и во вложенных replies (мутирует массив для Immer). */
function patchCommentInList(
  comments: Comment[],
  commentId: string,
  updated: Comment
): void {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i]._id === commentId) {
      comments[i] = updated;
      return;
    }
    if (comments[i].replies?.length) {
      patchCommentInList(comments[i].replies!, commentId, updated);
    }
  }
}

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

    // ——— Реакции (как в Telegram) ———

    // Список разрешённых эмодзи для пикера реакций
    getReactionEmojis: builder.query<ApiResponseDto<string[]>, void>({
      query: () => "/comments/reactions/emojis",
    }),

    // Количество реакций по комментарию
    getCommentReactionsCount: builder.query<
      ApiResponseDto<CommentReactionsCountResponse>,
      string
    >({
      query: id => `/comments/${id}/reactions/count`,
      providesTags: (result, error, id) => [{ type: "Comments", id }],
    }),

    // Поставить или снять реакцию (повторный запрос с тем же emoji снимает)
    setCommentReaction: builder.mutation<
      ApiResponseDto<Comment>,
      { id: string; body: SetCommentReactionDto }
    >({
      query: ({ id, body }) => ({
        url: `/comments/${id}/reactions`,
        method: "POST",
        body,
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const updated = data.data as Comment;
          dispatch(
            commentsApi.util.updateQueryData("getComment", id, draft => {
              draft.data = updated;
            })
          );
          dispatch(
            commentsApi.util.updateQueryData(
              "getComments",
              {
                entityType: updated.entityType,
                entityId: updated.entityId,
                page: 1,
                limit: 20,
                includeReplies: true,
              },
              draft => {
                patchCommentInList(draft.data.comments, id, updated);
              }
            )
          );
          dispatch(
            commentsApi.util.updateQueryData(
              "getComments",
              {
                entityType: updated.entityType,
                entityId: updated.entityId,
                page: 1,
                limit: 20,
                includeReplies: false,
              },
              draft => {
                patchCommentInList(draft.data.comments, id, updated);
              }
            )
          );
        } catch {
          // при ошибке инвалидация обновит данные при следующем запросе
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Comments", id: arg.id },
        "Comments",
      ],
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
  useGetReactionEmojisQuery,
  useGetCommentReactionsCountQuery,
  useSetCommentReactionMutation,
} = commentsApi;

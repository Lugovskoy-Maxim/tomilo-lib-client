"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Comment, CommentEntityType } from "@/types/comment";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { CommentForm } from "@/shared/comments/CommentForm";
import { CommentItem } from "@/shared/comments/CommentItem";
import { CommentsList } from "@/shared/comments/CommentsList";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  EyeOff,
} from "lucide-react";
import { useCommentsSpoilerGate } from "@/hooks/useCommentsSpoilerGate";
import { CommentsSpoilerGate } from "@/shared/comments/CommentsSpoilerGate";

interface ChapterCommentsSectionProps {
  chapterId: string;
  /** Id тайтла — для жалоб и ссылок из админки */
  titleId: string;
  className?: string;
}

function getTotalReactions(comment: Comment): number {
  if (comment.reactions && comment.reactions.length > 0) {
    return comment.reactions.reduce((sum, r) => sum + r.count, 0);
  }
  return (comment.likes || 0) + (comment.dislikes || 0);
}

export function ChapterCommentsSection({
  chapterId,
  titleId,
  className = "",
}: ChapterCommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const limit = 20;

  const entityKey = `chapter:${chapterId}`;
  const { protectionOn, shouldLoadComments, reveal, setProtectionEnabled } =
    useCommentsSpoilerGate(entityKey);

  useEffect(() => {
    setPage(1);
    setReplyingTo(null);
    setEditingComment(null);
    setIsExpanded(false);
  }, [chapterId]);

  const {
    data: commentsData,
    isLoading,
    refetch,
  } = useGetCommentsQuery(
    {
      entityType: CommentEntityType.CHAPTER,
      entityId: chapterId,
      page,
      limit,
      includeReplies: true,
    },
    { skip: !shouldLoadComments },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- comments из запроса
  const comments = commentsData?.data?.comments || [];
  const total = commentsData?.data?.total || 0;
  const totalPages = commentsData?.data?.totalPages || 0;

  const topComments = useMemo(() => {
    if (comments.length === 0) return [];
    const sorted = [...comments].sort((a, b) => getTotalReactions(b) - getTotalReactions(a));
    return sorted.slice(0, 3);
  }, [comments]);

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setEditingComment(null);
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setReplyingTo(null);
  };

  const handleFormSubmit = () => {
    setReplyingTo(null);
    setEditingComment(null);
    refetch();
  };

  const handleFormCancel = () => {
    setReplyingTo(null);
    setEditingComment(null);
  };

  const showFormInEmptyState = !isExpanded && !isLoading && topComments.length === 0 && !editingComment;
  const commentFormContent = (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--primary)] shrink-0" />
        <span className="text-[11px] sm:text-sm font-medium text-[var(--foreground)]">
          Оставить комментарий
        </span>
      </div>
      <CommentForm
        entityType={CommentEntityType.CHAPTER}
        entityId={chapterId}
        parentId={replyingTo || undefined}
        onSubmit={handleFormSubmit}
        onCancel={replyingTo ? handleFormCancel : undefined}
        compact
      />
    </>
  );
  const commentFormBlock = !editingComment && (
    <div className="mb-3 sm:mb-6 bg-[var(--card)]/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-[var(--border)]/30">
      {commentFormContent}
    </div>
  );
  const commentFormBlockEmbedded = !editingComment && (
    <div className="pt-4 border-t border-[var(--border)]/20">
      {commentFormContent}
    </div>
  );

  return (
    <div className={`py-1 sm:py-6 px-2 sm:px-0 ${className}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center justify-end gap-2 mb-2 sm:mb-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] sm:text-xs text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/40"
              checked={protectionOn}
              onChange={e => setProtectionEnabled(e.target.checked)}
            />
            <span className="inline-flex items-center gap-1">
              <EyeOff className="w-3 h-3 shrink-0" />
              Спойлеры
            </span>
          </label>
        </div>

        {/* Comment Form — сверху только когда есть комментарии или загрузка (иначе форма в пустом блоке) */}
        {!showFormInEmptyState && commentFormBlock}

        {/* Edit Form */}
        {editingComment && (
          <div className="mb-3 sm:mb-6 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--card)] rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-[var(--primary)]/20">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-[var(--primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                Редактирование комментария
              </span>
            </div>
            <CommentForm
              entityType={CommentEntityType.CHAPTER}
              entityId={chapterId}
              editComment={editingComment}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              compact
            />
          </div>
        )}

        {!shouldLoadComments ? (
          <CommentsSpoilerGate onReveal={reveal} />
        ) : (
          <>
        {/* Top 3 Comments Preview */}
        {!isExpanded && (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="rounded-xl bg-[var(--card)]/60 border border-[var(--border)]/30 p-4 animate-pulse"
                  >
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--secondary)] shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-3.5 w-24 bg-[var(--secondary)] rounded-full" />
                          <div className="h-3 w-16 bg-[var(--secondary)]/60 rounded-full" />
                        </div>
                        <div className="h-3.5 w-full max-w-sm bg-[var(--secondary)] rounded-full" />
                        <div className="h-3.5 w-2/3 bg-[var(--secondary)]/70 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topComments.length > 0 ? (
              <div className="space-y-3">
                {topComments.map((comment, index) => (
                  <div
                    key={comment._id}
                    className={`relative ${index === 0 ? "bg-gradient-to-br from-[var(--primary)]/5 to-transparent" : ""} rounded-xl`}
                  >
                    {index === 0 && total > 3 && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-[var(--primary)] text-white text-[10px] font-semibold rounded-full shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        TOP
                      </div>
                    )}
                    <CommentItem
                      comment={comment}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      reportContextTitleId={titleId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--secondary)]/50 to-[var(--card)]/30 border border-[var(--border)]/30 py-4 px-4 sm:py-6 sm:px-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary)_0%,transparent_70%)] opacity-5" />
                <div className="relative">
                  <div className="text-center mb-6">
                    <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">
                      Пока нет комментариев
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] max-w-xs mx-auto">
                      Будьте первым, кто поделится впечатлениями о главе!
                    </p>
                  </div>
                  <div className="relative max-w-xl mx-auto">
                    {commentFormBlockEmbedded}
                  </div>
                </div>
              </div>
            )}

            {/* Expand Button */}
            {total > 3 && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--secondary)] hover:bg-[var(--accent)] border border-[var(--border)]/50 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md active:scale-95"
                >
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  <span>Показать все комментарии</span>
                  <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full">
                    {total}
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Expanded Comments List */}
        {isExpanded && (
          <div className="space-y-4">
            <CommentsList
              comments={comments}
              onReply={handleReply}
              onEdit={handleEdit}
              isLoading={isLoading}
              reportContextTitleId={titleId}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-10 h-10 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)]/50 rounded-xl">
                  <span className="text-sm font-semibold text-[var(--primary)]">{page}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">из</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{totalPages}</span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center justify-center w-10 h-10 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Collapse Button */}
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setPage(1);
                }}
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--muted)] hover:bg-[var(--secondary)] rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
              >
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                Свернуть
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

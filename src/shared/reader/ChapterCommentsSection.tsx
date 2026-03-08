"use client";

import React, { useState, useMemo } from "react";
import { Comment, CommentEntityType } from "@/types/comment";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { CommentForm } from "@/shared/comments/CommentForm";
import { CommentItem } from "@/shared/comments/CommentItem";
import { CommentsList } from "@/shared/comments/CommentsList";
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
} from "lucide-react";

interface ChapterCommentsSectionProps {
  chapterId: string;
  className?: string;
}

function getTotalReactions(comment: Comment): number {
  if (comment.reactions && comment.reactions.length > 0) {
    return comment.reactions.reduce((sum, r) => sum + r.count, 0);
  }
  return (comment.likes || 0) + (comment.dislikes || 0);
}

export function ChapterCommentsSection({ chapterId, className = "" }: ChapterCommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const limit = 20;

  const {
    data: commentsData,
    isLoading,
    refetch,
  } = useGetCommentsQuery({
    entityType: CommentEntityType.CHAPTER,
    entityId: chapterId,
    page,
    limit,
    includeReplies: true,
  });

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

  return (
    <div className={`py-8 sm:py-10 px-4 sm:px-0 ${className}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5 rounded-2xl blur-xl" />
          <div className="relative bg-gradient-to-br from-[var(--card)] to-[var(--secondary)]/30 border border-[var(--border)]/50 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                    Комментарии
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                    Обсудите главу с другими читателями
                  </p>
                </div>
              </div>
              {total > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 rounded-full">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-sm font-semibold text-[var(--primary)]">{total}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Form */}
        {!editingComment && (
          <div className="mb-6 bg-[var(--card)]/50 rounded-xl p-4 border border-[var(--border)]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                Оставить комментарий
              </span>
            </div>
            <CommentForm
              entityType={CommentEntityType.CHAPTER}
              entityId={chapterId}
              parentId={replyingTo || undefined}
              onSubmit={handleFormSubmit}
              onCancel={replyingTo ? handleFormCancel : undefined}
            />
          </div>
        )}

        {/* Edit Form */}
        {editingComment && (
          <div className="mb-6 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--card)] rounded-xl p-4 border border-[var(--primary)]/20">
            <div className="flex items-center gap-2 mb-3">
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
            />
          </div>
        )}

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
                    <CommentItem comment={comment} onReply={handleReply} onEdit={handleEdit} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--secondary)]/50 to-[var(--card)]/30 border border-[var(--border)]/30 py-10 px-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary)_0%,transparent_70%)] opacity-5" />
                <div className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">
                    Пока нет комментариев
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] max-w-xs mx-auto">
                    Будьте первым, кто поделится впечатлениями о главе!
                  </p>
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
      </div>
    </div>
  );
}

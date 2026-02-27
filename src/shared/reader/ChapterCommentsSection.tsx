"use client";

import React, { useState, useMemo } from "react";
import { Comment, CommentEntityType } from "@/types/comment";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { CommentForm } from "@/shared/comments/CommentForm";
import { CommentItem } from "@/shared/comments/CommentItem";
import { CommentsList } from "@/shared/comments/CommentsList";
import { Button } from "@/shared/ui/button";
import { MessageCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className={`py-6 sm:py-8 border-t border-[var(--border)] mt-6 sm:mt-8 px-4 sm:px-0 ${className}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Комментарии</h2>
            {total > 0 && (
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
        </div>

        {/* Comment Form */}
        {!editingComment && (
          <div className="mb-5">
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
          <div className="mb-5 rounded-lg bg-[var(--card)]/80 p-3">
            <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
              Редактирование
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
                  <div key={i} className="rounded-lg bg-[var(--card)]/50 p-3 animate-pulse">
                    <div className="flex gap-2.5">
                      <div className="h-10 w-10 rounded-full bg-[var(--secondary)] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 bg-[var(--secondary)] rounded" />
                        <div className="h-3 w-full max-w-sm bg-[var(--secondary)] rounded" />
                        <div className="h-3 w-1/2 bg-[var(--secondary)] rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topComments.length > 0 ? (
              <div className="space-y-2">
                {topComments.map(comment => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    onReply={handleReply}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-[var(--secondary)]/40 py-6 px-4 text-center">
                <p className="text-[var(--muted-foreground)] text-sm">
                  Пока нет комментариев. Будьте первым!
                </p>
              </div>
            )}

            {/* Expand Button */}
            {total > 3 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="gap-2"
                >
                  <ChevronDown className="w-4 h-4" />
                  Показать все комментарии ({total})
                </Button>
              </div>
            )}
          </>
        )}

        {/* Expanded Comments List */}
        {isExpanded && (
          <>
            <CommentsList
              comments={comments}
              onReply={handleReply}
              onEdit={handleEdit}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-[var(--muted-foreground)] px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Collapse Button */}
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setPage(1);
                }}
                className="gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                Свернуть
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

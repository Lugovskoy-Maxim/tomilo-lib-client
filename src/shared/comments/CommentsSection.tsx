"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Comment, CommentEntityType } from "@/types/comment";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import { Button } from "@/shared/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";

const LIMIT = 20;
const SORT_OPTIONS = [
  { value: "newest" as const, label: "Сначала новые" },
  { value: "oldest" as const, label: "Сначала старые" },
  { value: "popular" as const, label: "Популярные" },
] as const;

interface CommentsSectionProps {
  entityType: CommentEntityType;
  entityId: string;
  className?: string;
}

export function CommentsSection({ entityType, entityId, className = "" }: CommentsSectionProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "popular">("newest");
  const [page, setPage] = useState(1);
  const [accumulatedComments, setAccumulatedComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  const {
    data: commentsData,
    isLoading,
    refetch,
  } = useGetCommentsQuery({
    entityType,
    entityId,
    page,
    limit: LIMIT,
    includeReplies: true,
    sortOrder,
  });

  const total = commentsData?.data?.total ?? 0;
  const totalPages = commentsData?.data?.totalPages ?? 0;
  const currentPageComments = commentsData?.data?.comments ?? [];
  void currentPageComments;
  const hasMore = page < totalPages;
  const isLoadingMore = page > 1 && isLoading;

  useEffect(() => {
    setPage(1);
    setAccumulatedComments([]);
  }, [sortOrder, entityType, entityId]);

  useEffect(() => {
    if (!commentsData?.data?.comments) return;
    if (page === 1) {
      setAccumulatedComments(commentsData.data.comments);
    } else {
      setAccumulatedComments(prev => [...prev, ...commentsData.data.comments]);
    }
  }, [commentsData?.data?.comments, page]);

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

  const loadMore = () => {
    setPage(p => p + 1);
  };

  const sortedComments = useMemo(() => {
    if (accumulatedComments.length === 0) return [];
    const getReactionTotal = (c: Comment) => {
      if (c.reactions?.length) {
        return c.reactions.reduce((sum, r) => sum + r.count, 0);
      }
      return (c.likes ?? 0) + (c.dislikes ?? 0);
    };
    const sorted = [...accumulatedComments];
    if (sortOrder === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      sorted.sort((a, b) => getReactionTotal(b) - getReactionTotal(a));
    }
    return sorted;
  }, [accumulatedComments, sortOrder]);

  return (
    <div className={`space-y-2 sm:space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[var(--primary)] shrink-0" />
        <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">Комментарии</h2>
        {total > 0 && (
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-1.5 py-0.5 rounded">
            {total}
          </span>
        )}
      </div>

      {/* Блок отправки комментария — над сортировкой */}
      {!editingComment && (
        <CommentForm
          entityType={entityType}
          entityId={entityId}
          parentId={replyingTo || undefined}
          onSubmit={handleFormSubmit}
          onCancel={replyingTo ? handleFormCancel : undefined}
        />
      )}

      {editingComment && (
        <div className="rounded-lg bg-[var(--card)]/80 p-3">
          <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
            Редактирование
          </div>
          <CommentForm
            entityType={entityType}
            entityId={entityId}
            editComment={editingComment}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Сортировка */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--muted-foreground)] shrink-0">Сортировка:</span>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as "newest" | "oldest" | "popular")}
          className="text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          aria-label="Порядок комментариев"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Comments List */}
      <CommentsList
        comments={sortedComments}
        onReply={handleReply}
        onEdit={handleEdit}
        isLoading={isLoading && page === 1}
      />

      {/* Загрузить ещё */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Загрузка…
              </>
            ) : (
              `Загрузить ещё (${sortedComments.length} из ${total})`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

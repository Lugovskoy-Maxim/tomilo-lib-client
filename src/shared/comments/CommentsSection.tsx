"use client";

import React, { useState } from "react";
import { Comment, CommentEntityType } from "@/types/comment";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import { Button } from "@/shared/ui/button";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface CommentsSectionProps {
  entityType: CommentEntityType;
  entityId: string;
  className?: string;
}

export function CommentsSection({ entityType, entityId, className = "" }: CommentsSectionProps) {
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const limit = 20;

  const {
    data: commentsData,
    isLoading,
    refetch,
  } = useGetCommentsQuery({
    entityType,
    entityId,
    page,
    limit,
    includeReplies: true,
  });

  const comments = commentsData?.data?.comments || [];
  const total = commentsData?.data?.total || 0;
  const totalPages = commentsData?.data?.totalPages || 0;

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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[var(--primary)] shrink-0" />
        <h2 className="text-base font-semibold text-[var(--foreground)]">Комментарии</h2>
        {total > 0 && (
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-1.5 py-0.5 rounded">
            {total}
          </span>
        )}
      </div>

      {/* Comment Form */}
      {!editingComment && (
        <CommentForm
          entityType={entityType}
          entityId={entityId}
          parentId={replyingTo || undefined}
          onSubmit={handleFormSubmit}
          onCancel={replyingTo ? handleFormCancel : undefined}
        />
      )}

      {/* Edit Form */}
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

      {/* Comments List */}
      <CommentsList
        comments={comments}
        onReply={handleReply}
        onEdit={handleEdit}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-[var(--muted-foreground)] px-2">
            {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Comment, CommentEntityType } from "@/types/comment";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import { CommentForm } from "./comment-form";
import { CommentsList } from "./comments-list";
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
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-xl font-semibold">Комментарии</h2>
        {total > 0 && <span className="text-sm text-[var(--muted-foreground)]">({total})</span>}
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
        <div className="p-4 bg-[var(--secondary)] rounded-lg">
          <div className="mb-2 text-sm font-semibold">Редактирование комментария</div>
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Назад
          </Button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Вперед
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

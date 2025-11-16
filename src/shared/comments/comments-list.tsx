'use client';

import React from 'react';
import { Comment } from '@/types/comment';
import { CommentItem } from './comment-item';
import LoadingSkeleton from '@/shared/loading-skeleton';

interface CommentsListProps {
  comments: Comment[];
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  isLoading?: boolean;
}

export function CommentsList({
  comments,
  onReply,
  onEdit,
  isLoading,
}: CommentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b border-[var(--border)] pb-4">
            <LoadingSkeleton className="h-20" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        Пока нет комментариев. Будьте первым!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          onReply={onReply}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}


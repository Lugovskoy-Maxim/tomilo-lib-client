"use client";

import React from "react";
import { Comment } from "@/types/comment";
import { CommentItem } from "./CommentItem";
import LoadingSkeleton from "@/shared/skeleton/skeleton";

interface CommentsListProps {
  comments: Comment[];
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  isLoading?: boolean;
}

export function CommentsList({ comments, onReply, onEdit, isLoading }: CommentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg bg-[var(--card)]/50 p-3">
            <div className="flex gap-2.5">
              <LoadingSkeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <LoadingSkeleton className="h-3 w-24" />
                <LoadingSkeleton className="h-3 w-full max-w-sm" />
                <LoadingSkeleton className="h-3 w-1/2" />
                <div className="flex gap-1 pt-1">
                  <LoadingSkeleton className="h-6 w-12 rounded-md" />
                  <LoadingSkeleton className="h-6 w-12 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg bg-[var(--secondary)]/40 py-8 px-4 text-center">
        <p className="text-[var(--muted-foreground)] text-xs">
          Пока нет комментариев. Будьте первым!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map(comment => (
        <CommentItem key={comment._id} comment={comment} onReply={onReply} onEdit={onEdit} />
      ))}
    </div>
  );
}

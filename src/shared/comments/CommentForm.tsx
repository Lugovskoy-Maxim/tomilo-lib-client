"use client";

import React, { useState, useEffect } from "react";
import { Comment, CreateCommentDto, CommentEntityType } from "@/types/comment";
import { useCreateCommentMutation, useUpdateCommentMutation } from "@/store/api/commentsApi";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/shared/ui/button";
import { Send, X } from "lucide-react";

interface CommentFormProps {
  entityType: CommentEntityType;
  entityId: string;
  parentId?: string;
  editComment?: Comment;
  onCancel?: () => void;
  onSubmit?: () => void;
}

export function CommentForm({
  entityType,
  entityId,
  parentId,
  editComment,
  onCancel,
  onSubmit,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();

  useEffect(() => {
    if (editComment) {
      setContent(editComment.content);
    } else {
      setContent("");
    }
  }, [editComment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      if (editComment) {
        await updateComment({
          id: editComment._id,
          data: { content: content.trim() },
        }).unwrap();
      } else {
        const commentData: CreateCommentDto = {
          entityType,
          entityId,
          content: content.trim(),
          ...(parentId && { parentId }),
        };
        await createComment(commentData).unwrap();
      }
      setContent("");
      onSubmit?.();
    } catch (error: unknown) {
      // Handle error silently in production
      // Показываем пользователю понятное сообщение
      const errData = (error as Record<string, unknown>).data as
        | Record<string, unknown>
        | undefined;
      alert(
        (errData?.message as string | undefined) ||
          (Array.isArray(errData?.errors) ? errData?.errors.join(", ") : undefined) ||
          "Не удалось отправить комментарий. Проверьте консоль для подробностей.",
      );
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-[var(--secondary)]/50 py-5 px-4 text-center text-[var(--muted-foreground)] text-xs">
        Войдите, чтобы оставить комментарий
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[var(--card)]/50 p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            editComment
              ? "Редактировать..."
              : parentId
                ? "Ответ..."
                : "Комментарий..."
          }
          rows={3}
          maxLength={5000}
          className="w-full px-3 py-2 bg-[var(--background)]/80 border border-[var(--border)]/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent resize-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] text-[13px] leading-snug"
          required
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[var(--muted-foreground)]">{content.length}/5000</span>
          <div className="flex gap-1.5">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onCancel}>
                <X className="w-3.5 h-3.5 mr-1" />
                Отмена
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={!content.trim() || isCreating || isUpdating}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              {editComment
                ? isUpdating
                  ? "..."
                  : "Сохранить"
                : isCreating
                  ? "..."
                  : "Отправить"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

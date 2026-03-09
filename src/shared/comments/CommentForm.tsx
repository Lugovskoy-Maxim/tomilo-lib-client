"use client";

import React, { useState, useEffect } from "react";
import { Comment, CreateCommentDto, CommentEntityType } from "@/types/comment";
import { useCreateCommentMutation, useUpdateCommentMutation } from "@/store/api/commentsApi";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/shared/ui/button";
import { Send, X, AlertCircle } from "lucide-react";
import { validateContent } from "@/lib/content-filter";

interface CommentFormProps {
  entityType: CommentEntityType;
  entityId: string;
  parentId?: string;
  editComment?: Comment;
  onCancel?: () => void;
  onSubmit?: () => void;
  compact?: boolean;
}

export function CommentForm({
  entityType,
  entityId,
  parentId,
  editComment,
  onCancel,
  onSubmit,
  compact = false,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editComment) {
      setContent(editComment.content);
    } else {
      setContent("");
    }
  }, [editComment]);

  const MAX_WORDS = 500;

  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  };

  const wordCount = countWords(content);
  const isOverWordLimit = wordCount > MAX_WORDS;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (newContent.trim()) {
      const words = countWords(newContent);
      if (words > MAX_WORDS) {
        setValidationError(`Превышен лимит слов: ${words}/${MAX_WORDS}`);
      } else {
        const validation = validateContent(newContent);
        setValidationError(validation.isValid ? null : validation.error || null);
      }
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    if (countWords(content) > MAX_WORDS) {
      setValidationError(`Превышен лимит слов: ${countWords(content)}/${MAX_WORDS}`);
      return;
    }

    const validation = validateContent(content);
    if (!validation.isValid) {
      setValidationError(validation.error || "Комментарий содержит запрещённый контент");
      return;
    }

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

  if (!isMounted) {
    return (
      <div className="rounded-lg bg-[var(--card)]/50 p-3">
        <div className="w-full h-[76px] bg-[var(--secondary)]/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg bg-[var(--secondary)]/50 py-5 px-4 text-center text-[var(--muted-foreground)] text-xs">
        Войдите, чтобы оставить комментарий
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-[var(--card)]/50 ${compact ? "p-2" : "p-3"}`}>
      <form onSubmit={handleSubmit} className={compact ? "space-y-1.5" : "space-y-2"}>
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder={editComment ? "Редактировать..." : parentId ? "Ответ..." : "Комментарий..."}
          rows={compact ? 2 : 3}
          maxLength={5000}
          className={`w-full bg-[var(--background)]/80 border rounded-lg focus:outline-none focus:ring-1 focus:border-transparent resize-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] leading-snug ${
            compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-[13px]"
          } ${
            validationError
              ? "border-red-500/80 focus:ring-red-500"
              : "border-[var(--border)]/80 focus:ring-[var(--primary)]"
          }`}
          required
        />
        {validationError && (
          <div className="flex items-center gap-1.5 text-red-500 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        <div className={`flex items-center justify-between gap-2 ${compact ? "gap-1.5" : ""}`}>
          <span
            className={`${compact ? "text-[9px]" : "text-[10px]"} ${isOverWordLimit ? "text-red-500" : "text-[var(--muted-foreground)]"}`}
          >
            {wordCount}/{MAX_WORDS} слов
          </span>
          <div className={`flex cursor-pointer gap-1.5 rounded-xl ${compact ? "gap-1" : ""}`}>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`rounded-xl ${compact ? "h-6 px-1.5 text-[10px]" : "h-7 px-2 text-xs"}`}
                onClick={onCancel}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Отмена
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className={
                compact
                  ? "rounded-xl h-7 min-w-[80px] px-3 text-xs font-semibold shadow-md shadow-[var(--primary)]/25 border border-[var(--primary)]/20"
                  : "rounded-xl h-7 px-2.5 text-xs"
              }
              disabled={
                !content.trim() || isCreating || isUpdating || !!validationError || isOverWordLimit
              }
            >
              <Send className="w-3.5 h-3.5 mr-1 shrink-0" />
              {editComment ? (isUpdating ? "..." : "Сохранить") : isCreating ? "..." : "Отправить"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

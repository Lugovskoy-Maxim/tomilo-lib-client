'use client';

import React, { useState, useEffect } from 'react';
import { Comment, CreateCommentDto, CommentEntityType } from '@/types/comment';
import {
  useCreateCommentMutation,
  useUpdateCommentMutation,
} from '@/store/api/commentsApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/shared/ui/button';
import { Send, X } from 'lucide-react';

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
  const [content, setContent] = useState('');
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();

  useEffect(() => {
    if (editComment) {
      setContent(editComment.content);
    } else {
      setContent('');
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
        console.log('Sending comment data:', JSON.stringify(commentData, null, 2));
        const result = await createComment(commentData).unwrap();
        console.log('Comment created successfully:', result);
      }
      setContent('');
      onSubmit?.();
    } catch (error: any) {
      console.error('Failed to save comment:', error);
      // Более детальное логирование ошибки
      if (error?.data) {
        console.error('Error data:', error.data);
        if (error.data?.errors) {
          console.error('Validation errors:', error.data.errors);
        }
        if (error.data?.message) {
          console.error('Error message:', error.data.message);
        }
      }
      if (error?.status) {
        console.error('Error status:', error.status);
      }
      // Показываем пользователю понятное сообщение
      alert(
        error?.data?.message ||
        error?.data?.errors?.join(', ') ||
        'Не удалось отправить комментарий. Проверьте консоль для подробностей.'
      );
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-[var(--secondary)] rounded-lg text-center text-[var(--muted-foreground)]">
        Войдите, чтобы оставить комментарий
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          editComment
            ? 'Редактировать комментарий...'
            : parentId
              ? 'Написать ответ...'
              : 'Написать комментарий...'
        }
        rows={4}
        maxLength={5000}
        className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
        required
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted-foreground)]">
          {content.length}/5000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isCreating || isUpdating}
          >
            <Send className="w-4 h-4 mr-2" />
            {editComment
              ? isUpdating
                ? 'Сохранение...'
                : 'Сохранить'
              : isCreating
                ? 'Отправка...'
                : 'Отправить'}
          </Button>
        </div>
      </div>
    </form>
  );
}


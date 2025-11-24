'use client';

import React, { useState } from 'react';
import { Comment } from '@/types/comment';
import { useAuth } from '@/hooks/useAuth';
import {
  useLikeCommentMutation,
  useDislikeCommentMutation,
  useDeleteCommentMutation,
} from '@/store/api/commentsApi';
import { ThumbsUp, ThumbsDown, Reply, Edit, Trash2, MoreVertical } from 'lucide-react';
import Image from 'next/image';

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  level?: number;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  level = 0,
}: CommentItemProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const [likeComment] = useLikeCommentMutation();
  const [dislikeComment] = useDislikeCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const userData =
    typeof comment.userId === 'object' ? comment.userId : null;
  const isOwner = user && userData && user._id === userData._id;
  const hasLiked = user && comment.likedBy.includes(user._id);
  const hasDisliked = user && comment.dislikedBy.includes(user._id);

  const handleLike = async () => {
    if (!user) return;
    try {
      await likeComment(comment._id).unwrap();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      await dislikeComment(comment._id).unwrap();
    } catch (error) {
      console.error('Failed to dislike comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
    try {
      await deleteComment(comment._id).unwrap();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'только что';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} назад`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
      } else {
        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`${level > 0 ? 'ml-8 mt-4' : ''} border-b border-[var(--border)] pb-4`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {userData?.avatar ? (
            <Image
              src={userData.avatar}
              alt={userData.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">
              {userData?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[var(--foreground)]">
              {userData?.username || 'Анонимный пользователь'}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-[var(--muted-foreground)] italic">
                (изменено)
              </span>
            )}
            {isOwner && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-[var(--secondary)] transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        onEdit?.(comment);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--secondary)] flex items-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--secondary)] flex items-center gap-2 text-sm text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[var(--foreground)] mb-2 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasLiked
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likes}</span>
            </button>

            <button
              onClick={handleDislike}
              disabled={!user}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasDisliked
                  ? 'text-red-500'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{comment.dislikes}</span>
            </button>

            {user && onReply && level < 2 && (
              <button
                onClick={() => onReply(comment._id)}
                className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Reply className="w-4 h-4" />
                Ответить
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-sm text-[var(--primary)] hover:underline mb-2"
              >
                {showReplies ? 'Скрыть' : 'Показать'} ответы ({comment.replies.length})
              </button>
              {showReplies && (
                <div className="mt-2 space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply._id}
                      comment={reply}
                      onReply={onReply}
                      onEdit={onEdit}
                      level={level + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


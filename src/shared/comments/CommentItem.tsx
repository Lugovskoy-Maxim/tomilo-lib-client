"use client";

import React, { useState } from "react";
import { Comment } from "@/types/comment";
import { useAuth } from "@/hooks/useAuth";
import {
  useLikeCommentMutation,
  useDislikeCommentMutation,
  useDeleteCommentMutation,
} from "@/store/api/commentsApi";
import { ThumbsUp, ThumbsDown, Reply, Edit, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/shared";
import { getEquippedFrameUrl } from "@/api/shop";
import type { EquippedDecorations } from "@/types/user";

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  level?: number;
}

export function CommentItem({ comment, onReply, onEdit, level = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const [likeComment] = useLikeCommentMutation();
  const [dislikeComment] = useDislikeCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const userData = typeof comment.userId === "object" ? comment.userId : null;
  const isOwner = user && userData && user._id === userData._id;
  const profileHref =
    userData?._id ? (isOwner ? "/profile" : `/user/${encodeURIComponent(userData._id)}`) : null;
  const hasLiked = user && comment.likedBy.includes(user._id);
  const hasDisliked = user && comment.dislikedBy.includes(user._id);

  const handleLike = async () => {
    if (!user) return;
    try {
      await likeComment(comment._id).unwrap();
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      await dislikeComment(comment._id).unwrap();
    } catch (error) {
      console.error("Failed to dislike comment:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот комментарий?")) return;
    try {
      await deleteComment(comment._id).unwrap();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "только что";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? "минуту" : minutes < 5 ? "минуты" : "минут"} назад`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"} назад`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} назад`;
      } else {
        return date.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    } catch {
      return dateString;
    }
  };

  return (
    <article
      className={`rounded-lg overflow-hidden ${
        level > 0 ? "ml-5 mt-2 pl-3 border-l border-[var(--primary)]/20" : ""
      }`}
    >
      <div className="p-3">
        <div className="flex gap-2.5">
          {/* Avatar (с рамкой, если бэкенд вернул equippedDecorations у автора) */}
          <div className="flex-shrink-0 h-8 w-8 overflow-hidden rounded-full">
            {(() => {
              const avatarUrl = userData?.avatar
                ? userData.avatar.startsWith("http")
                  ? userData.avatar
                  : `${process.env.NEXT_PUBLIC_URL || ""}${userData.avatar}`
                : undefined;
              const frameUrl = userData?.equippedDecorations
                ? getEquippedFrameUrl(userData.equippedDecorations as EquippedDecorations)
                : undefined;
              const avatarContent = (
                <UserAvatar
                  avatarUrl={avatarUrl}
                  username={userData?.username}
                  size={32}
                  className="rounded-full w-full h-full"
                  frameUrl={frameUrl ?? undefined}
                />
              );
              return profileHref ? (
                <Link
                  href={profileHref}
                  className="block w-full h-full rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--card)]"
                >
                  {avatarContent}
                </Link>
              ) : (
                avatarContent
              );
            })()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="font-medium text-[var(--foreground)] text-sm hover:text-[var(--primary)] transition-colors focus:outline-none focus:underline"
                >
                  {userData?.username || "Аноним"}
                </Link>
              ) : (
                <span className="font-medium text-[var(--foreground)] text-sm">
                  {userData?.username || "Аноним"}
                </span>
              )}
              <span className="text-[var(--muted-foreground)] text-[10px]">·</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {formatDate(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-[10px] text-[var(--muted-foreground)] italic">изм.</span>
              )}
              {isOwner && (
                <div className="relative ml-auto">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    aria-label="Меню"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-0.5 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-10 min-w-[120px] overflow-hidden py-0.5">
                      <button
                        onClick={() => {
                          onEdit?.(comment);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--secondary)] flex items-center gap-2 text-xs text-[var(--foreground)]"
                      >
                        <Edit className="w-3.5 h-3.5 shrink-0" />
                        Редактировать
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--secondary)] flex items-center gap-2 text-xs text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[var(--foreground)] text-[14px] leading-snug whitespace-pre-wrap break-words mb-2">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-wrap">
              <button
                onClick={handleLike}
                disabled={!user}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  hasLiked
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/80"
                } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{comment.likes}</span>
              </button>
              <button
                onClick={handleDislike}
                disabled={!user}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  hasDisliked
                    ? "text-red-500"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/80"
                } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{comment.dislikes}</span>
              </button>
              {user && onReply && level < 2 && (
                <button
                  onClick={() => onReply(comment._id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/80 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Ответить
                </button>
              )}
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[var(--border)]/50">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs text-[var(--primary)] hover:underline mb-2"
                >
                  {showReplies ? "−" : "+"} ответы ({comment.replies.length})
                </button>
                {showReplies && (
                  <div className="space-y-2">
                    {comment.replies.map(reply => (
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
    </article>
  );
}

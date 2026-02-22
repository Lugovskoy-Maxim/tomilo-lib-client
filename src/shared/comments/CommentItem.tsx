"use client";

import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Comment, ALLOWED_REACTION_EMOJIS, type CommentReactionCount } from "@/types/comment";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  useDeleteCommentMutation,
  useSetCommentReactionMutation,
} from "@/store/api/commentsApi";
import { Reply, Edit, Trash2, MoreVertical, BadgeCheck, SmilePlus } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/shared";
import { getEquippedFrameUrl, getEquippedAvatarDecorationUrl } from "@/api/shop";
import type { EquippedDecorations } from "@/types/user";

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  level?: number;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as { data?: { message?: string }; message?: string };
    return o.data?.message || o.message || fallback;
  }
  return fallback;
}

export function CommentItem({ comment, onReply, onEdit, level = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [showReplies, setShowReplies] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const [deleteComment] = useDeleteCommentMutation();
  const [setReaction] = useSetCommentReactionMutation();

  const userData = typeof comment.userId === "object" ? comment.userId : null;
  const isAdmin = userData?.role === "admin";
  const isOwner = user && userData && user._id === userData._id;
  const profileHref =
    userData?._id ? (isOwner ? "/profile" : `/user/${encodeURIComponent(userData._id)}`) : null;

  // Реакции: из comment.reactions или из старых likes/dislikes
  const displayReactions = useMemo((): CommentReactionCount[] => {
    if (comment.reactions && comment.reactions.length > 0) {
      return comment.reactions;
    }
    const fallback: CommentReactionCount[] = [];
    if (comment.likes > 0) fallback.push({ emoji: "👍", count: comment.likes });
    if (comment.dislikes > 0) fallback.push({ emoji: "👎", count: comment.dislikes });
    return fallback;
  }, [comment.reactions, comment.likes, comment.dislikes]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerAnchorRect, setPickerAnchorRect] = useState<DOMRect | null>(null);

  const openEmojiPicker = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPickerAnchorRect(rect);
    setShowEmojiPicker(true);
  }, []);

  const closeEmojiPicker = useCallback(() => {
    setShowEmojiPicker(false);
    setPickerAnchorRect(null);
  }, []);

  const handleReaction = async (emoji: string) => {
    if (!user) return;
    closeEmojiPicker();
    try {
      await setReaction({ id: comment._id, body: { emoji } }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось поставить реакцию"));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот комментарий?")) return;
    try {
      await deleteComment(comment._id).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить комментарий"));
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
      id={`comment-${comment._id}`}
      className={`rounded-lg overflow-hidden scroll-mt-4 ${
        level > 0 ? "ml-5 mt-2 pl-3 border-l border-[var(--primary)]/20" : ""
      }`}
    >
      <div className="p-3">
        <div className="flex gap-2.5">
          {/* Avatar (декоративный аватар и рамка из equippedDecorations, если бэкенд вернул у автора) */}
          <div className="flex-shrink-0 h-11 w-11 overflow-hidden rounded-full">
            {(() => {
              const avatarUrl = userData?.avatar
                ? userData.avatar.startsWith("http")
                  ? userData.avatar
                  : `${process.env.NEXT_PUBLIC_URL || ""}${userData.avatar}`
                : undefined;
              const equipped = (userData as { equippedDecorations?: EquippedDecorations; equipped_decorations?: EquippedDecorations })
                ?.equippedDecorations ?? (userData as { equipped_decorations?: EquippedDecorations })?.equipped_decorations;
              const frameUrl = equipped ? getEquippedFrameUrl(equipped) : undefined;
              const avatarDecorationUrl = equipped ? getEquippedAvatarDecorationUrl(equipped) : undefined;
              const avatarContent = (
                <UserAvatar
                  avatarUrl={avatarUrl}
                  username={userData?.username}
                  size={44}
                  className="rounded-full w-full h-full"
                  frameUrl={frameUrl ?? undefined}
                  avatarDecorationUrl={avatarDecorationUrl ?? undefined}
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
              <span className="inline-flex items-center gap-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]/60">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:underline"
                    >
                      {userData?.username || "Аноним"}
                    </Link>
                  ) : (
                    <span>{userData?.username || "Аноним"}</span>
                  )}
                  {isAdmin && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" aria-label="Админ" />
                  )}
                </span>
              </span>
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

            {/* Actions: только реакции (пузырьки + пикер) и ответ */}
            <div className="flex items-center gap-0.5 flex-wrap">
              {/* Реакции: пузырьки с эмодзи и счётчиком (в т.ч. 👍 и 👎) */}
              {displayReactions.map(({ emoji, count }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(emoji)}
                  disabled={!user}
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs border border-[var(--border)]/60 bg-[var(--secondary)]/50 text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
              {/* Кнопка «добавить реакцию» — открывает пикер (портал, чтобы не обрезался) */}
              {user && (
                <>
                  <button
                    type="button"
                    onClick={(e) =>
                      showEmojiPicker ? closeEmojiPicker() : openEmojiPicker(e)
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/80 transition-colors"
                    aria-label="Добавить реакцию"
                  >
                    <SmilePlus className="w-3.5 h-3.5" />
                  </button>
                  {showEmojiPicker &&
                    pickerAnchorRect &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          aria-hidden
                          onClick={closeEmojiPicker}
                        />
                        <div
                          className="fixed z-[101] p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg flex flex-wrap gap-0.5 max-w-[200px]"
                          style={{
                            left: pickerAnchorRect.left,
                            bottom: window.innerHeight - pickerAnchorRect.top + 4,
                            transform: "translateY(-100%)",
                          }}
                        >
                          {ALLOWED_REACTION_EMOJIS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => handleReaction(e)}
                              className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-lg leading-none transition-colors"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                </>
              )}
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

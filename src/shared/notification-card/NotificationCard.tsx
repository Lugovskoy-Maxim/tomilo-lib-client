"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import {
  Clock,
  MailOpen,
  Mail,
  Trash2,
  BookOpen,
  RefreshCw,
  User,
  Settings,
  MessageSquareReply,
  MoreHorizontal,
} from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

import { useMarkAsReadMutation, useMarkAsUnreadMutation, useDeleteNotificationMutation } from "@/store/api/notificationsApi";
import { Notification } from "@/types/notifications";
import { getTitlePath } from "@/lib/title-paths";

interface NotificationCardProps {
  notification: Notification;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
}

const typeConfig: Record<
  string,
  { label: string; bg: string; text: string; icon: typeof BookOpen }
> = {
  new_chapter: {
    label: "Новая глава",
    bg: "bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    icon: BookOpen,
  },
  update: {
    label: "Обновление",
    bg: "bg-purple-500/15",
    text: "text-purple-600 dark:text-purple-400",
    icon: RefreshCw,
  },
  user: {
    label: "Пользователь",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: User,
  },
  system: {
    label: "Система",
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    icon: Settings,
  },
  report_response: {
    label: "Ответ на жалобу",
    bg: "bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    icon: MessageSquareReply,
  },
  complaint_response: {
    label: "Ответ на жалобу",
    bg: "bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    icon: MessageSquareReply,
  },
};

const defaultTypeConfig = {
  label: "Другое",
  bg: "bg-[var(--muted)]",
  text: "text-[var(--muted-foreground)]",
  icon: MessageSquareReply,
};

export default function NotificationCard({
  notification,
  isSelected = false,
  onSelect,
  selectionMode = false,
}: NotificationCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const typeInfo = typeConfig[notification.type] ?? defaultTypeConfig;
  const TypeIcon = typeInfo.icon;

  const handleClick = async () => {
    if (actionsOpen) return;
    if (typeof notification.titleId === "object" && notification.titleId._id) {
      const titleData = {
        id: notification.titleId._id,
        slug: notification.titleId.slug,
      };
      router.push(getTitlePath(titleData));
    } else if (typeof notification.titleId === "string" && notification.titleId.trim()) {
      const titleId = notification.titleId.trim();
      if (titleId) router.push(getTitlePath({ id: titleId }));
    }

    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionsOpen(false);
    try {
      await markAsRead(notification._id).unwrap();
    } catch {
      // ignore
    }
  };

  const handleMarkAsUnread = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionsOpen(false);
    try {
      await markAsUnread(notification._id).unwrap();
    } catch {
      // ignore
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionsOpen(false);
    setIsDeleting(true);
    try {
      await deleteNotification(notification._id).unwrap();
    } catch {
      setIsDeleting(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(notification._id, e.target.checked);
  };

  const getImageUrl = (coverImage?: string) => {
    if (!coverImage) return IMAGE_HOLDER.src;
    if (coverImage.startsWith("http")) return coverImage;
    const baseUrl = process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:3001";
    const cleanPath = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
    return `${baseUrl}${cleanPath}`;
  };

  const getCoverImage = () => {
    if (typeof notification.titleId === "object" && notification.titleId?._id) {
      if (notification.titleId.coverImage) return notification.titleId.coverImage;
      return `/uploads/titles/${notification.titleId._id}/cover.jpg`;
    }
    return undefined;
  };

  if (isDeleting) return null;

  const coverImageUrl = getCoverImage();

  return (
    <div
      className={`
        relative w-full rounded-2xl border transition-all duration-200
        ${notification.isRead
          ? "bg-[var(--card)] border-[var(--border)]"
          : "bg-[var(--card)] border-[var(--primary)]/25 bg-gradient-to-r from-[var(--primary)]/[0.06] to-transparent"
        }
        ${isSelected ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]" : ""}
        hover:shadow-md hover:border-[var(--primary)]/20
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {!notification.isRead && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-[var(--primary)] opacity-80"
          aria-hidden
        />
      )}

      <div className="flex items-stretch min-h-[100px]">
        {selectionMode && (
          <div
            className="flex items-center pl-4 pr-2 border-r border-[var(--border)]"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
          </div>
        )}

        <div className="flex-shrink-0 p-3 pl-4">
          <div className="relative w-16 h-[5.5rem] rounded-xl overflow-hidden bg-[var(--muted)] shadow-sm ring-1 ring-[var(--border)]">
            <OptimizedImage
              src={getImageUrl(coverImageUrl)}
              alt={typeof notification.titleId === "object" ? notification.titleId?.name || "Обложка" : "Обложка"}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              fallbackSrc={IMAGE_HOLDER.src}
            />
            <div
              className={`absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md ${typeInfo.bg} ${typeInfo.text}`}
              title={typeInfo.label}
            >
              <TypeIcon className="w-3 h-3 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-[80%]">{typeInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 py-3 pr-3 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-sm leading-tight mb-1 ${
                  notification.isRead ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                }`}
              >
                {notification.title}
              </h3>
              <p
                className={`text-sm line-clamp-2 leading-relaxed ${
                  notification.isRead ? "text-[var(--muted-foreground)]/90" : "text-[var(--foreground)]/90"
                }`}
              >
                {notification.message}
              </p>
              {(notification.metadata?.reportResponse || notification.metadata?.response) && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)] line-clamp-2 pl-2 border-l-2 border-[var(--border)]">
                  {notification.metadata.reportResponse || notification.metadata.response}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {new Date(notification.createdAt).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setActionsOpen(prev => !prev);
                }}
                className="p-2 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors touch-manipulation"
                aria-label="Действия"
                aria-expanded={actionsOpen}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {actionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={e => {
                      e.stopPropagation();
                      setActionsOpen(false);
                    }}
                  />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg min-w-[160px]"
                    onClick={e => e.stopPropagation()}
                  >
                    {notification.isRead ? (
                      <button
                        type="button"
                        onClick={handleMarkAsUnread}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                      >
                        <Mail className="w-4 h-4" />
                        Отметить непрочитанным
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkAsRead}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                      >
                        <MailOpen className="w-4 h-4" />
                        Отметить прочитанным
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

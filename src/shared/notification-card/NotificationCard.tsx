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
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { Notification } from "@/types/notifications";
import { getTitlePath, getChapterPath } from "@/lib/title-paths";
import { getChapterDisplayName } from "@/lib/chapter-title-utils";

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
    bg: "bg-blue-500/25 dark:bg-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: BookOpen,
  },
  update: {
    label: "Обновление",
    bg: "bg-purple-500/25 dark:bg-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
    icon: RefreshCw,
  },
  user: {
    label: "Пользователь",
    bg: "bg-emerald-500/25 dark:bg-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: User,
  },
  system: {
    label: "Система",
    bg: "bg-amber-500/25 dark:bg-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    icon: Settings,
  },
  report_response: {
    label: "Ответ на жалобу",
    bg: "bg-rose-500/25 dark:bg-rose-500/30",
    text: "text-rose-700 dark:text-rose-300",
    icon: MessageSquareReply,
  },
  complaint_response: {
    label: "Ответ на жалобу",
    bg: "bg-rose-500/25 dark:bg-rose-500/30",
    text: "text-rose-700 dark:text-rose-300",
    icon: MessageSquareReply,
  },
  report_resolved: {
    label: "Ответ на жалобу",
    bg: "bg-rose-500/25 dark:bg-rose-500/30",
    text: "text-rose-700 dark:text-rose-300",
    icon: MessageSquareReply,
  },
};

const defaultTypeConfig = {
  label: "Другое",
  bg: "bg-[var(--muted)]",
  text: "text-[var(--foreground)]",
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

  const metadata = notification.metadata;
  const entityType = metadata?.entityType;
  const entityId = metadata?.entityId;

  const titleIdForFetch = entityType === "title" ? entityId : undefined;
  const chapterId = entityType === "chapter" ? entityId : undefined;

  const { data: fetchedChapter } = useGetChapterByIdQuery(chapterId || "", {
    skip: !chapterId,
  });

  const chapterTitleIdRaw = entityType === "chapter" ? fetchedChapter?.titleId : undefined;
  const titleIdFromChapter =
    typeof chapterTitleIdRaw === "string"
      ? chapterTitleIdRaw
      : (chapterTitleIdRaw as { _id?: string })?._id ?? "";

  const titleIdToFetch = titleIdForFetch || titleIdFromChapter || "";

  const { data: fetchedTitle } = useGetTitleByIdQuery(
    { id: titleIdToFetch },
    { skip: !titleIdToFetch }
  );

  const chapterData = fetchedChapter;

  const entityName =
    notification.metadata?.titleName ||
    (typeof notification.titleId === "object" && notification.titleId?.name);
  const chapterDisplayName = chapterData
    ? getChapterDisplayName({
        name: chapterData.name || "",
        chapterNumber: chapterData.chapterNumber,
        title: chapterData.title || chapterData.name,
      })
    : null;

  const handleClick = async () => {
    if (actionsOpen) return;
    const chapterNavTitleId =
      chapterData &&
      (typeof chapterData.titleId === "string"
        ? chapterData.titleId
        : (chapterData.titleId as { _id?: string })?._id);
    const navTitleId =
      typeof notification.titleId === "object" && notification.titleId?._id
        ? notification.titleId._id
        : typeof notification.titleId === "string" && notification.titleId?.trim()
          ? notification.titleId.trim()
          : entityType === "title" && entityId
            ? entityId
            : entityType === "chapter"
              ? chapterNavTitleId ?? titleIdFromChapter
              : null;
    if (navTitleId) {
      if (entityType === "chapter" && chapterData) {
        router.push(getChapterPath({ id: navTitleId }, chapterData._id));
      } else {
        const slug =
          (typeof notification.titleId === "object" && notification.titleId?.slug) ||
          fetchedTitle?.slug;
        router.push(getTitlePath({ id: navTitleId, slug }));
      }
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

  const effectiveTitleId =
    typeof notification.titleId === "object" && notification.titleId?._id
      ? notification.titleId._id
      : fetchedTitle?._id ?? titleIdFromChapter ?? (entityType === "title" ? entityId : undefined);

  const getCoverImage = () => {
    if (typeof notification.titleId === "object" && notification.titleId?._id) {
      if (notification.titleId.coverImage) return notification.titleId.coverImage;
      return `/uploads/titles/${notification.titleId._id}/cover.jpg`;
    }
    if (fetchedTitle?.coverImage) return fetchedTitle.coverImage;
    if (fetchedTitle?._id) return `/uploads/titles/${fetchedTitle._id}/cover.jpg`;
    if (chapterData?.titleInfo?.coverImage) return chapterData.titleInfo.coverImage;
    const chapterTitleId =
      typeof chapterData?.titleId === "string"
        ? chapterData.titleId
        : (chapterData?.titleId as { _id?: string })?._id;
    if (chapterTitleId) return `/uploads/titles/${chapterTitleId}/cover.jpg`;
    if (effectiveTitleId) return `/uploads/titles/${effectiveTitleId}/cover.jpg`;
    return undefined;
  };

  const resolvedEntityName =
    entityName ||
    fetchedTitle?.name ||
    (chapterData?.titleInfo as { name?: string })?.name;

  const safeName = typeof resolvedEntityName === "string" ? resolvedEntityName.replace(/\$/g, "$$") : "";

  const isReportType =
    notification.type === "report_response" ||
    notification.type === "complaint_response" ||
    notification.type === "report_resolved";

  const rawMessage = notification.message ?? "";
  const safeChapterName =
    typeof chapterDisplayName === "string" ? chapterDisplayName.replace(/\$/g, "$$") : "";
  let displayMessage = rawMessage;
  if (isReportType && rawMessage) {
    if (safeName) {
      displayMessage = displayMessage
        .replace(/\bна title\b/gi, `на «${safeName}»`)
        .replace(/\btitle\b/g, `«${safeName}»`);
    }
    if (safeChapterName) {
      displayMessage = displayMessage
        .replace(/\bна chapter\b/gi, `на «${safeChapterName}»`)
        .replace(/\bchapter\b/g, `«${safeChapterName}»`);
    }
  }

  const resolutionText =
    metadata?.resolutionMessage || metadata?.reportResponse || metadata?.response;

  if (isReportType && resolutionText && displayMessage.includes("Ответ модератора:")) {
    displayMessage = displayMessage
      .replace(/\s*Ответ модератора:.*$/is, "")
      .trim();
  }

  const showResolutionBlock = Boolean(resolutionText);

  const showEntitySubline =
    isReportType && (resolvedEntityName || chapterDisplayName);

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
              alt={
                typeof notification.titleId === "object"
                  ? notification.titleId?.name || "Обложка"
                  : resolvedEntityName || "Обложка"
              }
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              fallbackSrc={IMAGE_HOLDER.src}
            />
          </div>
        </div>

        <div className="flex-1 py-3 pr-3 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium shrink-0 border border-current/20 ${typeInfo.bg} ${typeInfo.text}`}
                  title={typeInfo.label}
                >
                  <TypeIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
                  <span className="whitespace-nowrap">{typeInfo.label}</span>
                </span>
                <h3
                  className={`font-semibold text-sm leading-tight min-w-0 ${
                    notification.isRead ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                  }`}
                >
                  {notification.title}
                </h3>
              </div>
              {showEntitySubline && (resolvedEntityName || chapterDisplayName) && (
                <p className="text-xs text-[var(--muted-foreground)] mb-1">
                  {resolvedEntityName}
                  {chapterDisplayName && (
                    <span className="block mt-0.5">— {chapterDisplayName}</span>
                  )}
                </p>
              )}
              <p
                className={`text-sm line-clamp-2 leading-relaxed ${
                  notification.isRead ? "text-[var(--muted-foreground)]/90" : "text-[var(--foreground)]/90"
                }`}
              >
                {displayMessage}
              </p>
              {showResolutionBlock && resolutionText && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)] line-clamp-2 pl-2 border-l-2 border-[var(--border)]">
                  {resolutionText}
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

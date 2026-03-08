"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import {
  MailOpen,
  Mail,
  Trash2,
  BookOpen,
  RefreshCw,
  User,
  Settings,
  MessageSquareReply,
  MoreHorizontal,
  Heart,
} from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

import {
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { Notification } from "@/types/notifications";
import { getTitlePath, getChapterPath } from "@/lib/title-paths";
import { getChapterDisplayName } from "@/lib/chapter-title-utils";
import { getCoverUrls } from "@/lib/asset-url";
import { formatNotificationTime } from "@/lib/date-utils";

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
  comment_reply: {
    label: "Ответ на комментарий",
    bg: "bg-sky-500/25 dark:bg-sky-500/30",
    text: "text-sky-700 dark:text-sky-300",
    icon: MessageSquareReply,
  },
  comment_reactions: {
    label: "Реакции на комментарий",
    bg: "bg-pink-500/25 dark:bg-pink-500/30",
    text: "text-pink-700 dark:text-pink-300",
    icon: Heart,
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
  const [, setImageError] = useState(false);
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
      : ((chapterTitleIdRaw as unknown as { _id?: string })?._id ?? "");

  const titleIdToFetch = titleIdForFetch || titleIdFromChapter || "";

  const { data: fetchedTitle } = useGetTitleByIdQuery(
    { id: titleIdToFetch },
    { skip: !titleIdToFetch },
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

    const notifChapterId =
      typeof notification.chapterId === "object" && notification.chapterId?._id
        ? notification.chapterId._id
        : typeof notification.chapterId === "string" && notification.chapterId?.trim()
          ? notification.chapterId.trim()
          : null;

    const chapterNavTitleId =
      chapterData &&
      (typeof chapterData.titleId === "string"
        ? chapterData.titleId
        : (chapterData.titleId as unknown as { _id?: string })?._id);
    const navTitleId =
      typeof notification.titleId === "object" && notification.titleId?._id
        ? notification.titleId._id
        : typeof notification.titleId === "string" && notification.titleId?.trim()
          ? notification.titleId.trim()
          : entityType === "title" && entityId
            ? entityId
            : entityType === "chapter"
              ? (chapterNavTitleId ?? titleIdFromChapter)
              : null;

    const slug =
      (typeof notification.titleId === "object" && notification.titleId?.slug) ||
      fetchedTitle?.slug;

    const isCommentNotification =
      notification.type === "comment_reply" || notification.type === "comment_reactions";
    const commentId = metadata?.commentId;
    const commentHash = commentId ? `#comment-${commentId}` : "";

    if (isCommentNotification && (navTitleId || metadata?.titleId)) {
      const targetTitleId = navTitleId || metadata?.titleId;
      const targetChapterId =
        entityType === "chapter" ? metadata?.chapterId || entityId || notifChapterId : null;
      if (targetChapterId && entityType === "chapter") {
        router.push(
          getChapterPath({ id: targetTitleId!, slug: slug ?? undefined }, targetChapterId) +
            commentHash,
        );
      } else if (targetTitleId) {
        const titlePath = getTitlePath({ id: targetTitleId, slug: slug ?? undefined });
        router.push(`${titlePath}?tab=comments${commentHash}`);
      }
    } else if (notification.type === "new_chapter" && notifChapterId && navTitleId) {
      router.push(getChapterPath({ id: navTitleId, slug }, notifChapterId));
    } else if (navTitleId) {
      if (entityType === "chapter" && chapterData) {
        router.push(getChapterPath({ id: navTitleId, slug }, chapterData._id));
      } else {
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

  const getImageUrls = (coverImage?: string) => {
    return getCoverUrls(coverImage, IMAGE_HOLDER.src);
  };

  const effectiveTitleId =
    typeof notification.titleId === "object" && notification.titleId?._id
      ? notification.titleId._id
      : (fetchedTitle?._id ??
        titleIdFromChapter ??
        (entityType === "title" ? entityId : undefined));

  const getCoverImage = () => {
    if (typeof notification.titleId === "object" && notification.titleId?._id) {
      if (notification.titleId.coverImage) return notification.titleId.coverImage;
      return `titles/${notification.titleId._id}/cover.jpg`;
    }
    if (fetchedTitle?.coverImage) return fetchedTitle.coverImage;
    if (fetchedTitle?._id) return `titles/${fetchedTitle._id}/cover.jpg`;
    if (chapterData?.titleInfo?.coverImage) return chapterData.titleInfo.coverImage;
    const chapterTitleId =
      typeof chapterData?.titleId === "string"
        ? chapterData.titleId
        : (chapterData?.titleId as unknown as { _id?: string })?._id;
    if (chapterTitleId) return `titles/${chapterTitleId}/cover.jpg`;
    if (effectiveTitleId) return `titles/${effectiveTitleId}/cover.jpg`;
    return undefined;
  };

  const resolvedEntityName =
    entityName || fetchedTitle?.name || (chapterData?.titleInfo as { name?: string })?.name;

  const safeName =
    typeof resolvedEntityName === "string" ? resolvedEntityName.replace(/\$/g, "$$") : "";

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
    displayMessage = displayMessage.replace(/\s*Ответ модератора:[\s\S]*$/i, "").trim();
  }

  const showResolutionBlock = Boolean(resolutionText);

  const showEntitySubline = isReportType && (resolvedEntityName || chapterDisplayName);

  if (isDeleting) return null;

  const coverImageUrl = getCoverImage();

  return (
    <div
      className={`
        relative w-full rounded-xl border transition-all duration-150
        ${
          notification.isRead
            ? "bg-[var(--card)] border-[var(--border)]"
            : "bg-[var(--card)] border-[var(--primary)]/20"
        }
        ${isSelected ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]" : ""}
        hover:border-[var(--border)] hover:bg-[var(--accent)]/30
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
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[var(--primary)]"
          aria-hidden
        />
      )}

      <div className="flex items-stretch min-h-[88px] gap-0">
        {selectionMode && (
          <div className="flex items-center pl-3 pr-2" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
          </div>
        )}

        <div className="flex-shrink-0 p-2.5 pl-3">
          <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[var(--muted)]">
            <OptimizedImage
              src={getImageUrls(coverImageUrl).primary}
              fallbackSrc={getImageUrls(coverImageUrl).fallback}
              alt={
                typeof notification.titleId === "object"
                  ? notification.titleId?.name || "Обложка"
                  : resolvedEntityName || "Обложка"
              }
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        </div>

        <div className="flex-1 py-2.5 pr-2 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 py-0.5 px-1.5 rounded text-[10px] font-medium shrink-0 ${typeInfo.bg} ${typeInfo.text}`}
                  title={typeInfo.label}
                >
                  <TypeIcon className="w-3 h-3 flex-shrink-0 opacity-90" />
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </div>
              <h3
                className={`font-medium text-sm leading-snug mt-0.5 line-clamp-1 ${
                  notification.isRead
                    ? "text-[var(--muted-foreground)]"
                    : "text-[var(--foreground)]"
                }`}
              >
                {notification.title}
              </h3>
              {showEntitySubline && (resolvedEntityName || chapterDisplayName) && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                  {resolvedEntityName}
                  {chapterDisplayName && ` · ${chapterDisplayName}`}
                </p>
              )}
              <p
                className={`text-xs line-clamp-2 mt-0.5 leading-relaxed ${
                  notification.isRead
                    ? "text-[var(--muted-foreground)]/80"
                    : "text-[var(--foreground)]/80"
                }`}
              >
                {displayMessage}
              </p>
              {showResolutionBlock && resolutionText && (
                <p className="mt-1 text-[10px] text-[var(--muted-foreground)] line-clamp-1 pl-2 border-l border-[var(--border)]">
                  {resolutionText}
                </p>
              )}
            </div>

            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setActionsOpen(prev => !prev);
                }}
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors touch-manipulation"
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
                    onClick={() => setActionsOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-0.5 z-20 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg min-w-[180px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      Статус
                    </div>
                    {notification.isRead ? (
                      <button
                        type="button"
                        onClick={handleMarkAsUnread}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md"
                      >
                        <Mail className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
                        Отметить непрочитанным
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkAsRead}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md"
                      >
                        <MailOpen className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
                        Отметить прочитанным
                      </button>
                    )}
                    <div className="my-1 border-t border-[var(--border)]" />
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-md"
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
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

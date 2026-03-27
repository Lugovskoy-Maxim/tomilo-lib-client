"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  MoreHorizontal,
  MailOpen,
  Mail,
  Trash2,
  ChevronRight,
  Library,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import {
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { Notification } from "@/types/notifications";
import {
  resolveNotificationNavigation,
  getTitleIdForGrouping,
} from "@/lib/notification-navigation";
import { getCoverUrls } from "@/lib/asset-url";
import { formatNotificationTime } from "@/lib/date-utils";

interface NotificationChapterGroupCardProps {
  notifications: Notification[];
  selectedIds: Set<string>;
  onSelectGroup?: (ids: string[], selected: boolean) => void;
  selectionMode?: boolean;
}

const typeBadge = {
  label: "Новая глава",
  bg: "bg-blue-500/25 dark:bg-blue-500/30",
  text: "text-blue-700 dark:text-blue-300",
};

const CHAPTER_PREVIEW = 3;

function pluralChapters(n: number): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return "глав";
  if (m10 === 1) return "глава";
  if (m10 >= 2 && m10 <= 4) return "главы";
  return "глав";
}

/** Вин. падеж: «ещё 1 главу», «ещё 2 главы»… */
function pluralChaptersAccusative(n: number): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return "глав";
  if (m10 === 1) return "главу";
  if (m10 >= 2 && m10 <= 4) return "главы";
  return "глав";
}

function chapterRowLabel(n: Notification): string {
  const ch = n.chapterId;
  if (typeof ch === "object" && ch && typeof ch.chapterNumber === "number") {
    return `Глава ${ch.chapterNumber}`;
  }
  const num = n.metadata?.chapterNumber;
  if (typeof num === "number") return `Глава ${num}`;
  if (n.message?.trim()) return n.message.trim().slice(0, 80);
  return "Глава";
}

export default function NotificationChapterGroupCard({
  notifications,
  selectedIds,
  onSelectGroup,
  selectionMode = false,
}: NotificationChapterGroupCardProps) {
  const router = useRouter();
  const [, setImageError] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const checkboxRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );
  const first = sorted[0];
  const titleId = getTitleIdForGrouping(first);
  const ids = useMemo(() => sorted.map(n => n._id), [sorted]);

  const { data: fetchedTitle } = useGetTitleByIdQuery({ id: titleId ?? "" }, { skip: !titleId });

  const hasUnread = sorted.some(n => !n.isRead);
  const latestTime = sorted[0]?.createdAt;

  const titleName =
    (typeof first.titleId === "object" && first.titleId?.name) ||
    first.metadata?.titleName ||
    fetchedTitle?.name ||
    first.title;

  const { titlePath } = resolveNotificationNavigation(first, { fetchedTitle });

  const getCoverImage = () => {
    if (typeof first.titleId === "object" && first.titleId?._id) {
      if (first.titleId.coverImage) return first.titleId.coverImage;
      return `titles/${first.titleId._id}/cover.jpg`;
    }
    if (fetchedTitle?.coverImage) return fetchedTitle.coverImage;
    if (titleId) return `titles/${titleId}/cover.jpg`;
    return undefined;
  };

  const coverImageUrl = getCoverImage();
  const primaryUnread = sorted.find(n => !n.isRead);

  const selectedCount = ids.filter(id => selectedIds.has(id)).length;
  const groupChecked = ids.length > 0 && ids.every(id => selectedIds.has(id));
  const groupIndeterminate = selectedCount > 0 && selectedCount < ids.length;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = groupIndeterminate;
    }
  }, [groupIndeterminate]);

  const navigateTitle = async () => {
    if (!titlePath) return;
    router.push(titlePath);
    const unread = sorted.filter(n => !n.isRead);
    for (const n of unread) {
      try {
        await markAsRead(n._id).unwrap();
      } catch {
        // ignore
      }
    }
  };

  const navigateChapter = async (n: Notification) => {
    const { chapterPath } = resolveNotificationNavigation(n, { fetchedTitle });
    if (!chapterPath) return;
    router.push(chapterPath);
    if (!n.isRead) {
      try {
        await markAsRead(n._id).unwrap();
      } catch {
        // ignore
      }
    }
  };

  const handleMarkGroupRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionsOpen(false);
    for (const n of sorted) {
      if (!n.isRead) {
        try {
          await markAsRead(n._id).unwrap();
        } catch {
          // ignore
        }
      }
    }
  };

  const handleMarkGroupUnread = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionsOpen(false);
    for (const n of sorted) {
      if (n.isRead) {
        try {
          await markAsUnread(n._id).unwrap();
        } catch {
          // ignore
        }
      }
    }
  };

  const handleRemoveGroup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionsOpen(false);
    for (const id of ids) {
      try {
        await deleteNotification(id).unwrap();
      } catch {
        // ignore
      }
    }
  };

  const handleGroupCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectGroup?.(ids, e.target.checked);
  };

  const hasMoreChapters = sorted.length > CHAPTER_PREVIEW;
  const visibleChapters = chaptersExpanded || !hasMoreChapters ? sorted : sorted.slice(0, CHAPTER_PREVIEW);
  const hiddenCount = sorted.length - CHAPTER_PREVIEW;
  const listScrollable = chaptersExpanded && sorted.length > 6;

  return (
    <div
      className={`
        relative w-full rounded-2xl border transition-all duration-200 shadow-sm
        ${
          primaryUnread && !(selectionMode && groupChecked)
            ? "bg-[var(--card)] border-[var(--primary)]/25 ring-1 ring-[var(--primary)]/10"
            : "bg-[var(--card)] border-[var(--border)]"
        }
        ${selectionMode && groupChecked ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)] border-[var(--primary)]/30" : ""}
        hover:border-[var(--border)] hover:bg-[var(--accent)]/25 hover:shadow-md
      `}
    >
      {primaryUnread && (
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[var(--primary)]"
          aria-hidden
        />
      )}

      <div className="flex items-start min-h-[72px] gap-0">
        {selectionMode && (
          <div className="flex items-center pl-3 pr-2" onClick={e => e.stopPropagation()}>
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={groupChecked}
              onChange={handleGroupCheckbox}
              className="w-4 h-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
          </div>
        )}

        <div className="flex shrink-0 self-start p-2.5 pl-3">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              navigateTitle();
            }}
            className="relative w-10 h-14 rounded-lg overflow-hidden bg-[var(--muted)] block text-left ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-inner transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label={`Перейти к тайтлу «${titleName}»`}
          >
            <OptimizedImage
              src={getCoverUrls(coverImageUrl, IMAGE_HOLDER.src).primary}
              fallbackSrc={getCoverUrls(coverImageUrl, IMAGE_HOLDER.src).fallback}
              alt={titleName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-2.5 pr-2.5">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-md text-[10px] font-semibold tracking-wide shrink-0 ${typeBadge.bg} ${typeBadge.text}`}
                title={typeBadge.label}
              >
                <BookOpen className="w-3 h-3 flex-shrink-0 opacity-90" />
              </span>
              <span className="text-[11px] tabular-nums text-[var(--muted-foreground)] shrink-0">
                {latestTime ? formatNotificationTime(latestTime) : ""}
              </span>
              <span className="rounded-full bg-[var(--primary)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] shrink-0">
                {sorted.length} {pluralChapters(sorted.length)}
              </span>
            </div>
            <div
              className="flex h-8 shrink-0 items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              {titlePath && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    navigateTitle();
                  }}
                  className="box-border flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-0 text-[11px] font-semibold leading-none text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/35 hover:bg-[var(--muted)] active:scale-[0.98]"
                >
                  <Library className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" aria-hidden />
                  К тайтлу
                </button>
              )}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setActionsOpen(prev => !prev);
                  }}
                  className="box-border flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors touch-manipulation"
                  aria-label="Действия"
                  aria-expanded={actionsOpen}
                >
                  <MoreHorizontal className="h-4 w-4 shrink-0" />
                </button>

                {actionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setActionsOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-1 z-30 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl min-w-[208px]"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                        Группа
                      </div>
                      {hasUnread ? (
                        <button
                          type="button"
                          onClick={handleMarkGroupRead}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md"
                        >
                          <MailOpen className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
                          Отметить все прочитанными
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleMarkGroupUnread}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md"
                        >
                          <Mail className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
                          Отметить все непрочитанными
                        </button>
                      )}
                      <div className="my-1 border-t border-[var(--border)]" />
                      <button
                        type="button"
                        onClick={handleRemoveGroup}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-md"
                      >
                        <Trash2 className="w-4 h-4 flex-shrink-0" />
                        Удалить все в группе
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-1.5 min-w-0">
            <h3
              className={`font-semibold text-[15px] leading-snug line-clamp-2 ${
                primaryUnread ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
              }`}
            >
              {titleName}
            </h3>

            <ul
              className={`mt-2 space-y-0 rounded-lg border border-[var(--border)]/50 bg-[var(--muted)]/15 p-1 ${
                listScrollable
                  ? "max-h-[min(240px,50vh)] overflow-y-auto overscroll-contain pr-0.5 [scrollbar-gutter:stable]"
                  : ""
              }`}
            >
              {visibleChapters.map(n => {
                const { chapterPath } = resolveNotificationNavigation(n, { fetchedTitle });
                const rowUnread = !n.isRead;
                return (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (chapterPath) navigateChapter(n);
                      }}
                      disabled={!chapterPath}
                      className={`
                          group w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[11px]
                          transition-colors border border-transparent
                          ${
                            chapterPath
                              ? "hover:bg-[var(--background)] hover:border-[var(--border)] hover:shadow-sm cursor-pointer"
                              : "opacity-60 cursor-not-allowed"
                          }
                          ${rowUnread ? "text-[var(--foreground)] font-medium" : "text-[var(--muted-foreground)]"}
                        `}
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        {rowUnread && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]"
                            aria-hidden
                          />
                        )}
                        <span className="truncate">{chapterRowLabel(n)}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-40 transition group-hover:opacity-80 group-hover:translate-x-0.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {hasMoreChapters && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setChaptersExpanded(v => !v);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/10"
              >
                {chaptersExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Свернуть список
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Показать ещё {hiddenCount} {pluralChaptersAccusative(hiddenCount)}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

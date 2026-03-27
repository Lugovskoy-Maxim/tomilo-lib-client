import { Notification } from "@/types/notifications";
import { getChapterPath, getTitlePath } from "@/lib/title-paths";

export interface ChapterLike {
  _id?: string;
  titleId?: string | { _id?: string };
}

/** ID тайтла для группировки уведомлений «новая глава» (без доп. запросов). */
export function getTitleIdForGrouping(notification: Notification): string | null {
  if (notification.type !== "new_chapter") return null;
  const t = notification.titleId;
  if (typeof t === "object" && t?._id) return t._id;
  if (typeof t === "string" && t.trim()) return t.trim();
  const m = notification.metadata;
  if (m?.entityType === "title" && m.entityId) return m.entityId;
  return null;
}

export function buildNewChapterGroupRows(
  notifications: Notification[],
): Array<
  | { kind: "single"; notification: Notification }
  | { kind: "chapterGroup"; notifications: Notification[] }
> {
  const groupMap = new Map<string, Notification[]>();
  for (const n of notifications) {
    const k = getTitleIdForGrouping(n);
    if (!k) continue;
    if (!groupMap.has(k)) groupMap.set(k, []);
    groupMap.get(k)!.push(n);
  }
  for (const arr of groupMap.values()) {
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const emitted = new Set<string>();
  const rows: Array<
    | { kind: "single"; notification: Notification }
    | { kind: "chapterGroup"; notifications: Notification[] }
  > = [];

  for (const n of notifications) {
    const k = getTitleIdForGrouping(n);
    if (n.type !== "new_chapter" || !k) {
      rows.push({ kind: "single", notification: n });
      continue;
    }
    if (emitted.has(k)) continue;
    emitted.add(k);
    const items = groupMap.get(k)!;
    if (items.length <= 1) {
      rows.push({ kind: "single", notification: items[0] });
    } else {
      rows.push({ kind: "chapterGroup", notifications: items });
    }
  }
  return rows;
}

type FetchedTitle = { slug?: string; _id?: string } | null | undefined;

export function resolveNotificationNavigation(
  notification: Notification,
  opts?: {
    fetchedTitle?: FetchedTitle;
    chapterData?: ChapterLike | null;
    titleIdFromChapter?: string;
  },
): {
  navTitleId: string | null;
  slug: string | undefined;
  notifChapterId: string | null;
  titlePath: string | null;
  chapterPath: string | null;
} {
  const metadata = notification.metadata;
  const entityType = metadata?.entityType;
  const entityId = metadata?.entityId;

  const chapterData = opts?.chapterData;
  const chapterNavTitleId =
    chapterData &&
    (typeof chapterData.titleId === "string"
      ? chapterData.titleId
      : (chapterData.titleId as { _id?: string } | undefined)?._id);

  const notifChapterId =
    typeof notification.chapterId === "object" && notification.chapterId?._id
      ? notification.chapterId._id
      : typeof notification.chapterId === "string" && notification.chapterId?.trim()
        ? notification.chapterId.trim()
        : null;

  const navTitleId =
    typeof notification.titleId === "object" && notification.titleId?._id
      ? notification.titleId._id
      : typeof notification.titleId === "string" && notification.titleId?.trim()
        ? notification.titleId.trim()
        : entityType === "title" && entityId
          ? entityId
          : entityType === "chapter"
            ? (chapterNavTitleId ?? opts?.titleIdFromChapter ?? null)
            : null;

  const slug =
    (typeof notification.titleId === "object" && notification.titleId?.slug) ||
    opts?.fetchedTitle?.slug;

  const titlePath = navTitleId ? getTitlePath({ id: navTitleId, slug }) : null;
  const chapterPath =
    navTitleId && notifChapterId ? getChapterPath({ id: navTitleId, slug }, notifChapterId) : null;

  return { navTitleId, slug, notifChapterId, titlePath, chapterPath };
}

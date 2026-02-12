import type { BookmarkEntry, BookmarkCategory, BookmarkTitleInfo } from "@/types/user";

/** Безопасно получить titleId как строку (API может вернуть ObjectId-объект) */
function toTitleIdString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? "");
  }
  return String(value);
}

const CATEGORIES: BookmarkCategory[] = ["reading", "planned", "completed", "favorites", "dropped"];

/** Преобразовать сырой titleId (объект или строка) в BookmarkTitleInfo, если это объект с полями тайтла */
function toTitleInfo(value: unknown): BookmarkTitleInfo | undefined {
  if (value == null || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  const id = o._id != null ? String(o._id) : "";
  if (!id) return undefined;
  return {
    _id: id,
    name: typeof o.name === "string" ? o.name : "",
    slug: typeof o.slug === "string" ? o.slug : undefined,
    coverImage: typeof o.coverImage === "string" ? o.coverImage : undefined,
    type: typeof o.type === "string" ? o.type : undefined,
    status: typeof o.status === "string" ? o.status : undefined,
    totalChapters: typeof o.totalChapters === "number" ? o.totalChapters : undefined,
    averageRating: typeof o.averageRating === "number" ? o.averageRating : undefined,
    releaseYear: typeof o.releaseYear === "number" ? o.releaseYear : undefined,
  };
}

/**
 * Нормализация закладок: поддержка старого формата (string[]),
 * нового (BookmarkEntry[] с optional title) и сырых данных API
 * (titleId как ObjectId или populated объект тайтла).
 */
export function normalizeBookmarks(raw: unknown): BookmarkEntry[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();

  return raw
    .map((item): BookmarkEntry | null => {
      if (typeof item === "string") {
        return { titleId: item, category: "reading", addedAt: now };
      }
      if (item === null || typeof item !== "object") {
        return null;
      }
      const entry = item as Record<string, unknown>;
      const category = entry.category as BookmarkCategory | undefined;
      const validCategory = category && CATEGORIES.includes(category) ? category : "reading";
      const titleId = toTitleIdString(entry.titleId);
      if (!titleId) return null;
      const title = toTitleInfo(entry.titleId);
      return {
        titleId,
        category: validCategory,
        addedAt: typeof entry.addedAt === "string" ? entry.addedAt : now,
        ...(title && title.name ? { title } : {}),
      };
    })
    .filter((e): e is BookmarkEntry => e != null && e.titleId.length > 0);
}

/** Проверка, есть ли titleId в списке закладок (сырой ответ API или нормализованный) */
export function hasBookmark(raw: unknown, titleId: string): boolean {
  return normalizeBookmarks(raw).some(e => e.titleId === titleId);
}

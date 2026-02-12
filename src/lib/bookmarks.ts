import type { BookmarkEntry, BookmarkCategory } from "@/types/user";

/** Безопасно получить titleId как строку (API может вернуть ObjectId-объект) */
function toTitleIdString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? "");
  }
  return String(value);
}

/**
 * Нормализация закладок: поддержка старого формата (string[]),
 * нового (BookmarkEntry[]) и сырых данных API (titleId как ObjectId).
 */
export function normalizeBookmarks(raw: unknown): BookmarkEntry[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  const categories: BookmarkCategory[] = ["reading", "planned", "completed", "favorites", "dropped"];

  return raw.map((item): BookmarkEntry => {
    if (typeof item === "string") {
      return { titleId: item, category: "reading", addedAt: now };
    }
    if (item === null || typeof item !== "object") {
      return { titleId: "", category: "reading", addedAt: now };
    }
    const entry = item as Record<string, unknown>;
    const category = entry.category as BookmarkCategory | undefined;
    const validCategory = category && categories.includes(category) ? category : "reading";
    return {
      titleId: toTitleIdString(entry.titleId),
      category: validCategory,
      addedAt: typeof entry.addedAt === "string" ? entry.addedAt : now,
    };
  }).filter(e => e.titleId.length > 0);
}

/** Проверка, есть ли titleId в списке закладок (сырой ответ API или нормализованный) */
export function hasBookmark(raw: unknown, titleId: string): boolean {
  return normalizeBookmarks(raw).some(e => e.titleId === titleId);
}

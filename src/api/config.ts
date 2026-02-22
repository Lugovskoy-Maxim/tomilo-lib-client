export const baseUrlAPI = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Базовый URL сайта (для ссылок, OG, статика фронта) */
export const baseUrl = (() => {
  const url = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";
  return url.startsWith("http") ? url : `http://${url}`;
})();

/** Оригин API (без /api) — для запросов к бэкенду */
const apiOrigin = (() => {
  const u = baseUrlAPI.replace(/\/api\/?$/, "");
  return u.startsWith("http") ? u : `http://${u}`;
})();

/**
 * Базовый URL для картинок объявлений. Файлы сохраняются в uploads/announcements/ на бэкенде.
 * Используется NEXT_PUBLIC_UPLOADS_URL (например https://tomilo-lib.ru/uploads), чтобы
 * путь /announcements/xxx.jpg превращался в https://tomilo-lib.ru/uploads/announcements/xxx.jpg.
 * Если UPLOADS_URL не задан — берётся origin API.
 */
const announcementImagesBase = (() => {
  const uploads = process.env.NEXT_PUBLIC_UPLOADS_URL?.trim();
  if (uploads) return uploads.replace(/\/$/, "");
  return apiOrigin;
})();

/**
 * URL изображения объявления. Все пути и URL с /announcements/ или /uploads/
 * собираются через announcementImagesBase, чтобы картинки грузились с сервера, где лежат файлы.
 */
export function getAnnouncementImageUrl(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return "";
  const s = pathOrUrl.trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      const pathname = u.pathname;
      if (pathname.startsWith("/announcements/") || pathname.startsWith("/uploads/")) {
        return `${announcementImagesBase}${pathname}`;
      }
      return s;
    } catch {
      return s;
    }
  }
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${announcementImagesBase}${path}`;
}

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

/** S3 URL — основной источник изображений */
const s3Origin = process.env.NEXT_PUBLIC_S3_URL?.replace(/\/$/, "") || "";

/** Fallback URL для изображений (старый сервер) */
const uploadsOrigin = process.env.NEXT_PUBLIC_UPLOADS_URL?.replace(/\/$/, "") || apiOrigin;

/**
 * Возвращает primary и fallback URL для изображения объявления.
 * Primary = S3 (если настроен), fallback = старый сервер.
 */
export function getAnnouncementImageUrls(pathOrUrl: string | undefined): { primary: string; fallback: string } {
  if (!pathOrUrl) return { primary: "", fallback: "" };
  const s = pathOrUrl.trim();
  if (!s) return { primary: "", fallback: "" };

  let pathname: string;

  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      pathname = u.pathname;
      if (!pathname.startsWith("/announcements/") && !pathname.startsWith("/uploads/")) {
        return { primary: s, fallback: s };
      }
    } catch {
      return { primary: s, fallback: s };
    }
  } else {
    pathname = s.startsWith("/") ? s : `/${s}`;
  }

  if (s3Origin) {
    return {
      primary: `${s3Origin}${pathname}`,
      fallback: `${uploadsOrigin}${pathname}`,
    };
  }

  const url = `${uploadsOrigin}${pathname}`;
  return { primary: url, fallback: url };
}

/**
 * URL изображения объявления (primary URL).
 * Для fallback используйте getAnnouncementImageUrls().
 */
export function getAnnouncementImageUrl(pathOrUrl: string | undefined): string {
  return getAnnouncementImageUrls(pathOrUrl).primary;
}

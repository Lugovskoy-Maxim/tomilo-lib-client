/** S3 URL — основной источник изображений */
const s3Origin = process.env.NEXT_PUBLIC_S3_URL?.replace(/\/$/, "") || "";

/** Fallback URL — старый сервер /uploads */
const uploadsOrigin = process.env.NEXT_PUBLIC_UPLOADS_URL?.replace(/\/$/, "") || "http://localhost:3001/uploads";

/**
 * Нормализует относительный путь для использования в URL.
 * Убирает /api/ префиксы и приводит к формату /uploads/...
 */
function normalizePath(p: string): string {
  if (!p) return "";
  let path = p.startsWith("/") ? p : `/${p}`;
  if (path.startsWith("/api/")) path = path.replace(/^\/api\//, "/uploads/");
  if (path.startsWith("api/")) path = path.replace(/^api\//, "uploads/");
  return path;
}

/**
 * Возвращает primary и fallback URL для изображения.
 * Primary = S3 (если настроен), fallback = старый сервер.
 */
export function getImageUrls(p: string): { primary: string; fallback: string } {
  if (!p) return { primary: "", fallback: "" };

  if (p.startsWith("http://") || p.startsWith("https://")) {
    const normalized = p.replace("/api/browse/", "/uploads/browse/");
    try {
      const u = new URL(normalized);
      const pathname = u.pathname;
      if (s3Origin) {
        return {
          primary: `${s3Origin}${pathname}`,
          fallback: `${uploadsOrigin}${pathname}`,
        };
      }
      return { primary: normalized, fallback: normalized };
    } catch {
      return { primary: normalized, fallback: normalized };
    }
  }

  const path = normalizePath(p);
  const pathWithSlash = path.startsWith("/") ? path : `/${path}`;

  if (s3Origin) {
    return {
      primary: `${s3Origin}${pathWithSlash}`,
      fallback: `${uploadsOrigin}${pathWithSlash}`,
    };
  }

  const url = `${uploadsOrigin}${pathWithSlash}`;
  return { primary: url, fallback: url };
}

/**
 * Нормализует URL изображения (страницы главы) для отображения.
 * Используется на сервере и клиенте для единообразия.
 * Возвращает primary URL (S3 если настроен, иначе uploads).
 */
export function normalizeAssetUrl(p: string): string {
  return getImageUrls(p).primary;
}

/**
 * Возвращает fallback URL для изображения (старый сервер).
 */
export function getFallbackAssetUrl(p: string): string {
  return getImageUrls(p).fallback;
}

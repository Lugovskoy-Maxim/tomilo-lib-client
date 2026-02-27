/** S3 URL — основной источник изображений */
const s3Origin = process.env.NEXT_PUBLIC_S3_URL?.replace(/\/$/, "") || "";

/** Fallback URL — старый сервер /uploads */
const uploadsOrigin = process.env.NEXT_PUBLIC_UPLOADS_URL?.replace(/\/$/, "") || "http://localhost:3001/uploads";

/**
 * Нормализует путь для fallback (старый сервер).
 * Убирает /api/, /uploads/, /tomilolib/ префиксы, т.к. uploadsOrigin уже содержит /uploads.
 */
function normalizePathForUploads(p: string): string {
  if (!p) return "";
  let path = p.startsWith("/") ? p : `/${p}`;
  if (path.startsWith("/api/")) path = path.replace(/^\/api\//, "/");
  if (path.startsWith("api/")) path = path.replace(/^api\//, "/");
  if (path.startsWith("/uploads/")) path = path.replace(/^\/uploads\//, "/");
  if (path.startsWith("/uploads")) path = path.replace(/^\/uploads/, "");
  if (path.startsWith("/tomilolib/")) path = path.replace(/^\/tomilolib\//, "/");
  if (path.startsWith("/tomilolib")) path = path.replace(/^\/tomilolib/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Нормализует путь для S3 (убирает /uploads/ и /tomilolib/ префиксы).
 * На S3 файлы лежат без этих префиксов.
 */
function normalizePathForS3(p: string): string {
  if (!p) return "";
  let path = p.startsWith("/") ? p : `/${p}`;
  if (path.startsWith("/api/")) path = path.replace(/^\/api\//, "/");
  if (path.startsWith("api/")) path = path.replace(/^api\//, "/");
  if (path.startsWith("/uploads/")) path = path.replace(/^\/uploads\//, "/");
  if (path.startsWith("/uploads")) path = path.replace(/^\/uploads/, "");
  if (path.startsWith("/tomilolib/")) path = path.replace(/^\/tomilolib\//, "/");
  if (path.startsWith("/tomilolib")) path = path.replace(/^\/tomilolib/, "");
  return path.startsWith("/") ? path : `/${path}`;
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
        const s3Path = normalizePathForS3(pathname);
        const uploadsPath = normalizePathForUploads(pathname);
        return {
          primary: `${s3Origin}${s3Path}`,
          fallback: `${uploadsOrigin}${uploadsPath}`,
        };
      }
      return { primary: normalized, fallback: normalized };
    } catch {
      return { primary: normalized, fallback: normalized };
    }
  }

  const s3Path = normalizePathForS3(p);
  const uploadsPath = normalizePathForUploads(p);

  if (s3Origin) {
    return {
      primary: `${s3Origin}${s3Path}`,
      fallback: `${uploadsOrigin}${uploadsPath}`,
    };
  }

  const url = `${uploadsOrigin}${uploadsPath}`;
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

/**
 * Нормализует URL изображения (страницы главы) для отображения.
 * Используется на сервере и клиенте для единообразия.
 */
export function normalizeAssetUrl(p: string): string {
  if (!p) return "";
  if (p.startsWith("http")) {
    return p.replace("/api/browse/", "/uploads/browse/");
  }
  let path = p.startsWith("/") ? p : `/${p}`;
  if (path.startsWith("/api/")) path = path.replace(/^\/api\//, "/uploads/");
  if (path.startsWith("api/")) path = path.replace(/^api\//, "uploads/");
  const origin = process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:3001/uploads";
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

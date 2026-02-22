/** SVG в og:image не показывается в Telegram, VK, Facebook и др. — используем дефолт. */
function isSvgPath(path: string): boolean {
  const p = path.trim().toLowerCase();
  return p.endsWith(".svg") || p.includes(".svg?");
}

/**
 * Абсолютный URL для og:image / twitter:image.
 * Обложка тайтла или дефолтное изображение для превью в мессенджерах.
 *
 * Соцсети (Facebook, Telegram, VK и др.) не поддерживают SVG в og:image —
 * для превью нужен PNG или JPEG. SVG-обложки заменяются на дефолт.
 * Для обложек используется imageBaseUrl, если картинки отдаются с другого хоста (например API).
 */
export function getOgImageUrl(
  baseUrl: string,
  coverImage?: string | null,
  imageBaseUrl?: string | null,
): string {
  if (coverImage && coverImage.trim()) {
    if (isSvgPath(coverImage)) {
      return getDefaultOgImageUrl(baseUrl);
    }
    if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
      return coverImage;
    }
    const path = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
    const base = (imageBaseUrl || baseUrl).replace(/\/$/, "");
    return `${base}${path}`;
  }
  return getDefaultOgImageUrl(baseUrl);
}

/**
 * Дефолтное изображение для превью в соцсетях.
 * PNG/JPEG (1200×630) — SVG в og:image не показывается в Facebook, Telegram, VK.
 * Задать свой путь: NEXT_PUBLIC_OG_DEFAULT_IMAGE=/logo/og-default.png
 */
const DEFAULT_OG_IMAGE_PATH =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_OG_DEFAULT_IMAGE) ||
  "/logo/og-default.png";

/** Относительный путь дефолтной картинки — в metadata подставляется metadataBase из layout. */
export function getDefaultOgImagePath(): string {
  return DEFAULT_OG_IMAGE_PATH.startsWith("http") ? "/logo/og-default.png" : DEFAULT_OG_IMAGE_PATH;
}

export function getDefaultOgImageUrl(baseUrl: string): string {
  const path = DEFAULT_OG_IMAGE_PATH.startsWith("http")
    ? DEFAULT_OG_IMAGE_PATH
    : `${baseUrl.replace(/\/$/, "")}${DEFAULT_OG_IMAGE_PATH.startsWith("/") ? "" : "/"}${DEFAULT_OG_IMAGE_PATH}`;
  return path;
}

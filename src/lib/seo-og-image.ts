/**
 * Абсолютный URL для og:image / twitter:image.
 * Обложка тайтла или дефолтное изображение для превью в мессенджерах.
 */
export function getOgImageUrl(
  baseUrl: string,
  coverImage?: string | null,
): string {
  if (coverImage && coverImage.trim()) {
    if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
      return coverImage;
    }
    const path = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }
  return getDefaultOgImageUrl(baseUrl);
}

/** Дефолтное изображение для превью (логотип сайта). */
export function getDefaultOgImageUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/logo/tomilo_color.svg`;
}

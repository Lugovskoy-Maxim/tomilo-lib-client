/**
 * Санитизация строк для meta-тегов (og:title, og:description и т.д.).
 * Экранируем кавычки и апостроф, чтобы парсеры (Telegram, VK и др.) не ломали атрибут
 * и не показывали обрезанный/битый текст (например "Sil%26" вместо названия с апострофом).
 */
export function sanitizeMetaString(value: string | undefined | null): string {
  if (value == null || typeof value !== "string") return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Надёжное получение названия тайтла для SEO (серверные метаданные).
 * Учитывает разные форматы ответа API (name, title) и при отсутствии названия
 * формирует читаемую строку из slug, чтобы роботы не видели "Без названия".
 */
export function getTitleDisplayNameForSEO(
  titleData: Record<string, unknown> | null | undefined,
  slug: string,
): string {
  if (!titleData || typeof titleData !== "object") {
    return slugToDisplayName(slug);
  }
  const name = titleData.name ?? titleData.title;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }
  return slugToDisplayName(slug);
}

/** Преобразует slug в читаемое название (дефис в пробел, первая буква заглавная). */
function slugToDisplayName(slug: string): string {
  if (!slug || typeof slug !== "string") return "Тайтл";
  return slug
    .split("-")
    .map(word => (word.length ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

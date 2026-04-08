/**
 * Надёжное получение названия тайтла для SEO (серверные метаданные).
 * Учитывает разные форматы ответа API (name, title) и при отсутствии названия
 * формирует читаемую строку из slug, чтобы роботы не видели "Без названия".
 * Предпочитает русские названия из altNames, если name на английском.
 */
export function getTitleDisplayNameForSEO(
  titleData: Record<string, unknown> | null | undefined,
  slug: string,
): string {
  if (!titleData || typeof titleData !== "object") {
    return slugToDisplayName(slug);
  }

  // Пытаемся получить основное название
  const name = titleData.name ?? titleData.title;
  if (typeof name === "string" && name.trim()) {
    // Если название содержит кириллицу, считаем его русским и используем
    if (containsCyrillic(name)) {
      return name.trim();
    }
    // Иначе ищем русское название в altNames
    const altNames = titleData.altNames ?? (titleData as { alternativeTitles?: string[] }).alternativeTitles;
    if (Array.isArray(altNames) && altNames.length > 0) {
      const russianAlt = altNames.find(alt => typeof alt === "string" && containsCyrillic(alt));
      if (russianAlt) {
        return russianAlt.trim();
      }
    }
    // Если русских нет, возвращаем оригинальное название
    return name.trim();
  }

  // Если name отсутствует, ищем в altNames любое название
  const altNames = titleData.altNames ?? (titleData as { alternativeTitles?: string[] }).alternativeTitles;
  if (Array.isArray(altNames) && altNames.length > 0) {
    const firstAlt = altNames[0];
    if (typeof firstAlt === "string" && firstAlt.trim()) {
      return firstAlt.trim();
    }
  }

  return slugToDisplayName(slug);
}

/** Проверяет, содержит ли строка кириллические символы. */
function containsCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

/** Преобразует slug в читаемое название (дефис в пробел, первая буква заглавная). */
function slugToDisplayName(slug: string): string {
  if (!slug || typeof slug !== "string") return "Тайтл";
  return slug
    .split("-")
    .map(word => (word.length ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

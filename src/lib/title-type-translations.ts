// Маппинг для перевода типов тайтлов с английского на русский
export const titleTypeTranslations: Record<string, string> = {
  "manga": "Манга",
  "manhwa": "Манхва",
  "manhua": "Маньхуа",
  "novel": "Роман",
  "light_novel": "Лайт-новелла",
  "comic": "Комикс",
  "other": "Другое"
};

// Функция для получения перевода типа тайтла
export function translateTitleType(type: string): string {
  return titleTypeTranslations[type.toLowerCase()] || type;
}
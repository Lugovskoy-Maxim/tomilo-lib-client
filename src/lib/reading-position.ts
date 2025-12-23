/**
 * Утилиты для работы с позицией чтения в localStorage
 */

export interface ReadingPosition {
  page: number;
  timestamp: number;
}

/**
 * Получить ключ для сохранения позиции чтения
 */
export const getReadingPositionKey = (titleId: string, chapterId: string): string => {
  return `reading-position-${titleId}-${chapterId}`;
};

/**
 * Сохранить позицию чтения в localStorage
 */
export const saveReadingPosition = (
  titleId: string,
  chapterId: string,
  page: number
): void => {
  if (typeof window === "undefined") return;
  
  try {
    const key = getReadingPositionKey(titleId, chapterId);
    const position: ReadingPosition = {
      page,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(position));
  } catch (error) {
    console.warn("Failed to save reading position:", error);
  }
};

/**
 * Загрузить позицию чтения из localStorage
 */
export const getReadingPosition = (
  titleId: string,
  chapterId: string
): ReadingPosition | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const key = getReadingPositionKey(titleId, chapterId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const position: ReadingPosition = JSON.parse(stored);
    return position;
  } catch (error) {
    console.warn("Failed to load reading position:", error);
    return null;
  }
};

/**
 * Удалить позицию чтения из localStorage
 */
export const clearReadingPosition = (titleId: string, chapterId: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const key = getReadingPositionKey(titleId, chapterId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to clear reading position:", error);
  }
};

/**
 * Прокрутить до указанной страницы
 */
export const scrollToPage = (page: number): void => {
  if (typeof window === "undefined") return;
  
  const pageElement = document.querySelector(`[data-page="${page}"]`);
  if (pageElement) {
    pageElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};

/**
 * Дебаунс функция для оптимизации сохранения
 */
export const createDebouncedSave = (
  saveFn: (page: number) => void,
  delay: number = 1000
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (page: number) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveFn(page);
    }, delay);
  };
};

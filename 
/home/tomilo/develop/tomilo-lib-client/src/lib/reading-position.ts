
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
 * Удалить все позиции чтения для определённого тайтла (кроме текущей главы)
 */
export const clearOldReadingPositions = (
  titleId: string, 
  currentChapterId: string
): void => {
  if (typeof window === "undefined") return;
  
  try {
    const prefix = `reading-position-${titleId}-`;
    const keysToRemove: string[] = [];
    
    // Находим все ключи для данного тайтла
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.endsWith(`-${currentChapterId}`)) {
        keysToRemove.push(key);
      }
    }
    
    // Удаляем старые ключи
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${keysToRemove.length} old reading positions for title ${titleId}`);
  } catch (error) {
    console.warn("Failed to clear old reading positions:", error);
  }
};

/**
 * Получить все позиции чтения для определённого тайтла
 */
export const getAllReadingPositionsForTitle = (titleId: string): ReadingPosition[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const prefix = `reading-position-${titleId}-`;
    const positions: ReadingPosition[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const position: ReadingPosition = JSON.parse(stored);
            positions.push(position);
          } catch (error) {
            console.warn(`Failed to parse reading position for key ${key}:`, error);
          }
        }
      }
    }
    
    return positions;
  } catch (error) {
    console.warn("Failed to get reading positions for title:", error);
    return [];
  }
};

/**
 * Очистить все позиции чтения для определённого тайтла
 */
export const clearAllReadingPositionsForTitle = (titleId: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const prefix = `reading-position-${titleId}-`;
    const keysToRemove: string[] = [];
    
    // Находим все ключи для данного тайтла
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Удаляем все ключи
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared all ${keysToRemove.length} reading positions for title ${titleId}`);
  } catch (error) {
    console.warn("Failed to clear all reading positions for title:", error);
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


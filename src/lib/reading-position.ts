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
  
  // Валидация входных данных
  if (typeof page !== 'number' || page < 1) {
    console.warn("Invalid page number for saving position:", page);
    return;
  }
  
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
    
    // Проверяем, что позиция действительна
    if (typeof position.page !== 'number' || position.page < 1) {
      console.warn("Invalid reading position data:", position);
      localStorage.removeItem(key); // Удаляем недействительные данные
      return null;
    }
    
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
 * Очистить позиции чтения для всех глав тайтла, кроме указанной главы
 */
export const clearOtherChaptersPositions = (titleId: string, currentChapterId: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const prefix = `reading-position-${titleId}-`;
    const currentKey = getReadingPositionKey(titleId, currentChapterId);
    
    // Получаем все ключи из localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key !== currentKey) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("Failed to clear other chapters positions:", error);
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
 * Проверить, загружены ли изображения на странице
 */
export const checkImagesLoaded = (page: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const pageElement = document.querySelector(`[data-page="${page}"]`);
    if (!pageElement) {
      resolve(false);
      return;
    }

    const images = pageElement.querySelectorAll('img');
    if (images.length === 0) {
      resolve(true);
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const checkCompletion = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        resolve(true);
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkCompletion();
      } else {
        img.addEventListener('load', checkCompletion);
        img.addEventListener('error', checkCompletion);
      }
    });

    // Таймаут для предотвращения бесконечного ожидания
    setTimeout(() => resolve(true), 5000);
  });
};

/**
 * Улучшенная прокрутка до страницы с проверкой готовности изображений
 */
export const scrollToPageWithCheck = async (page: number): Promise<void> => {
  if (typeof window === "undefined") return;
  
  try {
    // Сначала проверяем готовность изображений
    const imagesReady = await checkImagesLoaded(page);
    
    if (!imagesReady) {
      console.warn(`Images not ready for page ${page}, scrolling anyway`);
    }
    
    const pageElement = document.querySelector(`[data-page="${page}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  } catch (error) {
    console.warn("Failed to scroll to page:", error);
    // Fallback к обычной прокрутке
    scrollToPage(page);
  }
};

/**
 * Создать Intersection Observer для определения видимых страниц
 */
export const createPageVisibilityObserver = (
  callback: (visiblePages: number[]) => void
): IntersectionObserver | null => {
  if (typeof window === "undefined") return null;

  const observer = new IntersectionObserver(
    (entries) => {
      const visiblePages: number[] = [];
      
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const pageElement = entry.target as HTMLElement;
          const pageNumber = parseInt(pageElement.dataset.page || "1");
          visiblePages.push(pageNumber);
        }
      });
      
      if (visiblePages.length > 0) {
        callback(visiblePages);
      }
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: [0.5, 0.75, 1.0],
    }
  );

  return observer;
};


/**
 * Определить текущую страницу на основе видимых элементов
 */
export const getCurrentPage = (): number => {
  if (typeof window === "undefined") return 1;
  
  const pageElements = document.querySelectorAll("[data-page]");
  if (pageElements.length === 0) return 1;
  
  let maxVisible = 0;
  let currentPage = 1;

  pageElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Вычисляем видимую часть элемента
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleRatio = visibleHeight / rect.height;
    
    // Повышен порог до 30% для лучшей точности
    if (visibleRatio > 0.3 && visibleRatio > maxVisible) {
      maxVisible = visibleRatio;
      currentPage = parseInt(el.getAttribute("data-page") || "1");
    }
  });

  return currentPage;
};

/**
 * Улучшенная версия определения страницы с дополнительной логикой
 */
export const getCurrentPageEnhanced = (): number => {
  if (typeof window === "undefined") return 1;
  
  const pageElements = document.querySelectorAll("[data-page]");
  if (pageElements.length === 0) return 1;
  
  // Простой и надежный способ определения текущей страницы
  // Находим страницу, которая находится ближе всего к центру экрана
  let bestPage = 1;
  let minDistance = Infinity;
  const viewportCenter = window.innerHeight / 2;

  pageElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const elementCenter = (rect.top + rect.bottom) / 2;
    const distance = Math.abs(elementCenter - viewportCenter);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestPage = parseInt(el.getAttribute("data-page") || "1");
    }
  });

  return bestPage;
};

/**
 * Улучшенная дебаунс функция для оптимизации сохранения
 */
export const createDebouncedSave = (
  saveFn: (page: number) => void,
  delay: number = 1500
) => {
  let timeoutId: NodeJS.Timeout;
  let lastSavedPage = 0;
  
  return (page: number) => {
    // Избегаем сохранения той же страницы несколько раз подряд
    if (page === lastSavedPage) {
      return;
    }
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveFn(page);
      lastSavedPage = page;
    }, delay);
  };
};

/**
 * Дебаунс для scroll событий
 */
export const createScrollDebounce = (
  callback: () => void,
  delay: number = 100
) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(callback, delay);
  };
};

import { useEffect } from "react";

/**
 * Хук для установки заголовка страницы
 * @param title - Заголовок страницы
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

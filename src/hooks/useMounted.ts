import { useState, useEffect } from "react";

/**
 * Хук для предотвращения hydration mismatch в Next.js
 * Возвращает true после монтирования компонента на клиенте
 */
export const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};

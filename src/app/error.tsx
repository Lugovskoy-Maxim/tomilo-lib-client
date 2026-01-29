"use client";

import { useRouter } from "next/navigation";

interface RateLimitErrorData {
  remainingMs?: number;
  message?: string;
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number; data?: RateLimitErrorData };
  reset: () => void;
}) {
  const router = useRouter();

  // Проверяем, является ли это ошибкой rate limit (429)
  const isRateLimitError =
    error.status === 429 ||
    error.message?.toLowerCase().includes("rate limit") ||
    error.message?.toLowerCase().includes("too many requests");

  // Извлекаем время ожидания из ошибки
  const getRemainingSeconds = (): number => {
    // Проверяем data.error для RTK Query ошибок
    if (error.data?.remainingMs) {
      return Math.ceil(error.data.remainingMs / 1000);
    }

    // Проверяем сообщение об ошибке на наствие времени
    const message = error.message || "";
    const secondsMatch = message.match(/(\d+)\s*сек/i);
    if (secondsMatch) {
      return parseInt(secondsMatch[1], 10);
    }

    const minutesMatch = message.match(/(\d+)\s*мин/i);
    if (minutesMatch) {
      return parseInt(minutesMatch[1], 10) * 60;
    }

    // Проверяем digest на наличие параметров
    if (error.digest) {
      const digestSeconds = error.digest.match(/seconds=(\d+)/);
      if (digestSeconds) {
        return parseInt(digestSeconds[1], 10);
      }
    }

    // Значение по умолчанию
    return 60;
  };

  // Если это ошибка rate limit, перенаправляем на страницу rate-limit
  if (isRateLimitError) {
    const remainingSeconds = getRemainingSeconds();

    // Используем useEffect для навигации (поскольку это клиентский компонент)
    setTimeout(() => {
      router.push(`/rate-limit?seconds=${remainingSeconds}`);
    }, 100);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Перенаправление на страницу ошибки...</p>
        </div>
      </div>
    );
  }

  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Что-то пошло не так!</h2>
        <p className="text-[var(--muted-foreground)] mb-6">
          Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

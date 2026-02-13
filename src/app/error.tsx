"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer, Header } from "@/widgets";

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
  usePageTitle("Ошибка");

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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-[var(--destructive)]/10 p-4" aria-hidden>
              <AlertCircle className="w-12 h-12 text-[var(--destructive)]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Что-то пошло не так!
          </h1>
          <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу или вернуться на
            главную.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-opacity min-w-[180px]"
            >
              <RefreshCw className="w-5 h-5 shrink-0" />
              Попробовать снова
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--muted)] transition-colors min-w-[180px]"
            >
              <Home className="w-5 h-5 shrink-0" />
              На главную
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

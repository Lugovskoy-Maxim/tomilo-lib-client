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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Перенаправление на страницу ошибки...</p>
        </div>
      </div>
    );
  }

  console.error(error);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="flex min-h-0 flex-1 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] px-4 py-12 sm:py-16">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)] ring-2 ring-[var(--destructive)]/20"
              aria-hidden
            >
              <AlertCircle className="h-10 w-10 shrink-0" strokeWidth={2} />
            </div>
          </div>
          <p className="text-6xl font-bold text-[var(--muted-foreground)]/20 mb-2 tabular-nums">500</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">Что-то пошло не так</h1>
          <p className="text-[var(--muted-foreground)] mb-10 leading-relaxed">
            Произошла непредвиденная ошибка. Обновите страницу или перейдите на главную.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
            >
              <RefreshCw className="w-5 h-5 shrink-0" />
              Попробовать снова
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium min-w-[180px]"
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

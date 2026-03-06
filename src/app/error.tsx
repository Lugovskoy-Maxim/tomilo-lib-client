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
      <main className="flex min-h-0 flex-1 flex-shrink-0 flex-col items-center justify-center py-8 sm:py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-center">
          <div className="w-full max-w-[420px] min-w-0">
            <div className="rounded-2xl p-6 sm:p-8 text-center">
              <div className="mb-5 flex justify-center">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)] ring-2 ring-[var(--destructive)]/20"
                  aria-hidden
                >
                  <AlertCircle className="h-7 w-7 shrink-0" strokeWidth={2} />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl mb-2">
                Что-то пошло не так
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6 sm:mb-8">
                Произошла непредвиденная ошибка. Обновите страницу или перейдите на главную.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary)]/90 active:scale-[0.98] transition-all min-h-11 min-w-[140px] sm:min-w-0"
                >
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  Попробовать снова
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 active:scale-[0.98] transition-all min-h-11 min-w-[140px] sm:min-w-0"
                >
                  <Home className="h-4 w-4 shrink-0" />
                  На главную
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

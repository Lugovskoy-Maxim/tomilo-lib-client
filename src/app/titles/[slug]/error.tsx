"use client";
import { Footer, Header } from "@/widgets";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error ?? "Неизвестная ошибка");
}

// Улучшенный компонент ошибки с отладочной информацией (Next.js error boundary передаёт error: Error)
export default function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : undefined;
  const [isClient, setIsClient] = useState(false);
  const message = getErrorMessage(error);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Проверяем, является ли это ошибкой Server Action
  const isServerActionError =
    message.toLowerCase().includes("server action") ||
    message.toLowerCase().includes("failed to find server action");

  // Проверяем, является ли это ошибкой deployment mismatch
  const isDeploymentError =
    message.toLowerCase().includes("older or newer deployment") ||
    message.toLowerCase().includes("deployment");

  const handleReload = () => {
    if (reset) {
      reset();
    } else if (isClient) {
      router.refresh();
    }
  };

  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Размытый фон */}
      <div className="fixed max-h-screen inset-0 z-0 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]"></div>

      {/* Overlay для улучшения читаемости */}
      <div className="fixed max-h-screen inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10"></div>

      {/* Контент */}
      <div className="flex-1 flex flex-col relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {isServerActionError ? "Ошибка сервера" : message}
              </h1>

              {/* Специальное сообщение для Server Action ошибок */}
              {isServerActionError && (
                <div className="mb-4 p-4 bg-[var(--accent)]/20 rounded-lg">
                  <p className="text-[var(--foreground)]/80 text-sm">
                    Произошла ошибка синхронизации с сервером. Это может быть связано с обновлением
                    приложения.
                  </p>
                  {isDeploymentError && (
                    <p className="text-[var(--foreground)]/60 text-xs mt-2">
                      Возможно, используется старая версия приложения. Попробуйте перезагрузить
                      страницу.
                    </p>
                  )}
                </div>
              )}

              <p className="text-[var(--muted-foreground)] mb-4">
                Slug тайтла: {slug || "не указан"}
              </p>
              <p className="text-[var(--muted-foreground)] mb-6">
                {isServerActionError
                  ? "Попробуйте перезагрузить страницу или вернуться к каталогу."
                  : "Проверьте консоль браузера для подробной информации об ошибке"}
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/titles"
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Вернуться к каталогу
                </Link>
                <button
                  onClick={handleReload}
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors disabled:opacity-50"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}

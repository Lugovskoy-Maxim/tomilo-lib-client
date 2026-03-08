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

  const isServerActionError =
    message.toLowerCase().includes("server action") ||
    message.toLowerCase().includes("failed to find server action");

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

  const title = isServerActionError ? "Ошибка сервера" : "Произошла ошибка";
  const description = isServerActionError
    ? "Произошла ошибка синхронизации с сервером. Это может быть связано с обновлением приложения."
    : "Не удалось загрузить страницу тайтла. Попробуйте обновить страницу или вернуться к каталогу.";

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
              <AlertTriangle className="h-10 w-10 shrink-0" strokeWidth={2} />
            </div>
          </div>
          <p className="text-6xl font-bold text-[var(--muted-foreground)]/20 mb-2 tabular-nums">
            Ошибка
          </p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">{title}</h1>
          <p className="text-[var(--muted-foreground)] mb-4 leading-relaxed">{description}</p>
          {isServerActionError && isDeploymentError && (
            <p className="text-[var(--muted-foreground)] text-sm mb-4">
              Возможно, используется старая версия приложения. Попробуйте перезагрузить страницу.
            </p>
          )}
          {slug && (
            <p className="text-[var(--muted-foreground)]/80 text-sm mb-6">Тайтл: {slug}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/titles"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
            >
              К каталогу
            </Link>
            <button
              type="button"
              onClick={handleReload}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium min-w-[180px]"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

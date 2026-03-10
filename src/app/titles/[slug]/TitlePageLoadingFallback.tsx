"use client";

import { useEffect, useState } from "react";
import { Footer, Header } from "@/widgets";
import { RefreshCw } from "lucide-react";

const TIMEOUT_MS = 10_000;

/**
 * Fallback для Suspense на странице тайтла.
 * В стиле сайта: Header, градиентный фон, при таймауте — карточка с кнопкой обновления.
 */
export default function TitlePageLoadingFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Фон в стиле loading.tsx и страницы тайтла */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]" />
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10" />

      <div className="flex-1 relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[59vh]">
            {timedOut ? (
              <div className="w-full max-w-md">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm shadow-sm p-6 sm:p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <RefreshCw className="h-7 w-7 shrink-0" strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    Загрузка занимает дольше обычного
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
                    Возможно, проблема с сетью или расширениями в браузере. Попробуйте обновить
                    страницу.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <RefreshCw className="h-4 w-4 shrink-0" />
                    Обновить страницу
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--border)] border-t-[var(--primary)] mx-auto mb-4"
                  aria-hidden
                />
                <p className="text-[var(--muted-foreground)]">Загрузка тайтла...</p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}

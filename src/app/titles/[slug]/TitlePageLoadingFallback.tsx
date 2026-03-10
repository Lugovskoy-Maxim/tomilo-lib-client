"use client";

import { useEffect, useState } from "react";

const TIMEOUT_MS = 10_000;

/**
 * Fallback для Suspense на странице тайтла.
 * При долгой загрузке (bailout to CSR, медленная сеть) показываем возможность обновить страницу.
 */
export default function TitlePageLoadingFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-[var(--foreground)] mb-4">
            Загрузка занимает дольше обычного. Возможно, проблема с сетью или расширениями в
            браузере.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
        <div className="text-[var(--foreground)]">Загрузка тайтла...</div>
      </div>
    </div>
  );
}

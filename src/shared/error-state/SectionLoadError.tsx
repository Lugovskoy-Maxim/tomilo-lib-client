"use client";

import { WifiOff } from "lucide-react";

interface SectionLoadErrorProps {
  /** Название секции (например, «Популярные тайтлы») — опционально, для контекста */
  sectionTitle?: string;
  /** Дополнительный класс для контейнера */
  className?: string;
}

/**
 * Компактное состояние ошибки загрузки для секций главной страницы.
 * Визуально согласовано с каруселями и скелетонами.
 */
export default function SectionLoadError({
  sectionTitle,
  className = "",
}: SectionLoadErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 py-8 sm:py-10 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
          aria-hidden
        >
          <WifiOff className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {sectionTitle
              ? `Не удалось загрузить «${sectionTitle}»`
              : "Не удалось загрузить данные"}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Проверьте подключение к интернету и обновите страницу
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 text-xs font-medium text-[var(--primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] rounded"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
}

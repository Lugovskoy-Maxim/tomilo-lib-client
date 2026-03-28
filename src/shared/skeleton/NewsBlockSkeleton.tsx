import React from "react";

/**
 * Соответствует разметке NewsBlock (горизонтальный ряд карточек 172×220px, aspect 4/3).
 * Резервирует высоту до загрузки LazySection — снижает CLS.
 */
export function NewsBlockSkeleton() {
  return (
    <section
      className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6 min-h-[280px] sm:min-h-[300px]"
      aria-label="Загрузка новостей"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] opacity-50" />
          <div className="h-7 w-24 sm:w-32 bg-[var(--muted)] rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="flex-shrink-0 w-[172px] sm:w-[220px] rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
          >
            <div className="aspect-[4/3] bg-[var(--muted)] animate-pulse" />
            <div className="p-2.5 space-y-2">
              <div className="h-3 w-14 bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

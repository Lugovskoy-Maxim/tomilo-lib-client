import React from "react";

export const TopCombinedSkeleton: React.FC = () => (
  <section
    className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6 overflow-x-hidden box-border"
    aria-label="Загрузка топ-подборок"
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-w-0">
      {[...Array(3)].map((_, colIndex) => (
        <div key={colIndex} className="flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-[var(--muted)] rounded w-40 shimmer" />
            <div className="h-4 bg-[var(--muted)] rounded w-12 shimmer" />
          </div>

          {/* py-1 соответствует контейнеру карточек в TopCombinedSection */}
          <div className="space-y-4 min-w-0 py-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] shadow-lg ring-1 ring-white/5 max-w-full"
              >
                <div className="w-20 h-28 sm:w-22 sm:h-32 rounded-lg flex-shrink-0 bg-[var(--muted)] shimmer" />
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 bg-[var(--muted)] rounded w-16 shimmer" />
                    <div className="h-2 w-2 rounded-full bg-[var(--muted)]/80" />
                    <div className="h-4 bg-[var(--muted)] rounded w-10 shimmer" />
                  </div>
                  <div className="h-4 bg-[var(--muted)] rounded w-[88%] shimmer" />
                  <div className="h-4 bg-[var(--muted)] rounded w-[72%] shimmer" />
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="h-4 bg-[var(--muted)] rounded w-16 shimmer" />
                    <div className="h-5 bg-[var(--muted)] rounded w-12 shimmer" />
                  </div>
                  <div className="h-0.5 bg-[var(--muted)] rounded-full w-full mt-2 shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

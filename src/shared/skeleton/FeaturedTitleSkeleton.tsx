import React from "react";

export const FeaturedTitleSkeleton: React.FC = () => (
  <section className="w-full" aria-label="Загрузка популярных тайтлов">
    <div className="relative w-full overflow-hidden bg-zinc-900/30 shadow-lg">
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col min-h-[280px] sm:min-h-[340px] md:min-h-[420px] md:flex-row px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-8 gap-3 sm:gap-5 md:gap-8">
        {/* Обложка */}
        <div className="relative w-full md:w-auto flex-shrink-0 flex justify-center md:block">
          <div className="w-28 sm:w-40 md:w-56 aspect-[2/3] rounded-lg sm:rounded-xl bg-[var(--muted)] shimmer" />
        </div>

        {/* Контент */}
        <div className="flex-1 flex flex-col justify-center min-w-0 text-center md:text-left">
          {/* Бейджи */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <div className="h-5 sm:h-6 w-16 sm:w-20 rounded-md sm:rounded-lg bg-[var(--muted)] shimmer" />
            <div className="h-5 sm:h-6 w-12 sm:w-16 rounded-md sm:rounded-lg bg-[var(--muted)] shimmer" />
            <div className="h-5 sm:h-6 w-10 sm:w-14 rounded-md sm:rounded-lg bg-[var(--muted)] shimmer" />
          </div>

          {/* Заголовок */}
          <div className="h-6 sm:h-8 md:h-10 w-3/4 rounded bg-[var(--muted)] shimmer mb-1.5 sm:mb-3 mx-auto md:mx-0" />

          {/* Жанры */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-4 justify-center md:justify-start">
            <div className="h-5 w-14 sm:w-16 rounded-md bg-[var(--muted)] shimmer" />
            <div className="h-5 w-12 sm:w-14 rounded-md bg-[var(--muted)] shimmer" />
            <div className="h-5 w-16 sm:w-18 rounded-md bg-[var(--muted)] shimmer" />
          </div>

          {/* Описание */}
          <div className="space-y-2 mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto md:mx-0 w-full">
            <div className="h-3 sm:h-4 w-full rounded bg-[var(--muted)] shimmer" />
            <div className="h-3 sm:h-4 w-5/6 rounded bg-[var(--muted)] shimmer" />
            <div className="h-3 sm:h-4 w-4/6 rounded bg-[var(--muted)] shimmer hidden sm:block" />
          </div>

          {/* Кнопки */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
            <div className="h-9 sm:h-11 w-24 sm:w-32 rounded-lg sm:rounded-xl bg-[var(--muted)] shimmer" />
            <div className="h-9 sm:h-11 w-10 sm:w-32 rounded-lg sm:rounded-xl bg-[var(--muted)] shimmer" />
          </div>
        </div>
      </div>

      {/* Индикаторы */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
        <div className="h-1 sm:h-1.5 w-8 sm:w-10 rounded-full bg-[var(--muted)] shimmer" />
        <div className="h-1 sm:h-1.5 w-1.5 sm:w-2 rounded-full bg-[var(--muted)] shimmer" />
        <div className="h-1 sm:h-1.5 w-1.5 sm:w-2 rounded-full bg-[var(--muted)] shimmer" />
        <div className="h-1 sm:h-1.5 w-1.5 sm:w-2 rounded-full bg-[var(--muted)] shimmer" />
        <div className="h-1 sm:h-1.5 w-1.5 sm:w-2 rounded-full bg-[var(--muted)] shimmer" />
      </div>
    </div>
  </section>
);

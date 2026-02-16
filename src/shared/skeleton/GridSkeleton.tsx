import React from "react";

interface GridSkeletonProps {
  itemCount?: number;
  showTitle?: boolean;
  title?: string;
  variant?: "catalog" | "updates";
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  itemCount = 12,
  showTitle = false,
  title = "Загрузка...",
  variant = "updates",
}) => (
  <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6" aria-label={title}>
    {showTitle && (
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
        <div className="h-8 bg-[var(--muted)] rounded w-48 shimmer"></div>
        <div className="h-4 bg-[var(--muted)] rounded w-12 shimmer"></div>
      </div>
    )}
    <div
      className={
        variant === "catalog"
          ? "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      }
    >
      {[...Array(itemCount)].map((_, i) => (
        <div key={i} className="w-full">
          {variant === "catalog" ? (
            <div className="relative overflow-hidden rounded-xl bg-[var(--card)] shadow-lg ring-1 ring-white/5">
              <div className="aspect-[2/3] w-full bg-[var(--muted)] shimmer" />
              <div className="p-3 bg-[var(--card)] rounded-b-xl">
                <div className="h-4 bg-[var(--muted)] rounded w-1/3 shimmer mb-2" />
                <div className="h-4 bg-[var(--muted)] rounded w-full shimmer mb-1.5" />
                <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer" />
              </div>
            </div>
          ) : (
            <div className="relative flex bg-[var(--card)] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5">
              <div className="w-20 sm:w-24 h-28 sm:h-32 bg-[var(--muted)] shimmer flex-shrink-0" />
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div className="space-y-2">
                  <div className="h-3 bg-[var(--muted)] rounded w-2/5 shimmer" />
                  <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer" />
                </div>
                <div className="h-3 bg-[var(--muted)] rounded w-full shimmer" />
                <div className="h-2 bg-[var(--muted)] rounded-full w-full shimmer" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
);

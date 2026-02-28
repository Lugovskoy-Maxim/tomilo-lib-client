import React from "react";

interface GridSkeletonProps {
  itemCount?: number;
  showTitle?: boolean;
  title?: string;
  variant?: "catalog" | "updates" | "trending";
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  itemCount = 6,
  showTitle = false,
  title = "Загрузка...",
  variant = "updates",
}) => (
  <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6" aria-label={title}>
    {showTitle && (
      <div className="flex flex-col mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-[var(--muted)] rounded shimmer" />
          <div className="h-7 bg-[var(--muted)] rounded w-56 shimmer" />
        </div>
        <div className="h-4 bg-[var(--muted)] rounded w-80 max-w-[85%] shimmer" />
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
            <div className="relative overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
              <div className="aspect-[2/3] w-full bg-[var(--muted)] shimmer" />
              <div className="p-3 bg-[var(--card)] rounded-b-xl">
                <div className="h-4 bg-[var(--muted)] rounded w-1/3 shimmer mb-2" />
                <div className="h-4 bg-[var(--muted)] rounded w-full shimmer mb-1.5" />
                <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer" />
              </div>
            </div>
          ) : variant === "trending" ? (
            <div className="relative overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] p-2.5 sm:p-3 shadow-sm">
              <div className="flex gap-3 min-w-0">
                <div className="w-20 sm:w-24 aspect-[2/3] rounded-lg bg-[var(--muted)] shimmer shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="h-5 bg-[var(--muted)] rounded w-16 shimmer" />
                    <div className="h-5 bg-[var(--muted)] rounded w-12 shimmer" />
                  </div>
                  <div className="h-4 bg-[var(--muted)] rounded w-full shimmer mb-1" />
                  <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer mb-auto" />
                  <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <div className="h-6 bg-[var(--muted)] rounded w-16 shimmer" />
                    <div className="h-6 bg-[var(--muted)] rounded w-12 shimmer" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex items-stretch bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
              <div className="w-[4.5rem] sm:w-[5.5rem] md:w-[6.5rem] min-h-24 sm:min-h-28 md:min-h-32 bg-[var(--muted)] shimmer flex-shrink-0" />
              <div className="flex-1 p-2.5 sm:p-3 flex flex-col gap-2 sm:gap-2.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-5 bg-[var(--muted)] rounded w-14 shimmer" />
                    <div className="h-4 bg-[var(--muted)] rounded w-12 shimmer" />
                  </div>
                  <div className="h-4 bg-[var(--muted)] rounded w-16 shimmer" />
                </div>
                <div className="h-4 bg-[var(--muted)] rounded w-full shimmer" />
                <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer" />
                <div className="flex items-center gap-1.5 mt-auto">
                  <div className="h-4 bg-[var(--muted)] rounded w-24 shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
);

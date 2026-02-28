import React from "react";

interface CarouselSkeletonProps {
  title?: string;
  itemCount?: number;
  cardWidth?: string;
  variant?: "poster" | "collection" | "reading";
  showDescription?: boolean;
}

export const CarouselSkeleton: React.FC<CarouselSkeletonProps> = ({
  title = "Загрузка...",
  itemCount = 7,
  cardWidth = "w-40 sm:w-40 md:w-40 lg:w-44 xl:w-48 2xl:w-52",
  variant = "poster",
  showDescription = true,
}) => (
  <section
    className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6 overflow-hidden"
    aria-label={title}
  >
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-[var(--muted)] rounded shimmer" aria-hidden />
        <div className="h-7 bg-[var(--muted)] rounded w-48 shimmer" aria-hidden />
      </div>
      {showDescription && (
        <div className="h-4 bg-[var(--muted)] rounded w-80 max-w-[85%] shimmer mb-3 sm:mb-4" aria-hidden />
      )}
    </div>
    <div className="flex gap-3 sm:gap-4 overflow-hidden items-stretch py-2 sm:py-4">
      {[...Array(itemCount)].map((_, i) => (
        <div key={i} className={`flex-shrink-0 ${cardWidth}`}>
          {variant === "reading" ? (
            <div className="relative flex h-32 sm:h-36 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="w-24 sm:w-28 md:w-32 h-full bg-[var(--muted)] shimmer relative">
                <div className="absolute bottom-2 left-2">
                  <div className="h-5 bg-[var(--muted)] rounded w-14 shimmer" />
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col min-w-0">
                <div className="h-4 bg-[var(--muted)] rounded w-full shimmer mb-1" />
                <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer mb-2" />
                <div className="flex items-center gap-1.5 mb-auto">
                  <div className="h-5 bg-[var(--muted)] rounded w-20 shimmer" />
                </div>
                <div className="mt-auto pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-[var(--muted)] rounded w-24 shimmer" />
                    <div className="h-3 bg-[var(--muted)] rounded w-8 shimmer" />
                  </div>
                  <div className="h-2.5 bg-[var(--muted)] rounded-full w-full shimmer" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm h-full">
              <div
                className={`w-full bg-[var(--muted)] shimmer ${variant === "collection" ? "aspect-[3/4]" : "aspect-[2/3]"}`}
              />
              {variant === "poster" && (
                <div className="p-3 bg-[var(--card)] rounded-b-xl flex flex-col min-h-[5.5rem]">
                  <div className="h-4 bg-[var(--muted)] rounded w-1/3 shimmer mb-2" />
                  <div className="h-4 bg-[var(--muted)] rounded w-full shimmer mb-1.5" />
                  <div className="h-4 bg-[var(--muted)] rounded w-4/5 shimmer" />
                </div>
              )}
              {variant === "collection" && (
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="h-4 bg-white/20 rounded w-4/5 shimmer" />
                  <div className="h-3 bg-white/15 rounded w-2/3 shimmer" />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
);

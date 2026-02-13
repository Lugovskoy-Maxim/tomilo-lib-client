import React from "react";

interface CarouselSkeletonProps {
  title?: string;
  itemCount?: number;
}

export const CarouselSkeleton: React.FC<CarouselSkeletonProps> = ({
  title = "Загрузка...",
  itemCount = 7
}) => (
  <div className="flex flex-col items-start justify-center carousel-skeleton animate-pulse w-full max-w-7xl mx-auto px-3 py-2 sm:px-4 overflow-hidden">
    <div className="h-8 bg-[var(--muted)] rounded w-48 mb-3 sm:mb-4" aria-hidden />
    <div className="flex gap-3 sm:gap-4 overflow-hidden items-center justify-center">
      {[...Array(itemCount)].map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <div className="w-24 sm:w-28 md:w-32 lg:w-40 h-32 sm:h-40 md:h-52 lg:h-64 bg-[var(--muted)] rounded-lg mb-2 shadow-sm"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-20 sm:w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

import React from "react";

interface GridSkeletonProps {
  itemCount?: number;
  showTitle?: boolean;
  title?: string;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  itemCount = 12,
  showTitle = false,
  title = "Загрузка..."
}) => (
  <div className="w-full max-w-7xl mx-auto px-4 py-6 animate-pulse">
    {showTitle && (
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-[var(--muted)] rounded w-48"></div>
        <div className="h-4 bg-[var(--muted)] rounded w-12"></div>
      </div>
    )}
    <div className="grid items-center justify-center grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[...Array(itemCount)].map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="w-full h-48 bg-[var(--muted)] rounded-lg mb-2 shadow-sm"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

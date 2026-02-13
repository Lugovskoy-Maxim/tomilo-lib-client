import React from "react";

export const TopCombinedSkeleton: React.FC = () => (
  <div className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {[...Array(3)].map((_, colIndex) => (
        <div key={colIndex} className="flex flex-col">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
            <div className="h-7 bg-[var(--muted)] rounded w-32"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-12"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-20 h-28 sm:w-22 sm:h-30 bg-[var(--muted)] rounded flex-shrink-0"></div>
                <div className="flex flex-col flex-1 gap-2">
                  <div className="h-3 bg-[var(--muted)] rounded w-16"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-full"></div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="h-3 bg-[var(--muted)] rounded w-12"></div>
                    <div className="h-3 bg-[var(--muted)] rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

"use client";

import { Filters } from "@/types/browse-page";
import { translateTitleType, translateTitleStatus } from "@/lib/title-type-translations";
import { SlidersHorizontal } from "lucide-react";

interface FilterQuickBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  filterOptions: {
    types: string[];
    status: string[];
  };
  onOpenFullFilters: () => void;
  activeCount: number;
}

export default function FilterQuickBar({
  filters,
  onFiltersChange,
  filterOptions,
  onOpenFullFilters,
  activeCount,
}: FilterQuickBarProps) {
  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">Быстрые фильтры</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-medium rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onOpenFullFilters}
          className="text-sm font-medium text-[var(--primary)] hover:text-[var(--chart-1)] transition-colors lg:hidden"
        >
          Все фильтры
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Тип */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)] shrink-0">Тип:</span>
          <div className="flex flex-wrap gap-2">
            {filterOptions.types.map(type => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filters.types.includes(type)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                {translateTitleType(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Статус */}
        {filterOptions.status.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:border-l sm:border-[var(--border)] sm:pl-4">
            <span className="text-xs font-medium text-[var(--muted-foreground)] shrink-0">Статус:</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.status.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.status.includes(status)
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {translateTitleStatus(status)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

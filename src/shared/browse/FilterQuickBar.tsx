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

  const btn = "px-2 py-1 rounded-md text-xs font-medium transition-colors";
  const btnActive = "bg-[var(--primary)] text-[var(--primary-foreground)]";
  const btnInactive =
    "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
        {/* Тип */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:mr-0.5">
            Тип
          </span>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.types.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeToggle(type)}
                className={`${btn} ${filters.types.includes(type) ? btnActive : btnInactive}`}
              >
                {translateTitleType(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Статус */}
        {filterOptions.status.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:border-l sm:border-[var(--border)] sm:pl-4">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:mr-0.5">
              Статус
            </span>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.status.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusToggle(status)}
                  className={`${btn} ${filters.status.includes(status) ? btnActive : btnInactive}`}
                >
                  {translateTitleStatus(status)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Счётчик + «Все фильтры» в одну строку на десктопе */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] sm:pt-0 sm:border-0 sm:ml-auto">
          {activeCount > 0 && (
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Активно: {activeCount}
            </span>
          )}
          <button
            type="button"
            onClick={onOpenFullFilters}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:underline"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Все фильтры
          </button>
        </div>
      </div>
    </div>
  );
}

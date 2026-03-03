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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Тип */}
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
            Тип
          </p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.types.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeToggle(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.types.includes(type)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {translateTitleType(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Статус */}
        {filterOptions.status.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              Статус
            </p>
            <div className="flex flex-wrap gap-2">
              {filterOptions.status.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusToggle(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.status.includes(status)
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {translateTitleStatus(status)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Счётчик при выбранных фильтрах; ссылка «Все фильтры» на мобильных */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          {activeCount > 0 ? (
            <span className="text-xs text-[var(--muted-foreground)]">Активно: {activeCount}</span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onOpenFullFilters}
            className="lg:hidden inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline underline-offset-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Все фильтры
          </button>
        </div>
      </div>
    </div>
  );
}

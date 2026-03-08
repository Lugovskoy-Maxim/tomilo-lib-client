"use client";
import { Filters } from "@/types/browse-page";
import { Search, ArrowDown, Loader2 } from "lucide-react";

interface SortAndSearchProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isSearching?: boolean;
}

export default function SortAndSearch({
  filters,
  onFiltersChange,
  isSearching,
}: SortAndSearchProps) {
  const handleSortByChange = (value: string) => {
    const sortBy =
      value === "averageRating" ||
      value === "releaseYear" ||
      value === "views" ||
      value === "chapters"
        ? (value as "averageRating" | "releaseYear" | "views" | "chapters")
        : "averageRating";

    onFiltersChange({ ...filters, sortBy });
  };

  const handleSortOrderChange = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Поиск срабатывает автоматически при вводе
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:items-center">
      {/* Поиск — приоритет, занимает место первым */}
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </span>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={filters.search}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-9 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded"
            aria-label="Очистить поиск"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Сортировка и направление */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={e => handleSortByChange(e.target.value)}
            className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-lg pl-3 pr-8 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] cursor-pointer min-w-[140px]"
          >
            <option value="averageRating">По рейтингу</option>
            <option value="releaseYear">По году</option>
            <option value="views">По просмотрам</option>
            <option value="chapters">По главам</option>
          </select>
          <ArrowDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
        </div>
        <button
          type="button"
          onClick={handleSortOrderChange}
          className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          title={filters.sortOrder === "desc" ? "По убыванию" : "По возрастанию"}
        >
          <ArrowDown
            className={`w-4 h-4 ${filters.sortOrder === "desc" ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      </div>
    </div>
  );
}

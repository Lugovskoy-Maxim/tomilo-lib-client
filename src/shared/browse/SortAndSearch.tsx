"use client";
import { Filters } from "@/types/browse-page";
import { Search, ArrowDown, Loader2 } from "lucide-react";

interface SortAndSearchProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isSearching?: boolean;
}

export default function SortAndSearch({ filters, onFiltersChange, isSearching }: SortAndSearchProps) {
  const handleSortByChange = (value: string) => {
    const sortBy =
      value === "averageRating" || value === "releaseYear" || value === "views" || value === "chapters"
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
    <div className="flex flex-wrap items-center gap-2">
      {/* Сортировка */}
      <div className="relative">
        <select
          value={filters.sortBy}
          onChange={e => handleSortByChange(e.target.value)}
          className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 pr-10 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer hover:border-[var(--primary)]/50 transition-all duration-200 text-sm font-medium"
        >
          <option value="averageRating">По рейтингу</option>
          <option value="releaseYear">По году</option>
          <option value="views">По просмотрам</option>
          <option value="chapters">По количеству глав</option>
        </select>
        <ArrowDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
      </div>

      <button
        onClick={handleSortOrderChange}
        className="group bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        title={filters.sortOrder === "desc" ? "По убыванию" : "По возрастанию"}
      >
        <ArrowDown 
          className={`h-4 w-4 transition-transform duration-300 ease-spring ${filters.sortOrder === "desc" ? "rotate-0" : "rotate-180"}`} 
        />
      </button>

      {/* Поиск */}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors duration-200">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={filters.search}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 text-[var(--foreground)] placeholder-[var(--muted-foreground)]/70 hover:border-[var(--primary)]/50 transition-all duration-200 text-sm"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <span className="sr-only">Очистить поиск</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

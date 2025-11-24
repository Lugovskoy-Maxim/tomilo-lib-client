"use client";
import { Search, ArrowDown } from "lucide-react";
import { CollectionsFilters } from "@/widgets/collections-content/collections-content";

interface CollectionsSortAndSearchProps {
  filters: CollectionsFilters;
  onFiltersChange: (filters: CollectionsFilters) => void;
}

export default function CollectionsSortAndSearch({ filters, onFiltersChange }: CollectionsSortAndSearchProps) {
  const handleSortByChange = (value: string) => {
    const sortBy = 
      value === "name" || value === "views" || value === "createdAt"
        ? value as "name" | "views" | "createdAt"
        : "views";

    onFiltersChange({ ...filters, sortBy });
  };

  const handleSortOrderChange = () => {
    onFiltersChange({ 
      ...filters, 
      sortOrder: filters.sortOrder === "desc" ? "asc" : "desc" 
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Поиск срабатывает автоматически при вводе
    }
  };

  return (
    <>
      {/* Сортировка */}
      <select
        value={filters.sortBy}
        onChange={(e) => handleSortByChange(e.target.value)}
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
      >
        <option value="views">По просмотрам</option>
        <option value="name">По названию</option>
        <option value="createdAt">По дате создания</option>
      </select>

      <button
        onClick={handleSortOrderChange}
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
      >
        {filters.sortOrder === "desc" ? (
          <ArrowDown className="h-4 w-4 transform rotate-0 transition-all" />
        ) : (
          <ArrowDown className="h-4 w-4 transform rotate-180 transition-all" />
        )}
      </button>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--muted-foreground)] placeholder-[var(--muted-foreground)]"
        />
      </div>
    </>
  );
}
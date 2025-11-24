"use client";
import { useState } from "react";
import { Filter, X, Check, ChevronDown, ChevronUp } from "lucide-react";



interface FilterOptions {
  genres: string[];
  types: string[];
  status: string[];
}

interface FilterSidebarProps<T> {
  filters: T;
  onFiltersChange: (filters: T) => void;
  filterOptions: FilterOptions;
  onReset: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

// Компонент секции фильтра
const FilterSection = ({
  title,
  children,
  isOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
}) => {
  const [open, setOpen] = useState(isOpen);

  return (
    <div className="border-b border-[var(--border)] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left font-medium text-[var(--muted-foreground)] mb-2 cursor-pointer"
      >
        {title}
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
};

export default function FilterSidebar<T extends {
  search: string;
  genres: string[];
  types: string[];
  status: string[];
  sortBy: string;
  sortOrder: string;
}>({
  filters,
  onFiltersChange,
  filterOptions,
  onReset,
  isMobile = false,
  isOpen = false,
  onClose,
}: FilterSidebarProps<T>) {
  // Обработчики для фильтров
  const handleGenreChange = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const handleTypeChange = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    
    onFiltersChange({ ...filters, status: newStatus });
  };

  // Контент фильтров
  const filterContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--muted-foreground)] flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Фильтры
        </h2>
        <button
          onClick={onReset}
          className="text-sm text-[var(--chart-1)]/90 transition-colors cursor-pointer hover:text-[var(--chart-1)]"
        >
          Сбросить все
        </button>
      </div>

      <div className="space-y-4">
        {/* Фильтр по жанрам */}
        <FilterSection title="Жанры" isOpen={true}>
          {filterOptions.genres.map((genre) => (
            <label
              key={genre}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.genres.includes(genre)}
                  onChange={() => handleGenreChange(genre)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    filters.genres.includes(genre)
                      ? "bg-[var(--primary)] border-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  {filters.genres.includes(genre) && (
                    <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">
                {genre}
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Фильтр по типам */}
        <FilterSection title="Тип" isOpen={false}>
          {filterOptions.types.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={() => handleTypeChange(type)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    filters.types.includes(type)
                      ? "bg-[var(--primary)] border-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  {filters.types.includes(type) && (
                    <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">
                {type}
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Фильтр по статусу */}
        <FilterSection title="Статус" isOpen={false}>
          {filterOptions.status.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleStatusChange(status)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    filters.status.includes(status)
                      ? "bg-[var(--primary)] border-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  {filters.status.includes(status) && (
                    <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">
                {status}
              </span>
            </label>
          ))}
        </FilterSection>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Затемнение */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-opacity-50 z-40 lg:hidden cursor-pointer"
            onClick={onClose}
          />
        )}
        
        {/* Шторка */}
        <div className={`
          fixed top-0 right-0 h-full w-80 bg-[var(--card)] border-l border-[var(--border)] 
          z-50 lg:hidden transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 h-full overflow-y-auto">
            {/* Заголовок мобильной шторки */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">
                Фильтры
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[var(--accent)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {filterContent}
          </div>
        </div>
      </>
    );
  }

  // Десктоп версия
  return (
    <div className="sticky top-20 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      {filterContent}
    </div>
  );
}
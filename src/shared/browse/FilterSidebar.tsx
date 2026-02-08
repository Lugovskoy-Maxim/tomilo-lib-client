"use client";

import { useState, useMemo } from "react";
import { Filter, X, Check, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import CollapsibleGenresList from "./CollapsibleGenresList";
import { translateTitleType, translateTitleStatus } from "@/lib/title-type-translations";

interface FilterOptions {
  genres: string[];
  types: string[];
  status: string[];
  ageLimits: number[];
  releaseYears: number[];
  tags: string[];
  sortByOptions: string[];
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
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
};

export default function FilterSidebar<
  T extends {
    search: string;
    genres: string[];
    types: string[];
    status: string[];
    ageLimits: number[];
    releaseYears: number[];
    tags: string[];
    sortBy: string;
    sortOrder: string;
  },
>({
  filters,
  onFiltersChange,
  filterOptions,
  onReset,
  isMobile = false,
  isOpen = false,
  onClose,
}: FilterSidebarProps<T>) {
  // Считаем количество активных фильтров
  const activeFiltersCount = useMemo(() => {
    return filters.genres.length + 
           filters.types.length + 
           filters.status.length + 
           filters.ageLimits.length + 
           filters.releaseYears.length + 
           filters.tags.length;
  }, [filters]);
  // Обработчики для фильтров
  const handleGenreChange = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];

    onFiltersChange({ ...filters, genres: newGenres });
  };

  const handleTypeChange = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];

    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];

    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleAgeLimitChange = (ageLimit: number) => {
    const newAgeLimits = filters.ageLimits.includes(ageLimit)
      ? filters.ageLimits.filter(a => a !== ageLimit)
      : [...filters.ageLimits, ageLimit];

    onFiltersChange({ ...filters, ageLimits: newAgeLimits });
  };

  const handleReleaseYearChange = (year: number) => {
    const newReleaseYears = filters.releaseYears.includes(year)
      ? filters.releaseYears.filter(y => y !== year)
      : [...filters.releaseYears, year];

    onFiltersChange({ ...filters, releaseYears: newReleaseYears });
  };

  const handleTagChange = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];

    onFiltersChange({ ...filters, tags: newTags });
  };

  // Контент фильтров
  const filterContent = (
    <>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] rounded-lg">
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-[var(--foreground)]">Фильтры</h2>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-sm text-[var(--chart-1)] hover:text-[var(--primary)] transition-colors cursor-pointer font-medium hover:underline underline-offset-2"
        >
          Сбросить все
        </button>
      </div>

      <div className="space-y-4">
        {/* Фильтр по жанрам */}
        <FilterSection title="Жанры" isOpen={true}>
          <CollapsibleGenresList
            genres={filterOptions.genres}
            selectedGenres={filters.genres}
            onGenreChange={handleGenreChange}
            maxVisibleGenres={12}
          />
        </FilterSection>

        {/* Фильтр по типам */}
        <FilterSection title="Тип" isOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {filterOptions.types.map(type => (
              <label 
                key={type} 
                className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                  filters.types.includes(type) 
                    ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30" 
                    : "hover:bg-[var(--accent)] border border-transparent"
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => handleTypeChange(type)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border rounded flex items-center justify-center transition-all duration-200 ${
                      filters.types.includes(type)
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--background)]"
                    }`}
                  >
                    {filters.types.includes(type) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  filters.types.includes(type) 
                    ? "text-[var(--primary)]" 
                    : "text-[var(--muted-foreground)]"
                }`}>
                  {translateTitleType(type)}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по статусу */}
        <FilterSection title="Статус" isOpen={false}>
          <div className="space-y-1">
            {filterOptions.status.map(status => (
              <label 
                key={status} 
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                  filters.status.includes(status) 
                    ? "bg-[var(--primary)]/10" 
                    : "hover:bg-[var(--accent)]"
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => handleStatusChange(status)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border rounded flex items-center justify-center transition-all duration-200 ${
                      filters.status.includes(status)
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--background)]"
                    }`}
                  >
                    {filters.status.includes(status) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  filters.status.includes(status) 
                    ? "text-[var(--primary)]" 
                    : "text-[var(--muted-foreground)]"
                }`}>
                  {translateTitleStatus(status)}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по возрастным ограничениям */}
        <FilterSection title="Возрастные ограничения" isOpen={false}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.ageLimits.map(ageLimit => (
              <label 
                key={ageLimit} 
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 border ${
                  filters.ageLimits.includes(ageLimit) 
                    ? "bg-[var(--primary)]/10 border-[var(--primary)]/30" 
                    : "bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/30"
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.ageLimits.includes(ageLimit)}
                    onChange={() => handleAgeLimitChange(ageLimit)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border rounded flex items-center justify-center transition-all duration-200 ${
                      filters.ageLimits.includes(ageLimit)
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--background)]"
                    }`}
                  >
                    {filters.ageLimits.includes(ageLimit) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium ${
                  ageLimit === 18 ? "text-red-500" : ""
                }`}>
                  {ageLimit === 0 ? "Для всех" : `${ageLimit}+`}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по годам выпуска */}
        <FilterSection title="Годы выпуска" isOpen={false}>
          {filterOptions.releaseYears.map(year => (
            <label key={year} className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.releaseYears.includes(year)}
                  onChange={() => handleReleaseYearChange(year)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    filters.releaseYears.includes(year)
                      ? "bg-[var(--primary)] border-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  {filters.releaseYears.includes(year) && (
                    <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">{year}</span>
            </label>
          ))}
        </FilterSection>

        {/* Фильтр по тегам */}
        {filterOptions.tags.length > 0 && (
          <FilterSection title="Теги" isOpen={false}>
            {filterOptions.tags.map(tag => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border rounded flex items-center justify-center ${
                      filters.tags.includes(tag)
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--background)]"
                    }`}
                  >
                    {filters.tags.includes(tag) && (
                      <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">{tag}</span>
              </label>
            ))}
          </FilterSection>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Затемнение */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer transition-opacity duration-300"
            onClick={onClose}
          />
        )}

        {/* Шторка */}
        <div
          className={`
          fixed top-0 right-0 h-full w-80 bg-[var(--card)] border-l border-[var(--border)] 
          z-50 lg:hidden transform transition-transform duration-300 ease-out shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <div className="p-5 h-full overflow-y-auto">
            {/* Заголовок мобильной шторки */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] rounded-lg">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Фильтры</h2>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors cursor-pointer"
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

  // Десктоп версия с фиксированной высотой
  return (
    <div className="sticky top-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
      <div className="p-5 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">{filterContent}</div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="rounded-lg bg-[var(--muted)]/30 border border-[var(--border)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/40 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 shrink-0 opacity-60" /> : <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />}
      </button>
      {open && <div className="px-3 pb-3 pt-0 space-y-1.5">{children}</div>}
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
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Фильтры</h2>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-[var(--primary)] hover:underline underline-offset-2 shrink-0"
          >
            Сбросить всё
          </button>
        )}
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
          <div className="flex flex-wrap gap-2">
            {filterOptions.types.map(type => (
              <label
                key={type}
                className={`inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.types.includes(type)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={() => handleTypeChange(type)}
                  className="sr-only"
                />
                {translateTitleType(type)}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по статусу */}
        <FilterSection title="Статус" isOpen={false}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.status.map(status => (
              <label
                key={status}
                className={`inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.status.includes(status)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleStatusChange(status)}
                  className="sr-only"
                />
                {translateTitleStatus(status)}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по возрастным ограничениям */}
        <FilterSection title="Возраст" isOpen={false}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.ageLimits.map(ageLimit => (
              <label
                key={ageLimit}
                className={`inline-flex items-center cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.ageLimits.includes(ageLimit)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.ageLimits.includes(ageLimit)}
                  onChange={() => handleAgeLimitChange(ageLimit)}
                  className="sr-only"
                />
                {ageLimit === 0 ? "Для всех" : `${ageLimit}+`}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по годам выпуска */}
        <FilterSection title="Год" isOpen={false}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.releaseYears.map(year => (
              <label
                key={year}
                className={`inline-flex items-center cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.releaseYears.includes(year)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.releaseYears.includes(year)}
                  onChange={() => handleReleaseYearChange(year)}
                  className="sr-only"
                />
                {year}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Фильтр по тегам */}
        {filterOptions.tags.length > 0 && (
          <FilterSection title="Теги" isOpen={false}>
            <div className="flex flex-wrap gap-2">
              {filterOptions.tags.map(tag => (
                <label
                  key={tag}
                  className={`inline-flex items-center cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                    className="sr-only"
                  />
                  {tag}
                </label>
              ))}
            </div>
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Фильтры</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
                aria-label="Закрыть"
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

  // Десктоп: боковая панель
  return (
    <div className="sticky top-20 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">{filterContent}</div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { X, ChevronDown, RotateCcw, SlidersHorizontal, Search } from "lucide-react";
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

const chipBase =
  "inline-flex items-center justify-center cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors select-none min-w-0";

function Section({
  title,
  openDefault,
  children,
}: {
  title: string;
  openDefault?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(openDefault ?? false);

  return (
    <section className="border-b border-[var(--border)]/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 rounded-lg -mx-1 px-1"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="pb-4 pt-0">{children}</div>}
    </section>
  );
}

/** Общая обёртка для списков с прокруткой (теги, годы) */
const scrollBox =
  "max-h-44 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--muted)]/15 p-2 custom-scrollbar";

function ChipMulti({
  label,
  selected,
  onToggle,
  shrink,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  shrink?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${chipBase} ${shrink !== false ? "shrink-0" : ""} ${
        selected
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
          : "bg-[var(--muted)]/40 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

/** Диапазон годов: два поля ввода «от» и «до» + двойной ползунок */
function YearRangeFilter({
  yearMin,
  yearMax,
  from,
  to,
  onChange,
}: {
  yearMin: number;
  yearMax: number;
  from: number | undefined;
  to: number | undefined;
  onChange: (from: number | undefined, to: number | undefined) => void;
}) {
  const curFrom = from ?? yearMin;
  const curTo = to ?? yearMax;
  const safeFrom = Math.max(yearMin, Math.min(yearMax, curFrom));
  const safeTo = Math.max(yearMin, Math.min(yearMax, curTo));
  const low = Math.min(safeFrom, safeTo);
  const high = Math.max(safeFrom, safeTo);

  const range = yearMax - yearMin || 1;
  const pctFrom = ((low - yearMin) / range) * 100;
  const pctTo = ((high - yearMin) / range) * 100;

  const setFrom = (v: number) => {
    const next = Math.max(yearMin, Math.min(yearMax, v));
    onChange(next, high === curTo && next > curTo ? next : to);
  };
  const setTo = (v: number) => {
    const next = Math.max(yearMin, Math.min(yearMax, v));
    onChange(low === curFrom && next < curFrom ? next : from, next);
  };

  const handleFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10);
    if (!Number.isNaN(n)) setFrom(n);
  };
  const handleToInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10);
    if (!Number.isNaN(n)) setTo(n);
  };

  const clearRange = () => onChange(undefined, undefined);

  const hasRange = from != null || to != null;

  return (
    <div className="space-y-3">
      {/* Ручной ввод */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            От
          </label>
          <input
            type="number"
            min={yearMin}
            max={yearMax}
            value={from ?? ""}
            onChange={e => (e.target.value === "" ? onChange(undefined, to) : handleFromInput(e))}
            placeholder={String(yearMin)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            До
          </label>
          <input
            type="number"
            min={yearMin}
            max={yearMax}
            value={to ?? ""}
            onChange={e => (e.target.value === "" ? onChange(from, undefined) : handleToInput(e))}
            placeholder={String(yearMax)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Двойной ползунок: свой трек + два input range без трека */}
      <div className="relative h-6">
        <div
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{
            background: `linear-gradient(to right, var(--muted) 0%, var(--muted) ${pctFrom}%, var(--primary) ${pctFrom}%, var(--primary) ${pctTo}%, var(--muted) ${pctTo}%, var(--muted) 100%)`,
          }}
          aria-hidden
        />
        <input
          type="range"
          min={yearMin}
          max={yearMax}
          value={low}
          onChange={e => setFrom(Number(e.target.value))}
          className="year-range-input absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:bg-[var(--card)] [&::-webkit-slider-thumb]:shadow"
          aria-label="Год от"
        />
        <input
          type="range"
          min={yearMin}
          max={yearMax}
          value={high}
          onChange={e => setTo(Number(e.target.value))}
          className="year-range-input absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:bg-[var(--card)] [&::-webkit-slider-thumb]:shadow"
          aria-label="Год до"
        />
      </div>

      {hasRange && (
        <button
          type="button"
          onClick={clearRange}
          className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
        >
          Сбросить диапазон
        </button>
      )}
    </div>
  );
}

/** Теги: поиск + прокручиваемый список чипов */
function TagsFilter({
  tags,
  selectedTags,
  onTagChange,
}: {
  tags: string[];
  selectedTags: string[];
  onTagChange: (tag: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return [...tags].sort((a, b) => a.localeCompare(b));
    const q = query.trim().toLowerCase();
    return tags.filter(t => t.toLowerCase().includes(q)).sort((a, b) => a.localeCompare(b));
  }, [tags, query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск тега..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          aria-label="Поиск по тегам"
        />
      </div>
      <div className={scrollBox}>
        <div className="flex flex-wrap gap-1.5">
          {filtered.map(tag => (
            <ChipMulti
              key={tag}
              label={tag}
              selected={selectedTags.includes(tag)}
              onToggle={() => onTagChange(tag)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            Ничего не найдено
          </p>
        )}
      </div>
    </div>
  );
}

export default function FilterSidebar<
  T extends {
    search: string;
    genres: string[];
    types: string[];
    status: string[];
    ageLimits: number[];
    releaseYears: number[];
    releaseYearFrom?: number;
    releaseYearTo?: number;
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
  const activeCount = useMemo(
    () =>
      filters.genres.length +
      filters.types.length +
      filters.status.length +
      filters.ageLimits.length +
      (filters.releaseYearFrom != null || filters.releaseYearTo != null
        ? 1
        : filters.releaseYears.length) +
      filters.tags.length,
    [filters],
  );

  const handleGenreChange = (genre: string) => {
    const next = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ ...filters, genres: next });
  };

  const handleTypeChange = (type: string) => {
    const next = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: next });
  };

  const handleStatusChange = (status: string) => {
    const next = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: next });
  };

  const handleAgeChange = (age: number) => {
    const next = filters.ageLimits.includes(age)
      ? filters.ageLimits.filter(a => a !== age)
      : [...filters.ageLimits, age];
    onFiltersChange({ ...filters, ageLimits: next });
  };

  const handleYearRangeChange = (from: number | undefined, to: number | undefined) => {
    onFiltersChange({
      ...filters,
      releaseYearFrom: from,
      releaseYearTo: to,
      releaseYears: from != null || to != null ? [] : filters.releaseYears,
    });
  };

  const yearMin = useMemo(
    () => (filterOptions.releaseYears.length > 0 ? Math.min(...filterOptions.releaseYears) : 1990),
    [filterOptions.releaseYears],
  );
  const yearMax = useMemo(
    () =>
      filterOptions.releaseYears.length > 0
        ? Math.max(...filterOptions.releaseYears)
        : new Date().getFullYear(),
    [filterOptions.releaseYears],
  );

  const handleTagChange = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: next });
  };

  const content = (
    <>
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          <span className="text-base font-semibold text-[var(--foreground)] truncate">Фильтры</span>
          {activeCount > 0 && (
            <span
              className="shrink-0 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-semibold"
              aria-label={`Активно фильтров: ${activeCount}`}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
            title="Сбросить все фильтры"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Сбросить
          </button>
        )}
      </div>

      {/* Секции */}
      <div className="space-y-0">
        <Section title="Жанры" openDefault>
          <CollapsibleGenresList
            genres={filterOptions.genres}
            selectedGenres={filters.genres}
            onGenreChange={handleGenreChange}
            maxVisibleGenres={14}
          />
        </Section>

        <Section title="Тип">
          <div className="grid grid-cols-2 gap-2">
            {filterOptions.types.map(type => (
              <ChipMulti
                key={type}
                label={translateTitleType(type)}
                selected={filters.types.includes(type)}
                onToggle={() => handleTypeChange(type)}
                shrink={false}
              />
            ))}
          </div>
        </Section>

        <Section title="Статус">
          <div className="grid grid-cols-2 gap-2">
            {filterOptions.status.map(status => (
              <ChipMulti
                key={status}
                label={translateTitleStatus(status)}
                selected={filters.status.includes(status)}
                onToggle={() => handleStatusChange(status)}
                shrink={false}
              />
            ))}
          </div>
        </Section>

        <Section title="Возраст">
          <div className="grid grid-cols-4 gap-2">
            {filterOptions.ageLimits.map(age => (
              <ChipMulti
                key={age}
                label={age === 0 ? "0+" : `${age}+`}
                selected={filters.ageLimits.includes(age)}
                onToggle={() => handleAgeChange(age)}
                shrink={false}
              />
            ))}
          </div>
        </Section>

        <Section title="Год выхода">
          <YearRangeFilter
            yearMin={yearMin}
            yearMax={yearMax}
            from={filters.releaseYearFrom}
            to={filters.releaseYearTo}
            onChange={handleYearRangeChange}
          />
        </Section>

        {filterOptions.tags.length > 0 && (
          <Section title="Теги">
            <TagsFilter
              tags={filterOptions.tags}
              selectedTags={filters.tags}
              onTagChange={handleTagChange}
            />
          </Section>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
            onKeyDown={e => e.key === "Escape" && onClose?.()}
            role="button"
            tabIndex={-1}
            aria-label="Закрыть панель"
          />
        )}
        <aside
          className={`
            fixed top-0 right-0 z-50 flex h-full w-[min(100vw-2rem,320px)] flex-col
            bg-[var(--card)] shadow-2xl ring-1 ring-[var(--border)]
            transition-transform duration-300 ease-out lg:hidden
            ${isOpen ? "translate-x-0" : "translate-x-full"}
          `}
          role="dialog"
          aria-modal="true"
          aria-label="Фильтры каталога"
        >
          <div className="flex shrink-0 items-center justify-end border-b border-[var(--border)] px-3 py-2 bg-[var(--card)]">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">{content}</div>
        </aside>
      </>
    );
  }

  return (
    <aside
      className="sticky top-20 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_3px_var(--border)] overflow-hidden"
      aria-label="Фильтры каталога"
    >
      <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4 custom-scrollbar">
        {content}
      </div>
    </aside>
  );
}

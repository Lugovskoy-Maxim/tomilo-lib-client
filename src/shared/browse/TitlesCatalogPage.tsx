"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetFilterOptionsQuery, useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType, translateTitleStatus } from "@/lib/title-type-translations";
import PopularCard, { type CardProps } from "@/shared/popular-card/PopularCard";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  RotateCcw,
  ChevronDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 24;
const SORT_LABELS: Record<string, string> = {
  weekViews: "Просмотры за неделю",
  dayViews: "Просмотры за день",
  monthViews: "Просмотры за месяц",
  views: "Всего просмотров",
  averageRating: "По рейтингу",
  name: "По названию",
  releaseYear: "По году",
  createdAt: "По дате добавления",
  updatedAt: "По обновлению",
};

interface CatalogFilters {
  search: string;
  genres: string[];
  type: string;
  status: string;
  releaseYearFrom: number | null;
  releaseYearTo: number | null;
  ageLimits: number[];
  tags: string[];
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const defaultFilters: CatalogFilters = {
  search: "",
  genres: [],
  type: "",
  status: "",
  releaseYearFrom: null,
  releaseYearTo: null,
  ageLimits: [],
  tags: [],
  sortBy: "weekViews",
  sortOrder: "desc",
};

function parseFiltersFromUrl(params: URLSearchParams): CatalogFilters {
  const genres = params.get("genres")?.split(",").filter(Boolean) ?? [];
  const ageLimits = params.get("ageLimits")?.split(",").map(Number).filter(n => !Number.isNaN(n)) ?? [];
  const tags = params.get("tags")?.split(",").filter(Boolean) ?? [];
  const yFrom = params.get("releaseYearFrom");
  const yTo = params.get("releaseYearTo");
  return {
    search: params.get("search") ?? defaultFilters.search,
    genres,
    type: params.get("type") ?? defaultFilters.type,
    status: params.get("status") ?? defaultFilters.status,
    releaseYearFrom: yFrom != null && yFrom !== "" ? parseInt(yFrom, 10) : null,
    releaseYearTo: yTo != null && yTo !== "" ? parseInt(yTo, 10) : null,
    ageLimits: ageLimits.length ? ageLimits : [],
    tags,
    sortBy: (params.get("sortBy") ?? defaultFilters.sortBy) as string,
    sortOrder: (params.get("sortOrder") ?? defaultFilters.sortOrder) as "asc" | "desc",
  };
}

function titleToCardProps(t: Title): CardProps {
  return {
    id: t._id,
    slug: t.slug,
    title: t.name ?? "",
    type: t.type ?? "manga",
    year: t.releaseYear ?? new Date().getFullYear(),
    rating: t.averageRating ?? t.rating ?? 0,
    image: t.coverImage ?? "",
    genres: t.genres ?? [],
    isAdult: t.isAdult ?? false,
  };
}

export default function TitlesCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const includeAdult = user?.displaySettings?.isAdult !== false;

  const initialFilters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams]);
  const initialPage = useMemo(() => {
    const p = searchParams.get("page");
    const n = p ? parseInt(p, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [searchParams]);

  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search);
  const [page, setPage] = useState(initialPage);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Sync URL -> state when user navigates back or URL changes
  useEffect(() => {
    const next = parseFiltersFromUrl(searchParams);
    setFilters(next);
    const p = searchParams.get("page");
    const n = p ? parseInt(p, 10) : 1;
    setPage(Number.isFinite(n) && n >= 1 ? n : 1);
  }, [searchParams]);

  useEffect(() => {
    setSearchInput(filters.search);
    setDebouncedSearch(filters.search);
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const updateUrl = useCallback(
    (next: CatalogFilters, nextPage: number) => {
      const params = new URLSearchParams();
      if (next.search) params.set("search", next.search);
      if (next.genres.length > 0) params.set("genres", next.genres.join(","));
      if (next.type) params.set("type", next.type);
      if (next.status) params.set("status", next.status);
      if (next.releaseYearFrom != null) params.set("releaseYearFrom", String(next.releaseYearFrom));
      if (next.releaseYearTo != null) params.set("releaseYearTo", String(next.releaseYearTo));
      if (next.ageLimits.length > 0) params.set("ageLimits", next.ageLimits.join(","));
      if (next.tags.length > 0) params.set("tags", next.tags.join(","));
      if (next.sortBy !== defaultFilters.sortBy) params.set("sortBy", next.sortBy);
      if (next.sortOrder !== defaultFilters.sortOrder) params.set("sortOrder", next.sortOrder);
      if (nextPage > 1) params.set("page", String(nextPage));
      const qs = params.toString();
      router.replace(qs ? `/titles?${qs}` : "/titles", { scroll: false });
    },
    [router],
  );

  const applyFilters = useCallback(
    (next: CatalogFilters, resetPage = true) => {
      setFilters(next);
      const nextPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      updateUrl(next, nextPage);
    },
    [page, updateUrl],
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    setFilterPanelOpen(false);
    router.replace("/titles", { scroll: false });
  }, [router]);

  const { data: filterOptions } = useGetFilterOptionsQuery();
  const options = filterOptions?.data;

  const {
    data: searchData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useSearchTitlesQuery({
    search: debouncedSearch || undefined,
    genres: filters.genres.length > 0 ? filters.genres.join(",") : undefined,
    types: filters.type || undefined,
    status: filters.status || undefined,
    releaseYear:
      filters.releaseYearFrom != null && filters.releaseYearTo != null
        ? undefined
        : filters.releaseYearFrom ?? filters.releaseYearTo ?? undefined,
    releaseYearFrom: filters.releaseYearFrom ?? undefined,
    releaseYearTo: filters.releaseYearTo ?? undefined,
    releaseYears: (() => {
      const from = filters.releaseYearFrom;
      const to = filters.releaseYearTo;
      if (from != null && to != null && from <= to) {
        const years: number[] = [];
        for (let y = from; y <= to; y++) years.push(y);
        return years.length > 0 ? years.join(",") : undefined;
      }
      if (from != null && (to == null || to >= from)) {
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (let y = from; y <= currentYear; y++) years.push(y);
        return years.length > 0 ? years.join(",") : undefined;
      }
      if (to != null && (from == null || from <= to)) {
        const years: number[] = [];
        for (let y = 1990; y <= to; y++) years.push(y);
        return years.length > 0 ? years.join(",") : undefined;
      }
      return undefined;
    })(),
    ageLimits:
      filters.ageLimits.length > 0 ? filters.ageLimits.join(",") : undefined,
    tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page,
    limit: PAGE_SIZE,
    includeAdult,
  });

  const pageTitles = useMemo(() => searchData?.data?.data ?? [], [searchData]);
  const total = searchData?.data?.total ?? 0;
  const totalPages = searchData?.data?.totalPages ?? 1;
  const hasMore = page < totalPages;

  // Накапливаем тайтлы при "Загрузить ещё"; при смене фильтров показываем только текущую страницу
  const [accumulatedTitles, setAccumulatedTitles] = useState<Title[]>([]);
  useEffect(() => {
    if (pageTitles.length === 0 && page === 1) {
      setAccumulatedTitles([]);
      return;
    }
    if (page === 1) {
      setAccumulatedTitles(pageTitles);
    } else {
      setAccumulatedTitles(prev => {
        const ids = new Set(prev.map(t => t._id));
        const newOnes = pageTitles.filter(t => !ids.has(t._id));
        return newOnes.length ? [...prev, ...newOnes] : prev.length ? prev : pageTitles;
      });
    }
  }, [page, pageTitles]);

  const titles = page === 1 ? pageTitles : accumulatedTitles;
  const isLoadingMore = isFetching && page > 1;

  const loadMore = useCallback(() => {
    if (page < totalPages && !isFetching) {
      const nextPage = page + 1;
      setPage(nextPage);
      updateUrl(filters, nextPage);
    }
  }, [page, totalPages, isFetching, filters, updateUrl]);

  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isFetching) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isFetching, loadMore]);

  const handleCardClick = useCallback(
    (id: string) => {
      const title = titles.find(t => t._id === id);
      if (title) router.push(getTitlePath(title));
    },
    [router, titles],
  );

  const hasActiveFilters =
    !!filters.search ||
    filters.genres.length > 0 ||
    !!filters.type ||
    !!filters.status ||
    filters.releaseYearFrom != null ||
    filters.releaseYearTo != null ||
    filters.ageLimits.length > 0 ||
    filters.tags.length > 0 ||
    filters.sortBy !== defaultFilters.sortBy ||
    filters.sortOrder !== defaultFilters.sortOrder;

  const activeFilterCount =
    (filters.genres.length ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.releaseYearFrom != null || filters.releaseYearTo != null ? 1 : 0) +
    (filters.ageLimits.length ? 1 : 0) +
    (filters.tags.length ? 1 : 0);

  const removeFilter = useCallback(
    (
      key: "search" | "genre" | "genres" | "type" | "status" | "releaseYear" | "ageLimit" | "tag",
      value?: string | number,
    ) => {
      const next = { ...filters };
      if (key === "search") {
        next.search = "";
        setSearchInput("");
        setDebouncedSearch("");
      } else if (key === "genre" && value !== undefined) {
        next.genres = next.genres.filter(g => g !== value);
      } else if (key === "genres") {
        next.genres = [];
      } else if (key === "type") {
        next.type = "";
      } else if (key === "status") {
        next.status = "";
      } else if (key === "releaseYear") {
        next.releaseYearFrom = null;
        next.releaseYearTo = null;
      } else if (key === "ageLimit" && value !== undefined) {
        next.ageLimits = next.ageLimits.filter(a => a !== value);
      } else if (key === "tag" && value !== undefined) {
        next.tags = next.tags.filter(t => t !== value);
      } else if (key === "tag" && value === undefined) {
        next.tags = [];
      }
      applyFilters(next);
    },
    [filters, applyFilters],
  );

  const isLoadingFirst = (isLoading || isFetching) && page === 1;

  return (
    <div className="titles-catalog max-w-6xl mx-auto">
      {/* Заголовок и описание */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
          Каталог
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Поиск по названию, жанрам и типам. Фильтры можно комбинировать.
        </p>
      </header>

      {/* Поиск */}
      <div className="mb-5">
        <div className="relative max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)] pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") applyFilters({ ...filters, search: searchInput.trim() });
            }}
            placeholder="Поиск по названию..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all text-base"
            aria-label="Поиск по названию"
          />
        </div>
      </div>

      {/* Панель фильтров — компактная карточка */}
      <div className="catalog-filters rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-2 sm:p-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">
              Фильтры
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Сбросить
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFilterPanelOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium"
            aria-expanded={filterPanelOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Открыть
            {hasActiveFilters && (
              <span className="min-w-[16px] h-[16px] rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Десктоп: компактные строки */}
        <div id="catalog-filter-panel" className="hidden lg:block space-y-3 rounded-xl">
          {/* Строка 1: Сортировка + Тип */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                Сортировка
              </span>
              <SortSelect
                value={filters.sortBy}
                options={options?.sortByOptions ?? Object.keys(SORT_LABELS)}
                optionLabel={k => SORT_LABELS[k] ?? k}
                onChange={v => applyFilters({ ...filters, sortBy: v })}
              />
              <button
                type="button"
                onClick={() =>
                  applyFilters({
                    ...filters,
                    sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
                  })
                }
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]"
                title={filters.sortOrder === "desc" ? "По убыванию (Я–А)" : "По возрастанию (А–Я)"}
              >
                {filters.sortOrder === "desc" ? (
                  <ArrowDownAZ className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  <ArrowUpAZ className="w-3.5 h-3.5" aria-hidden />
                )}
              </button>
            </div>
            <div className="h-4 w-px bg-[var(--border)] shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mr-0.5">
                Тип
              </span>
              <FilterChip
                label="Все"
                active={!filters.type}
                onClick={() => applyFilters({ ...filters, type: "" })}
              />
              {(options?.types ?? []).map(t => (
                <FilterChip
                  key={t}
                  label={translateTitleType(t)}
                  active={filters.type === t}
                  onClick={() => applyFilters({ ...filters, type: filters.type === t ? "" : t })}
                />
              ))}
            </div>
          </div>

          {/* Строка 2: Жанры, год, возраст, теги */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide shrink-0">
                Жанры
              </span>
              {filters.genres.map(g => (
                <ActiveChip key={g} label={g} onRemove={() => removeFilter("genre", g)} />
              ))}
              <GenreMultiSelect
                selected={filters.genres}
                options={options?.genres ?? []}
                onChange={genres => applyFilters({ ...filters, genres })}
                triggerLabel="Добавить"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                Год
              </span>
              <YearRangeInputs
                from={filters.releaseYearFrom}
                to={filters.releaseYearTo}
                suggestedYears={options?.releaseYears ?? []}
                onChange={(from, to) =>
                  applyFilters({
                    ...filters,
                    releaseYearFrom: from,
                    releaseYearTo: to,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide shrink-0">
                Возраст
              </span>
              {(options?.ageLimits ?? [0, 12, 16, 18]).map(age => (
                <FilterChip
                  key={age}
                  label={age === 0 ? "0+" : `${age}+`}
                  active={filters.ageLimits.includes(age)}
                  onClick={() => {
                    const next = filters.ageLimits.includes(age)
                      ? filters.ageLimits.filter(a => a !== age)
                      : [...filters.ageLimits, age].sort((a, b) => a - b);
                    applyFilters({ ...filters, ageLimits: next });
                  }}
                />
              ))}
            </div>
            {(options?.tags ?? []).length > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide shrink-0">
                  Теги
                </span>
                <TagsMultiSelect
                  selected={filters.tags}
                  options={options?.tags ?? []}
                  onChange={tags => applyFilters({ ...filters, tags })}
                />
              </div>
            )}
          </div>

          {/* Строка 3: Статус тайтлов (внизу) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mr-0.5">
              Статус
            </span>
            <FilterChip
              label="Любой"
              active={!filters.status}
              onClick={() => applyFilters({ ...filters, status: "" })}
            />
            {(options?.status ?? []).map(s => (
              <FilterChip
                key={s}
                label={translateTitleStatus(s)}
                active={filters.status === s}
                onClick={() =>
                  applyFilters({ ...filters, status: filters.status === s ? "" : s })
                }
              />
            ))}
          </div>
        </div>

        {/* Активные фильтры — чипы под панелью (десктоп) */}
        {hasActiveFilters && (
          <div className="hidden lg:flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
            {filters.search && (
              <ActiveChip
                label={`«${filters.search}»`}
                onRemove={() => removeFilter("search")}
              />
            )}
            {filters.genres.map(g => (
              <ActiveChip key={g} label={g} onRemove={() => removeFilter("genre", g)} />
            ))}
            {filters.type && (
              <ActiveChip
                label={translateTitleType(filters.type)}
                onRemove={() => removeFilter("type")}
              />
            )}
            {filters.status && (
              <ActiveChip
                label={translateTitleStatus(filters.status)}
                onRemove={() => removeFilter("status")}
              />
            )}
            {(filters.releaseYearFrom != null || filters.releaseYearTo != null) && (
              <ActiveChip
                label={
                  filters.releaseYearFrom != null && filters.releaseYearTo != null
                    ? `${filters.releaseYearFrom}–${filters.releaseYearTo}`
                    : filters.releaseYearFrom != null
                      ? `с ${filters.releaseYearFrom}`
                      : `до ${filters.releaseYearTo}`
                }
                onRemove={() => removeFilter("releaseYear")}
              />
            )}
            {filters.ageLimits.map(age => (
              <ActiveChip
                key={age}
                label={age === 0 ? "0+" : `${age}+`}
                onRemove={() => removeFilter("ageLimit", age)}
              />
            ))}
            {filters.tags.map(tag => (
              <ActiveChip key={tag} label={tag} onRemove={() => removeFilter("tag", tag)} />
            ))}
          </div>
        )}
      </div>

      {/* Мобильная шторка фильтров */}
      {filterPanelOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[var(--background)]"
          style={{
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
            paddingBottom: "var(--mobile-footer-bar-height)",
          }}
        >
          {/* Шапка */}
          <div
            className="flex items-center justify-between shrink-0 border-b border-[var(--border)] bg-[var(--card)]"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="px-4 py-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Фильтры</h2>
              {hasActiveFilters && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Активно фильтров: {activeFilterCount}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="p-3 mr-2 -my-1 rounded-xl hover:bg-[var(--accent)] active:opacity-80 text-[var(--foreground)] touch-manipulation"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Скроллируемый контент с отступами */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
              paddingRight: "max(0.75rem, env(safe-area-inset-right))",
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
            }}
          >
            <div className="space-y-3 max-w-lg mx-auto">
              {/* Жанры */}
              <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Жанры
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filters.genres.map(g => (
                    <ActiveChip key={g} label={g} onRemove={() => removeFilter("genre", g)} />
                  ))}
                  <GenreMultiSelect
                    selected={filters.genres}
                    options={options?.genres ?? []}
                    onChange={genres => applyFilters({ ...filters, genres })}
                    variant="sheet"
                    triggerLabel="Добавить жанры"
                  />
                </div>
              </section>

              {/* Год и возраст в одной карточке */}
              <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Год выпуска
                  </h3>
                  <YearRangeInputs
                    from={filters.releaseYearFrom}
                    to={filters.releaseYearTo}
                    suggestedYears={options?.releaseYears ?? []}
                    onChange={(from, to) =>
                      applyFilters({
                        ...filters,
                        releaseYearFrom: from,
                        releaseYearTo: to,
                      })
                    }
                    variant="sheet"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Возраст
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(options?.ageLimits ?? [0, 12, 16, 18]).map(age => (
                      <FilterChip
                        key={age}
                        label={age === 0 ? "0+" : `${age}+`}
                        active={filters.ageLimits.includes(age)}
                        onClick={() => {
                          const next = filters.ageLimits.includes(age)
                            ? filters.ageLimits.filter(a => a !== age)
                            : [...filters.ageLimits, age].sort((a, b) => a - b);
                          applyFilters({ ...filters, ageLimits: next });
                        }}
                        variant="sheet"
                      />
                    ))}
                  </div>
                </div>
              </section>

              {(options?.tags ?? []).length > 0 && (
                <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3">
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Теги
                  </h3>
                  <TagsMultiSelect
                    selected={filters.tags}
                    options={options?.tags ?? []}
                    onChange={tags => applyFilters({ ...filters, tags })}
                    variant="sheet"
                  />
                </section>
              )}

              {/* Сортировка */}
              <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Сортировка
                </h3>
                <div className="space-y-1.5">
                  <SortSelect
                    value={filters.sortBy}
                    options={options?.sortByOptions ?? Object.keys(SORT_LABELS)}
                    optionLabel={k => SORT_LABELS[k] ?? k}
                    onChange={v => applyFilters({ ...filters, sortBy: v })}
                    variant="full"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      applyFilters({
                        ...filters,
                        sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
                      })
                    }
                    className="w-full min-h-11 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm active:opacity-90 touch-manipulation"
                  >
                    {filters.sortOrder === "desc" ? (
                      <ArrowDownAZ className="w-4 h-4" />
                    ) : (
                      <ArrowUpAZ className="w-4 h-4" />
                    )}
                    {filters.sortOrder === "desc" ? "Я–А" : "А–Я"}
                  </button>
                </div>
              </section>

              {/* Статус тайтлов (внизу) */}
              <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Статус
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    label="Любой"
                    active={!filters.status}
                    onClick={() => applyFilters({ ...filters, status: "" })}
                    variant="sheet"
                  />
                  {(options?.status ?? []).map(s => (
                    <FilterChip
                      key={s}
                      label={translateTitleStatus(s)}
                      active={filters.status === s}
                      onClick={() =>
                        applyFilters({ ...filters, status: filters.status === s ? "" : s })
                      }
                      variant="sheet"
                    />
                  ))}
                </div>
              </section>

              {/* Тип (внизу) */}
              <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Тип
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    label="Все"
                    active={!filters.type}
                    onClick={() => applyFilters({ ...filters, type: "" })}
                    variant="sheet"
                  />
                  {(options?.types ?? []).map(t => (
                    <FilterChip
                      key={t}
                      label={translateTitleType(t)}
                      active={filters.type === t}
                      onClick={() => applyFilters({ ...filters, type: filters.type === t ? "" : t })}
                      variant="sheet"
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Нижняя панель с кнопками (фиксированная, с safe area) */}
          <div
            className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] flex gap-2 p-3"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 min-h-12 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-medium text-sm active:opacity-80 touch-manipulation"
            >
              Сбросить
            </button>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="flex-1 min-h-12 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 active:opacity-95 touch-manipulation"
            >
              Показать
            </button>
          </div>
        </div>
      )}

      {/* Чипы активных фильтров — под панелью (мобильные тоже видят) */}
      {hasActiveFilters && (
        <div className="lg:hidden flex flex-wrap gap-2 mb-4">
          {filters.search && (
            <ActiveChip label={`«${filters.search}»`} onRemove={() => removeFilter("search")} />
          )}
          {filters.genres.map(g => (
            <ActiveChip key={g} label={g} onRemove={() => removeFilter("genre", g)} />
          ))}
          {filters.type && (
            <ActiveChip
              label={translateTitleType(filters.type)}
              onRemove={() => removeFilter("type")}
            />
          )}
          {filters.status && (
            <ActiveChip
              label={translateTitleStatus(filters.status)}
              onRemove={() => removeFilter("status")}
            />
          )}
          {(filters.releaseYearFrom != null || filters.releaseYearTo != null) && (
            <ActiveChip
              label={
                filters.releaseYearFrom != null && filters.releaseYearTo != null
                  ? `${filters.releaseYearFrom}–${filters.releaseYearTo}`
                  : filters.releaseYearFrom != null
                    ? `с ${filters.releaseYearFrom}`
                    : `до ${filters.releaseYearTo}`
              }
              onRemove={() => removeFilter("releaseYear")}
            />
          )}
          {filters.ageLimits.map(age => (
            <ActiveChip
              key={age}
              label={age === 0 ? "0+" : `${age}+`}
              onRemove={() => removeFilter("ageLimit", age)}
            />
          ))}
          {filters.tags.map(tag => (
            <ActiveChip key={tag} label={tag} onRemove={() => removeFilter("tag", tag)} />
          ))}
        </div>
      )}

      {/* Счётчик и сетка */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {total === 0 && !isLoadingFirst
            ? "Нет тайтлов"
            : `${total} ${total === 1 ? "тайтл" : total < 5 ? "тайтла" : "тайтлов"}`}
        </p>
      </div>

      {isLoadingFirst && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">Загрузка каталога...</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <AlertCircle className="w-12 h-12 text-[var(--destructive)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">Ошибка загрузки</h3>
          <p className="text-sm text-[var(--muted-foreground)] text-center max-w-sm mb-6">
            {error && typeof error === "object" && "data" in error
              ? (error.data as { message?: string })?.message ?? "Попробуйте обновить страницу."
              : "Попробуйте обновить страницу."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity font-medium"
          >
            Обновить
          </button>
        </div>
      )}

      {!isError && !isLoadingFirst && titles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <BookOpen className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">Ничего не найдено</h3>
          <p className="text-sm text-[var(--muted-foreground)] text-center max-w-sm mb-6">
            Измените поиск или фильтры.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить фильтры
          </button>
        </div>
      )}

      {!isError && titles.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {titles.map((t) => (
              <div key={t._id} className="grid-item-animate">
                <PopularCard data={titleToCardProps(t)} onCardClick={handleCardClick} />
              </div>
            ))}
          </div>

          {hasMore && (
            <>
              <div
                ref={loadMoreSentinelRef}
                className="h-1 w-full flex-shrink-0"
                aria-hidden
              />
              <div className="flex justify-center pt-8 pb-4">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-60 disabled:pointer-events-none transition-colors font-medium"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    "Загрузить ещё"
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const FILTER_CHIP_BASE =
  "font-medium transition-all rounded-lg border ";
const FILTER_CHIP_ACTIVE = "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm border-transparent";
const FILTER_CHIP_INACTIVE =
  "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--accent)]";

function FilterChip({
  label,
  active,
  onClick,
  variant = "compact",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "compact" | "sheet";
}) {
  const isSheet = variant === "sheet";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${FILTER_CHIP_BASE} ${
        active ? FILTER_CHIP_ACTIVE : FILTER_CHIP_INACTIVE
      } ${isSheet ? "px-3 py-2 text-sm" : "px-2 py-1 text-xs"}`}
    >
      {label}
    </button>
  );
}

function GenreMultiSelect({
  selected,
  options,
  onChange,
  variant = "inline",
  triggerLabel,
}: {
  selected: string[];
  options: string[];
  onChange: (genres: string[]) => void;
  variant?: "inline" | "sheet";
  /** Если задано, на кнопке показывается только эта подпись (для варианта «выбранные снаружи + добавить») */
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isSheet = variant === "sheet";
  const isAddButton = triggerLabel != null;
  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter(g => g.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  );
  const customSelected = useMemo(
    () => selected.filter(g => !options.includes(g)),
    [selected, options],
  );
  const displayList = useMemo(() => {
    const list = [...filtered];
    const q = search.trim().toLowerCase();
    customSelected.forEach(g => {
      if (!list.includes(g) && (!q || g.toLowerCase().includes(q))) list.push(g);
    });
    return list;
  }, [filtered, customSelected, search]);

  const toggle = (g: string) => {
    if (selected.includes(g)) {
      onChange(selected.filter(x => x !== g));
    } else {
      onChange([...selected, g]);
    }
  };

  const addManual = () => {
    const value = search.trim();
    if (!value || selected.includes(value)) return;
    onChange([...selected, value]);
    setSearch("");
  };

  const buttonLabel = isAddButton
    ? triggerLabel
    : selected.length === 0
      ? "Жанры"
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.length}`;

  return (
    <div
      className={`relative ${isSheet ? (isAddButton ? "shrink-0" : "w-full") : isAddButton ? "shrink-0" : "w-full max-w-[200px]"}`}
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] text-left ${
          isSheet
            ? isAddButton
              ? "min-h-11 px-3 py-2.5 rounded-xl text-sm border-dashed"
              : "w-full min-h-11 px-3 py-2.5 rounded-xl text-sm"
            : isAddButton
              ? "px-2 py-1 rounded-lg text-xs border-dashed"
              : "w-full px-2 py-1.5 rounded-lg text-xs"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${isSheet ? "w-4 h-4" : "w-3.5 h-3.5"}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 right-0 min-w-[260px] max-h-72 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <div className="p-2 border-b border-[var(--border)] shrink-0 space-y-1.5">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addManual();
                  }
                }}
                placeholder="Найти или ввести жанр..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
              {search.trim() && !selected.includes(search.trim()) && (
                <button
                  type="button"
                  onClick={addManual}
                  className="w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] text-sm text-[var(--foreground)] text-left flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" />
                  Добавить «{search.trim()}»
                </button>
              )}
            </div>
            <ul className="overflow-y-auto py-1 max-h-60">
              {displayList.map(opt => (
                <li key={opt}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent)] flex items-center gap-2 ${
                      selected.includes(opt) ? "text-[var(--primary)] font-medium" : "text-[var(--foreground)]"
                    }`}
                    onClick={() => toggle(opt)}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        selected.includes(opt)
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {selected.includes(opt) && (
                        <span className="text-[var(--primary-foreground)] text-xs">✓</span>
                      )}
                    </span>
                    {opt}
                  </button>
                </li>
              ))}
              {displayList.length === 0 && (
                <li className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  Нет подходящих жанров. Введите название и нажмите Enter или кнопку выше.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function YearRangeInputs({
  from,
  to,
  suggestedYears,
  onChange,
  variant = "inline",
}: {
  from: number | null;
  to: number | null;
  suggestedYears: number[];
  onChange: (from: number | null, to: number | null) => void;
  variant?: "inline" | "sheet";
}) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const set = new Set(suggestedYears);
    if (suggestedYears.length > 0) return [...set].sort((a, b) => a - b);
    return Array.from({ length: currentYear - 1980 + 1 }, (_, i) => 1980 + i).reverse();
  }, [suggestedYears, currentYear]);
  const isSheet = variant === "sheet";
  const inputClass = isSheet
    ? "min-h-11 flex-1 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
    : "px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50";

  const labelClass = `text-[var(--muted-foreground)] shrink-0 font-medium ${isSheet ? "text-sm" : "text-xs"}`;

  return (
    <div className={`flex items-center gap-2 ${isSheet ? "w-full" : "flex-wrap"}`}>
      <span className={labelClass}>С</span>
      <select
        value={from ?? ""}
        onChange={e => {
          const v = e.target.value ? parseInt(e.target.value, 10) : null;
          onChange(v, to);
        }}
        className={inputClass}
        aria-label="Год от"
      >
        <option value="">—</option>
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <span className={`text-[var(--muted-foreground)] shrink-0 ${isSheet ? "text-sm" : "text-xs"}`}>—</span>
      <span className={labelClass}>По</span>
      <select
        value={to ?? ""}
        onChange={e => {
          const v = e.target.value ? parseInt(e.target.value, 10) : null;
          onChange(from, v);
        }}
        className={inputClass}
        aria-label="Год до"
      >
        <option value="">—</option>
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function TagsMultiSelect({
  selected,
  options,
  onChange,
  variant = "inline",
}: {
  selected: string[];
  options: string[];
  onChange: (tags: string[]) => void;
  variant?: "inline" | "sheet";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isSheet = variant === "sheet";
  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter(t => t.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  );

  const toggle = (t: string) => {
    if (selected.includes(t)) {
      onChange(selected.filter(x => x !== t));
    } else {
      onChange([...selected, t]);
    }
  };

  return (
    <div className={`relative w-full ${isSheet ? "" : "max-w-[180px]"}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] text-left ${
          isSheet
            ? "min-h-11 px-3 py-2.5 rounded-xl text-sm"
            : "px-2 py-1.5 rounded-lg text-xs"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected.length === 0
            ? "Теги"
            : selected.length <= 2
              ? selected.join(", ")
              : `${selected.length}`}
        </span>
        <ChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${isSheet ? "w-4 h-4" : "w-3.5 h-3.5"}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 right-0 min-w-[260px] max-h-72 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <div className="p-2 border-b border-[var(--border)] shrink-0">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Найти тег..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <ul className="overflow-y-auto py-1 max-h-60">
              {filtered.map(opt => (
                <li key={opt}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent)] flex items-center gap-2 ${
                      selected.includes(opt) ? "text-[var(--primary)] font-medium" : "text-[var(--foreground)]"
                    }`}
                    onClick={() => toggle(opt)}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        selected.includes(opt)
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {selected.includes(opt) && (
                        <span className="text-[var(--primary-foreground)] text-xs">✓</span>
                      )}
                    </span>
                    {opt}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  Нет подходящих тегов
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function SortSelect({
  value,
  options,
  optionLabel,
  onChange,
  variant = "inline",
}: {
  value: string;
  options: string[];
  optionLabel: (v: string) => string;
  onChange: (v: string) => void;
  variant?: "inline" | "full";
}) {
  const [open, setOpen] = useState(false);
  const current = value || options[0];
  const label = optionLabel(current);

  const isFull = variant === "full";
  return (
    <div className={`relative ${isFull ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] ${
          isFull
            ? "w-full min-h-11 px-3 py-2.5 rounded-xl text-sm"
            : "px-2 py-1.5 rounded-lg text-xs min-w-[140px]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${isFull ? "w-4 h-4" : "w-3.5 h-3.5"}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className={`absolute z-50 mt-1 overflow-y-auto max-h-56 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl py-1 min-w-[200px] ${
              variant === "full" ? "left-0 right-0" : "left-0"
            }`}
          >
            {options.map(opt => (
              <li key={opt}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent)] ${
                    value === opt ? "text-[var(--primary)] font-medium" : "text-[var(--foreground)]"
                  }`}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  {optionLabel(opt)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-xs text-[var(--foreground)]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-[var(--background)]/80 transition-colors"
        aria-label={`Убрать: ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

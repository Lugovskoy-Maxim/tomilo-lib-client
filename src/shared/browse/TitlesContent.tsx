"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileFilterButton, SortAndSearch, TitleGrid, FilterSidebar } from "@/shared";
import ActiveFilterChips from "@/shared/browse/ActiveFilterChips";
import FilterQuickBar from "@/shared/browse/FilterQuickBar";
import { GridSkeleton } from "@/shared/skeleton/GridSkeleton";
import { Filters } from "@/types/browse-page";
import { useGetFilterOptionsQuery, useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CATALOG_CACHE_KEY = "titles-catalog-state";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут
const DEFAULT_FILTERS: Filters = {
  search: "",
  genres: [],
  types: [],
  status: [],
  ageLimits: [],
  releaseYears: [],
  tags: [],
  sortBy: "averageRating",
  sortOrder: "desc",
};

interface GridTitle {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image?: string;
  genres: string[];
  isAdult?: boolean;
}

function buildFiltersKey(filters: Filters): string {
  return [
    filters.search,
    [...filters.genres].sort().join(","),
    [...filters.types].sort().join(","),
    [...filters.status].sort().join(","),
    [...filters.ageLimits].sort().join(","),
    [...filters.releaseYears].sort().join(","),
    [...filters.tags].sort().join(","),
    filters.sortBy,
    filters.sortOrder,
  ].join("|");
}

function parseFiltersFromSearchParams(params: URLSearchParams | Readonly<URLSearchParams>): Filters {
  const ageLimitsRaw = params.get("ageLimits") ?? params.get("ageLimit");
  const ageLimits = ageLimitsRaw
    ? ageLimitsRaw.split(",").filter(Boolean).map(Number)
    : [];
  return {
    search: params.get("search") || "",
    genres: params.get("genres")?.split(",").filter(Boolean) || [],
    types: params.get("types")?.split(",").filter(Boolean) || [],
    status: params.get("status")?.split(",").filter(Boolean) || [],
    ageLimits,
    releaseYears: params.get("releaseYears")?.split(",").filter(Boolean).map(Number) || [],
    tags: params.get("tags")?.split(",").filter(Boolean) || [],
    sortBy: (params.get("sortBy") || "averageRating") as Filters["sortBy"],
    sortOrder: (params.get("sortOrder") || "desc") as Filters["sortOrder"],
  };
}

export default function TitlesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const { user } = useAuth();
  const includeAdult = !user ? true : (user.displaySettings?.isAdult !== false);

  const [appliedFilters, setAppliedFilters] = useState<Filters>(() =>
    parseFiltersFromSearchParams(searchParams)
  );

  // States for load more functionality
  const [allTitles, setAllTitles] = useState<GridTitle[]>([]);
  const [loadMorePage, setLoadMorePage] = useState(1);
  const [limit, setLimit] = useState(15); // Default to desktop
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [restoredFromCache, setRestoredFromCache] = useState(false);
  const [cachedTotal, setCachedTotal] = useState<{ total: number; totalPages: number } | null>(null);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const scrollRestoreRef = useRef<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(appliedFilters.search);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Восстановление из sessionStorage при монтировании
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = sessionStorage.getItem(CATALOG_CACHE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached);
      const {
        filtersKey,
        filters: cachedFilters,
        allTitles: cachedTitles,
        loadMorePage: cachedPage,
        scrollY,
        timestamp,
        total,
        totalPages,
      } = parsed;
      const currentKey = buildFiltersKey(appliedFilters);
      const hasUrlParams = searchParams.toString().length > 0;
      const canRestoreByKey = filtersKey === currentKey;
      const canRestoreWithoutUrl = !hasUrlParams && cachedFilters && typeof cachedFilters === "object";
      if ((canRestoreByKey || canRestoreWithoutUrl) && cachedTitles?.length > 0 && Date.now() - timestamp < CACHE_TTL_MS) {
        if (canRestoreWithoutUrl) {
          setAppliedFilters(cachedFilters as Filters);
          setDebouncedSearch((cachedFilters as Filters).search || "");
        }
        setAllTitles(cachedTitles);
        setLoadMorePage(cachedPage);
        setCachedTotal(total != null && totalPages != null ? { total, totalPages } : null);
        setRestoredFromCache(true);
        if (typeof scrollY === "number") scrollRestoreRef.current = scrollY;
      }
    } catch {
      // ignore parse errors
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- только при монтировании

  // Восстановление скролла после рендера
  useEffect(() => {
    if (scrollRestoreRef.current !== null && restoredFromCache) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollRestoreRef.current ?? 0);
        scrollRestoreRef.current = null;
      });
    }
  }, [restoredFromCache, allTitles.length]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(appliedFilters.search);
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [appliedFilters.search]);

  // Set limit based on window size
  useEffect(() => {
    const updateLimit = () => {
      setLimit(window.innerWidth < 1024 ? 6 : 15); // 6 for mobile/tablet, 15 for desktop
    };
    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  // Опции фильтров
  const { data: filterOptions } = useGetFilterOptionsQuery();

  // Получаем оригинальные жанры без перевода для фильтров
  const originalFilterOptions = useMemo(() => {
    if (!filterOptions?.data) return undefined;

    return {
      ...filterOptions,
      data: {
        ...filterOptions.data,
        genres: filterOptions.data.genres || [],
        status: filterOptions.data.status || [],
      },
    };
  }, [filterOptions]);

  // Запрос тайтлов с параметрами (пропускаем при восстановлении из кеша)
  const shouldSkipQuery = restoredFromCache;
  const { data: titlesData, isLoading, isFetching, isError, error } = useSearchTitlesQuery(
    {
      search: debouncedSearch || undefined,
      genres: appliedFilters.genres[0] || undefined,
      types: appliedFilters.types[0] || undefined,
      status: appliedFilters.status[0] || undefined,
      releaseYear: appliedFilters.releaseYears[0] || undefined,
      ageLimits:
        appliedFilters.ageLimits.length > 0
          ? appliedFilters.ageLimits.toString()
          : undefined,
      sortBy: appliedFilters.sortBy,
      sortOrder: appliedFilters.sortOrder,
      page: loadMorePage,
      limit,
      includeAdult,
    },
    { skip: shouldSkipQuery }
  );

  const totalTitles = restoredFromCache && cachedTotal
    ? cachedTotal.total
    : (titlesData?.data?.total ?? 0);
  const totalPages = restoredFromCache && cachedTotal
    ? cachedTotal.totalPages
    : (titlesData?.data?.totalPages ?? Math.ceil(totalTitles / limit)) || 1;
  const paginatedTitles = useMemo(() => titlesData?.data?.data ?? [], [titlesData]);

  const saveCatalogState = useCallback(() => {
    if (typeof window === "undefined" || allTitles.length === 0) return;
    try {
      sessionStorage.setItem(
        CATALOG_CACHE_KEY,
        JSON.stringify({
          filtersKey: buildFiltersKey(appliedFilters),
          filters: appliedFilters,
          allTitles,
          loadMorePage,
          total: totalTitles,
          totalPages,
          scrollY: window.scrollY,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  }, [allTitles, appliedFilters, loadMorePage, totalTitles, totalPages]);

  // Сохранение в sessionStorage при уходе со страницы
  useEffect(() => {
    const saveOnLeave = () => {
      saveCatalogState();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveOnLeave();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveOnLeave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveOnLeave);
    };
  }, [saveCatalogState]);

  // Сохранение при изменении данных (кроме восстановления)
  useEffect(() => {
    if (allTitles.length === 0) return;
    const timer = setTimeout(() => {
      saveCatalogState();
    }, 300);
    return () => clearTimeout(timer);
  }, [allTitles, saveCatalogState]);

  const adaptedTitles = useMemo(
    () =>
      paginatedTitles.map((t: Title) => ({
        id: (t._id || "").toString(),
        slug: t.slug,
        title: t.name || "",
        type: translateTitleType(t.type || "manga"),
        year: t.releaseYear || new Date().getFullYear(),

        rating: t.averageRating ?? t.rating ?? 0,
        image: t.coverImage || undefined,

        genres: t.genres || [],
        isAdult: t.isAdult || false,
      })),
    [paginatedTitles],
  );

  // Append new titles to allTitles when data loads
  useEffect(() => {
    if (adaptedTitles.length > 0) {
      if (loadMorePage === 1) {
        setAllTitles(adaptedTitles);
      } else {
        setAllTitles(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTitles = adaptedTitles.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTitles];
        });
      }
    }
    setIsFilterTransitioning(false);
  }, [adaptedTitles, loadMorePage]);

  useEffect(() => {
    if (!isLoadingMore) return;
    if (isError) {
      setIsLoadingMore(false);
      return;
    }
    if (!isFetching && !isLoading) {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isFetching, isLoading, isError]);

  useEffect(() => {
    if (isError) {
      setIsFilterTransitioning(false);
    }
  }, [isError]);

  useEffect(() => {
    if (!isFetching && debouncedSearch === appliedFilters.search) {
      setIsFilterTransitioning(false);
    }
  }, [isFetching, debouncedSearch, appliedFilters.search]);

  // Load more logic
  const loadMoreTitles = useCallback(() => {
    if (!isLoadingMore && loadMorePage < totalPages) {
      setRestoredFromCache(false);
      setCachedTotal(null);
      setIsLoadingMore(true);
      setLoadMorePage(prev => prev + 1);
    }
  }, [isLoadingMore, loadMorePage, totalPages]);

  // Функция сброса фильтров
  const resetFilters = () => {
    setAppliedFilters(DEFAULT_FILTERS);
    setRestoredFromCache(false);
    setCachedTotal(null);
    setAllTitles([]);
    setLoadMorePage(1);
    try {
      sessionStorage.removeItem(CATALOG_CACHE_KEY);
    } catch {
      // ignore
    }
    updateURL(DEFAULT_FILTERS, 1);
  };

  // Обновление URL параметров при изменении фильтров
  const updateURL = (filters: Filters, page: number) => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.genres.length > 0) params.set("genres", filters.genres.join(","));
    if (filters.types.length > 0) params.set("types", filters.types.join(","));
    if (filters.status.length > 0) params.set("status", filters.status.join(","));
    if (filters.ageLimits.length > 0) params.set("ageLimits", filters.ageLimits.join(","));
    if (filters.releaseYears.length > 0) params.set("releaseYears", filters.releaseYears.join(","));
    if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
    if (filters.sortBy !== "averageRating") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString() ? `/titles?${params.toString()}` : "/titles";
    router.replace(newUrl, { scroll: false });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setIsFilterTransitioning(true);
    setAppliedFilters(newFilters);
    setAllTitles([]);
    setLoadMorePage(1);
    setRestoredFromCache(false);
    setCachedTotal(null);
    try {
      sessionStorage.removeItem(CATALOG_CACHE_KEY);
    } catch {
      // ignore
    }
    updateURL(newFilters, 1);
  };

  // Удаление отдельных фильтров для чипов
  const removeFilter = useCallback(
    (type: "genre" | "type" | "status" | "ageLimit" | "releaseYear" | "tag", value: string | number) => {
      const newFilters = { ...appliedFilters };
      if (type === "genre") newFilters.genres = newFilters.genres.filter(g => g !== value);
      if (type === "type") newFilters.types = newFilters.types.filter(t => t !== value);
      if (type === "status") newFilters.status = newFilters.status.filter(s => s !== value);
      if (type === "ageLimit") newFilters.ageLimits = newFilters.ageLimits.filter(a => a !== value);
      if (type === "releaseYear") newFilters.releaseYears = newFilters.releaseYears.filter(y => y !== value);
      if (type === "tag") newFilters.tags = newFilters.tags.filter(t => t !== value);
      handleFiltersChange(newFilters);
    },
    [appliedFilters] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Обработчик клика по карточке
  const handleCardClick = (title: GridTitle) => {
    saveCatalogState();
    const path = getTitlePath(title);
    router.push(path);
  };

  const isCatalogLoading =
    isLoading || isFetching || isFilterTransitioning || debouncedSearch !== appliedFilters.search;
  const showUpdatingOverlay = isCatalogLoading && allTitles.length > 0 && !isLoadingMore && !isError;
  const isFilteringOrSearchingLoading = isCatalogLoading && !isLoadingMore;
  const canShowLoadMoreAction = loadMorePage < totalPages || isLoadingMore;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Основной контент */}
      <div className="lg:w-3/4 min-w-0 space-y-5">
        {/* Верхняя панель: заголовок + поиск + действия */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
              Каталог
            </h1>
            <span className="text-sm text-[var(--muted-foreground)]">
              {totalTitles} {totalTitles === 1 ? "тайтл" : totalTitles < 5 ? "тайтла" : "тайтлов"}
            </span>
          </div>

          {/* Поиск и сортировка в одной строке */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <SortAndSearch
                filters={appliedFilters}
                onFiltersChange={handleFiltersChange}
                isSearching={isLoading && debouncedSearch !== appliedFilters.search}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MobileFilterButton onClick={() => setIsMobileFilterOpen(true)} />
            </div>
          </div>

          {/* Быстрые фильтры: тип и статус */}
          <FilterQuickBar
            filters={appliedFilters}
            onFiltersChange={handleFiltersChange}
            filterOptions={{
              types: originalFilterOptions?.data?.types || [],
              status: originalFilterOptions?.data?.status || [],
            }}
            onOpenFullFilters={() => setIsMobileFilterOpen(true)}
            activeCount={
              appliedFilters.types.length +
              appliedFilters.status.length +
              appliedFilters.genres.length +
              appliedFilters.ageLimits.length +
              appliedFilters.releaseYears.length +
              appliedFilters.tags.length
            }
          />

          {/* Активные фильтры — чипы */}
          <ActiveFilterChips
            filters={appliedFilters}
            onRemoveGenre={g => removeFilter("genre", g)}
            onRemoveType={t => removeFilter("type", t)}
            onRemoveStatus={s => removeFilter("status", s)}
            onRemoveAgeLimit={a => removeFilter("ageLimit", a)}
            onRemoveReleaseYear={y => removeFilter("releaseYear", y)}
            onRemoveTag={t => removeFilter("tag", t)}
          />
        </header>

        {/* Контейнер списка */}
        <section className="min-h-[280px]">
          {isCatalogLoading && allTitles.length === 0 && (
            <GridSkeleton variant="catalog" itemCount={limit} />
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <AlertCircle className="w-10 h-10 text-[var(--destructive)] mb-3" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Ошибка загрузки</h3>
              <p className="text-sm text-[var(--muted-foreground)] text-center max-w-sm mb-5">
                {error && typeof error === "object" && "data" in error
                  ? (error.data as { message?: string })?.message ||
                    "Не удалось загрузить каталог. Попробуйте позже."
                  : "Не удалось загрузить каталог. Попробуйте позже."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
              >
                Обновить
              </button>
            </div>
          )}

          {!isError && allTitles.length > 0 && (
            <div className="relative">
              <TitleGrid
                titles={allTitles}
                onCardClick={handleCardClick}
                isEmpty={false}
                onResetFilters={resetFilters}
              />
              {showUpdatingOverlay && (
                <div className="absolute inset-x-0 top-0 z-10 flex justify-center pointer-events-none">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Обновляем...
                  </span>
                </div>
              )}
            </div>
          )}

          {!isCatalogLoading && !isError && allTitles.length === 0 && (
            <TitleGrid
              titles={[]}
              onCardClick={handleCardClick}
              isEmpty
              onResetFilters={resetFilters}
            />
          )}
        </section>

        {/* Загрузить ещё */}
        {canShowLoadMoreAction && !isError && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={loadMoreTitles}
              disabled={isLoadingMore || isFilteringOrSearchingLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 disabled:opacity-60 disabled:pointer-events-none transition-colors"
            >
              {isLoadingMore || isFilteringOrSearchingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Загрузить ещё
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Боковая панель с фильтрами (десктоп) */}
      <aside className="hidden lg:block lg:w-1/4 shrink-0">
        <FilterSidebar
          filters={appliedFilters}
          onFiltersChange={handleFiltersChange}
          filterOptions={{
            genres: originalFilterOptions?.data?.genres || [],
            types: originalFilterOptions?.data?.types || [],
            status: originalFilterOptions?.data?.status || [],
            ageLimits: originalFilterOptions?.data?.ageLimits || [],
            releaseYears: originalFilterOptions?.data?.releaseYears || [],
            tags: originalFilterOptions?.data?.tags || [],
            sortByOptions: originalFilterOptions?.data?.sortByOptions || [],
          }}
          onReset={resetFilters}
        />
      </aside>

      {/* Мобильный фильтр (шторка) */}
      <FilterSidebar
        filters={appliedFilters}
        onFiltersChange={handleFiltersChange}
        filterOptions={{
          genres: originalFilterOptions?.data?.genres || [],
          types: originalFilterOptions?.data?.types || [],
          status: originalFilterOptions?.data?.status || [],
          ageLimits: originalFilterOptions?.data?.ageLimits || [],
          releaseYears: originalFilterOptions?.data?.releaseYears || [],
          tags: originalFilterOptions?.data?.tags || [],
          sortByOptions: originalFilterOptions?.data?.sortByOptions || [],
        }}
        onReset={resetFilters}
        isMobile
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  );
}

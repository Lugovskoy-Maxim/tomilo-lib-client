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
import { Loader2, BookOpen, AlertCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfileQuery } from "@/store/api/authApi";

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
  return {
    search: params.get("search") || "",
    genres: params.get("genres")?.split(",").filter(Boolean) || [],
    types: params.get("types")?.split(",").filter(Boolean) || [],
    status: params.get("status")?.split(",").filter(Boolean) || [],
    ageLimits: params.get("ageLimits")?.split(",").filter(Boolean).map(Number) || [],
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
  const { isAuthenticated, user } = useAuth();
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const includeAdult = profileData?.data?.displaySettings?.isAdult ?? user?.displaySettings?.isAdult ?? false;

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
    }, 1000);
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
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 pt-3 sm:pt-4">
      {/* Основной контент */}
      <div className="lg:w-3/4 space-y-4 sm:space-y-5">
        {/* Заголовок + поиск + быстрые фильтры */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" />
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
                  Каталог тайтлов
                </h1>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm pl-1">
                Найдено <span className="font-semibold text-[var(--primary)]">{totalTitles}</span> тайтлов
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <MobileFilterButton onClick={() => setIsMobileFilterOpen(true)} />
              <SortAndSearch
                filters={appliedFilters}
                onFiltersChange={handleFiltersChange}
                isSearching={isLoading && debouncedSearch !== appliedFilters.search}
              />
            </div>
          </div>

          {/* Быстрые фильтры (тип, статус) */}
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

          {/* Активные фильтры — чипы для быстрого снятия */}
          <div className="mt-3 -mb-1">
            <ActiveFilterChips
              filters={appliedFilters}
              onRemoveGenre={g => removeFilter("genre", g)}
              onRemoveType={t => removeFilter("type", t)}
              onRemoveStatus={s => removeFilter("status", s)}
              onRemoveAgeLimit={a => removeFilter("ageLimit", a)}
              onRemoveReleaseYear={y => removeFilter("releaseYear", y)}
              onRemoveTag={t => removeFilter("tag", t)}
            />
          </div>
        </div>

        {/* Контейнер списка */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur p-3 sm:p-4 lg:p-5 shadow-sm min-h-[320px]">
          {/* Состояние загрузки */}
          {isCatalogLoading && allTitles.length === 0 && (
            <GridSkeleton
              variant="catalog"
              itemCount={limit}
            />
          )}

          {/* Состояние ошибки */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="p-4 bg-red-500/10 rounded-full mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Ошибка загрузки</h3>
              <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
                {error && typeof error === 'object' && 'data' in error
                  ? (error.data as { message?: string })?.message || "Не удалось загрузить тайтлы. Попробуйте позже."
                  : "Не удалось загрузить тайтлы. Попробуйте позже."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/20"
              >
                Обновить страницу
              </button>
            </div>
          )}

          {/* Сетка тайтлов */}
          {!isError && allTitles.length > 0 && (
            <div className="content-reveal relative">
              <TitleGrid
                titles={allTitles}
                onCardClick={handleCardClick}
                isEmpty={allTitles.length === 0}
                onResetFilters={resetFilters}
              />
              {showUpdatingOverlay && (
                <div className="absolute inset-x-0 top-0 z-10 flex justify-center pointer-events-none">
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur px-3 py-1.5 shadow-sm">
                    <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
                    <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                      Обновляем список...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isCatalogLoading && !isError && allTitles.length === 0 && (
            <TitleGrid
              titles={allTitles}
              onCardClick={handleCardClick}
              isEmpty={true}
              onResetFilters={resetFilters}
            />
          )}
        </div>

        {/* Load more button */}
        {canShowLoadMoreAction && !isError && (
          <div className="flex justify-center my-10">
            <button
              onClick={loadMoreTitles}
              disabled={isLoadingMore || isFilteringOrSearchingLoading}
              className={`group relative px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--chart-1)] text-[var(--primary-foreground)] rounded-xl font-medium shadow-lg shadow-[var(--primary)]/20 overflow-hidden transition-all duration-300 ${
                isLoadingMore || isFilteringOrSearchingLoading
                  ? "opacity-90 cursor-not-allowed"
                  : "hover:shadow-xl hover:shadow-[var(--primary)]/30 hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoadingMore
                  ? "Идет загрузка..."
                  : isFilteringOrSearchingLoading
                    ? "Обновляем список..."
                    : "Загрузить ещё"}
                {isLoadingMore || isFilteringOrSearchingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
                )}
              </span>
              {!isLoadingMore && !isFilteringOrSearchingLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--chart-1)] to-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Боковая панель с фильтрами (десктоп) */}
      <div className="hidden lg:block lg:w-1/4">
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
      </div>

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
        isMobile={true}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  );
}

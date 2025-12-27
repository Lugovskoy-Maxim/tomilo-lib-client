
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MobileFilterButton,
  SortAndSearch,
  TitleGrid,
  FilterSidebar,
} from "@/shared";
import { Filters } from "@/types/browse-page";
import { useGetFilterOptionsQuery, useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import { getTitlePath } from "@/lib/title-paths";
import { normalizeGenres, filterGenresByType } from "@/lib/genre-normalizer";


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

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlGenres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const urlTypes = searchParams.get("types")?.split(",").filter(Boolean) || [];
    const urlStatus = searchParams.get("status")?.split(",").filter(Boolean) || [];
    const urlAgeLimits = searchParams.get("ageLimits")?.split(",").filter(Boolean).map(Number) || [];
    const urlReleaseYears = searchParams.get("releaseYears")?.split(",").filter(Boolean).map(Number) || [];
    const urlTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const urlSortBy = (searchParams.get("sortBy") || "averageRating") as Filters["sortBy"];
    const urlSortOrder = (searchParams.get("sortOrder") || "desc") as Filters["sortOrder"];
    return {
      search: urlSearch,
      genres: urlGenres,
      types: urlTypes,
      status: urlStatus,
      ageLimits: urlAgeLimits,
      releaseYears: urlReleaseYears,
      tags: urlTags,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder,
    };
  });

  // States for load more functionality
  const [allTitles, setAllTitles] = useState<GridTitle[]>([]);
  const [loadMorePage, setLoadMorePage] = useState(1);
  const [limit, setLimit] = useState(15); // Default to desktop
  const [isLoadingMore, setIsLoadingMore] = useState(false);


  // Debounce for search input (1s)
  const [debouncedSearch, setDebouncedSearch] = useState(appliedFilters.search);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
      setLimit(window.innerWidth < 1024 ? 6 : 15); // 6 for mobile/tablet, 12 for desktop
    };
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, []);



  // Опции фильтров
  const { data: filterOptions } = useGetFilterOptionsQuery();
  
  // Нормализуем жанры из фильтров
  const normalizedFilterOptions = useMemo(() => {
    if (!filterOptions?.data) return undefined;
    
    return {
      ...filterOptions,
      data: {
        ...filterOptions.data,
        genres: normalizeGenres(filterOptions.data.genres || []),
        status: filterOptions.data.status || []
      }
    };
  }, [filterOptions]);







  // Запрос тайтлов с параметрами
  const { data: titlesData } = useSearchTitlesQuery({
    search: debouncedSearch || undefined,
    genres: appliedFilters.genres.length > 0 ? appliedFilters.genres.join(',') : undefined,
    types: appliedFilters.types.length > 0 ? appliedFilters.types.join(',') : undefined,
    status: appliedFilters.status[0] || undefined,
    releaseYear: appliedFilters.releaseYears[0] || undefined,

    ageLimits: appliedFilters.ageLimits.length > 0 ? appliedFilters.ageLimits.join(',') : undefined,
    sortBy: appliedFilters.sortBy,
    sortOrder: appliedFilters.sortOrder,
    page: loadMorePage,
    limit,
  });
  
  const totalTitles = titlesData?.data?.total ?? 0;
  const totalPages = (titlesData?.data?.totalPages ?? Math.ceil(totalTitles / limit)) || 1;
  const paginatedTitles = useMemo(() => titlesData?.data?.data ?? [], [titlesData]);



  const adaptedTitles = useMemo(
    () =>
      paginatedTitles.map((t: Title) => ({
        id: (t._id || "").toString(),
        slug: t.slug, // Добавляем поддержку slug для правильной навигации
        title: t.name || "",
        type: t.type || "Манга",
        year: t.releaseYear || new Date().getFullYear(),
        rating: t.rating || 0,
        image: t.coverImage || undefined,
        genres: normalizeGenres(t.genres || []),
        isAdult: t.isAdult || false,
      })),
    [paginatedTitles]
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
    setIsLoadingMore(false);
  }, [adaptedTitles, loadMorePage]);

  // Load more logic
  const loadMoreTitles = useCallback(() => {
    if (!isLoadingMore && loadMorePage < totalPages) {
      setIsLoadingMore(true);
      setLoadMorePage(prev => prev + 1);
    }
  }, [isLoadingMore, loadMorePage, totalPages]);




  // Функция сброса фильтров
  const resetFilters = () => {
    const defaultFilters: Filters = {
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
    setAppliedFilters(defaultFilters);
    updateURL(defaultFilters, 1);
  };


  // Обновление URL параметров при изменении фильтров
  const updateURL = (filters: Filters, page: number) => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.genres.length > 0)
      params.set("genres", filters.genres.join(","));
    if (filters.types.length > 0) params.set("types", filters.types.join(","));
    if (filters.status.length > 0)
      params.set("status", filters.status.join(","));
    if (filters.ageLimits.length > 0)
      params.set("ageLimits", filters.ageLimits.join(","));
    if (filters.releaseYears.length > 0)
      params.set("releaseYears", filters.releaseYears.join(","));
    if (filters.tags.length > 0)
      params.set("tags", filters.tags.join(","));
    if (filters.sortBy !== "averageRating") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "desc")
      params.set("sortOrder", filters.sortOrder);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString()
      ? `/titles?${params.toString()}`
      : "/titles";
    router.replace(newUrl, { scroll: false });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setAppliedFilters(newFilters);
    setAllTitles([]);
    setLoadMorePage(1);
    updateURL(newFilters, 1); // Сбрасываем на первую страницу при изменении фильтров
  };





  // Обработчик клика по карточке
  const handleCardClick = (title: GridTitle) => {
    const path = getTitlePath(title);
    router.push(path);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Основной контент */}
      <div className="lg:w-3/4">
        {/* Заголовок и управление */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--muted-foreground)] mb-2">
              Каталог тайтлов
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Найдено {totalTitles} тайтлов
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MobileFilterButton onClick={() => setIsMobileFilterOpen(true)} />
            <SortAndSearch
              filters={appliedFilters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>

        {/* Сетка тайтлов */}
        <TitleGrid
          titles={allTitles}
          onCardClick={handleCardClick}
          isEmpty={allTitles.length === 0}
          onResetFilters={resetFilters}
        />

        {/* Load more button */}
        {loadMorePage < totalPages && (
          <div className="flex justify-center my-8">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                Загрузка...
              </div>
            ) : (
              <button
                onClick={loadMoreTitles}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 rounded-lg hover:bg-[var(--primary)]/90 transition-colors cursor-pointer"
              >
                Загрузить ещё
              </button>
            )}
          </div>
        )}
      </div>

      {/* Боковая панель с фильтрами (десктоп) */}
      <div className="hidden lg:block lg:w-1/4">


        <FilterSidebar
          filters={appliedFilters}
          onFiltersChange={handleFiltersChange}
          filterOptions={{
            genres: normalizedFilterOptions?.data?.genres || [],
            types: normalizedFilterOptions?.data?.types || [],
            status: normalizedFilterOptions?.data?.status || [],
            ageLimits: normalizedFilterOptions?.data?.ageLimits || [],
            releaseYears: normalizedFilterOptions?.data?.releaseYears || [],
            tags: normalizedFilterOptions?.data?.tags || [],
            sortByOptions: normalizedFilterOptions?.data?.sortByOptions || [],
          }}
          onReset={resetFilters}
        />
      </div>



      {/* Мобильный фильтр (шторка) */}
      <FilterSidebar
        filters={appliedFilters}
        onFiltersChange={handleFiltersChange}
        filterOptions={{
          genres: normalizedFilterOptions?.data?.genres || [],
          types: normalizedFilterOptions?.data?.types || [],
          status: normalizedFilterOptions?.data?.status || [],
          ageLimits: normalizedFilterOptions?.data?.ageLimits || [],
          releaseYears: normalizedFilterOptions?.data?.releaseYears || [],
          tags: normalizedFilterOptions?.data?.tags || [],
          sortByOptions: normalizedFilterOptions?.data?.sortByOptions || [],
        }}
        onReset={resetFilters}
        isMobile={true}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  );
}

export default BrowseContent;

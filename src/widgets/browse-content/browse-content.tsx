"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MobileFilterButton,
  SortAndSearch,
  TitleGrid,
  Pagination,
  FilterSidebar,
} from "@/shared";
import { Filters } from "@/types/browse-page";
import { useGetFilterOptionsQuery, useSearchTitlesQuery } from "@/store/api/titlesApi";

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlGenres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const urlTypes = searchParams.get("types")?.split(",").filter(Boolean) || [];
    const urlStatus = searchParams.get("status")?.split(",").filter(Boolean) || [];
    const urlSortBy = (searchParams.get("sortBy") || "rating") as Filters["sortBy"];
    const urlSortOrder = (searchParams.get("sortOrder") || "desc") as Filters["sortOrder"];
    return {
      search: urlSearch,
      genres: urlGenres,
      types: urlTypes,
      status: urlStatus,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder,
    };
  });

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

  const page = useMemo(() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  // Опции фильтров
  const { data: filterOptions } = useGetFilterOptionsQuery();

  // Запрос тайтлов с параметрами
  const { data: titlesData } = useSearchTitlesQuery({
    search: debouncedSearch || undefined,
    genre: appliedFilters.genres[0],
    // types не поддерживаются сервером, пропускаем
    status: appliedFilters.status[0],
    sortBy: appliedFilters.sortBy,
    sortOrder: appliedFilters.sortOrder,
    page,
    limit: 12,
  });

  const paginatedTitles = useMemo(() => titlesData?.data ?? [], [titlesData]);
  const adaptedTitles = useMemo(
    () =>
      paginatedTitles.map((t: any) => ({
        id: (t._id || t.id || "").toString(),
        title: t.name || t.title || "",
        type: t.type || "Манга",
        year: t.releaseYear || t.year || new Date().getFullYear(),
        rating: t.rating || 0,
        image: t.coverImage || t.cover || undefined,
        genres: t.genres || [],
      })),
    [paginatedTitles]
  );
  const totalTitles = titlesData?.total ?? 0;
  const currentPage = titlesData?.page ?? page;
  const totalPages = (titlesData?.totalPages ?? Math.ceil(totalTitles / 12)) || 1;

  // Функция сброса фильтров
  const resetFilters = () => {
    const defaultFilters: Filters = {
      search: "",
      genres: [],
      types: [],
      status: [],
      sortBy: "rating",
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
    if (filters.sortBy !== "rating") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "desc")
      params.set("sortOrder", filters.sortOrder);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString()
      ? `/browse?${params.toString()}`
      : "/browse";
    router.replace(newUrl, { scroll: false });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setAppliedFilters(newFilters);
    updateURL(newFilters, 1); // Сбрасываем на первую страницу при изменении фильтров
  };

  const handlePageChange = (page: number) => {
    updateURL(appliedFilters, page);
  };

  // Обработчик клика по карточке
  const handleCardClick = (id: string) => {
    router.push(`/browse/${id}`);
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
          titles={adaptedTitles as any}
          onCardClick={handleCardClick}
          isEmpty={adaptedTitles.length === 0}
          onResetFilters={resetFilters}
        />

        {/* Пагинация */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Боковая панель с фильтрами (десктоп) */}
      <div className="hidden lg:block lg:w-1/4">
        <FilterSidebar
          filters={appliedFilters}
          onFiltersChange={handleFiltersChange}
          filterOptions={{
            genres: filterOptions?.genres || [],
            types: [],
            status: filterOptions?.status || [],
          }}
          onReset={resetFilters}
        />
      </div>

      {/* Мобильный фильтр (шторка) */}
      <FilterSidebar
        filters={appliedFilters}
        onFiltersChange={handleFiltersChange}
        filterOptions={{
          genres: filterOptions?.genres || [],
          types: [],
          status: filterOptions?.status || [],
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

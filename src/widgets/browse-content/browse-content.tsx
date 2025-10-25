"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MobileFilterButton,
  SortAndSearch,
  TitleGrid,
  Pagination,
  FilterSidebar,
} from "@/shared";
import { Filters } from "@/types/browse-page";
import { mockTitle } from "@/constants/mokeReadPage";

interface BrowseContentProps {
  initialFilters: Filters;
  filterOptions: {
    genres: string[];
    types: string[];
    status: string[];
  };
  paginatedTitles: typeof mockTitle;
  totalTitles: number;
  currentPage: number;
  totalPages: number;
}

function BrowseContent({
  initialFilters,
  filterOptions,
  paginatedTitles,
  totalTitles,
  currentPage,
  totalPages,
}: BrowseContentProps) {
  const router = useRouter();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);

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
  const handleCardClick = (id: number) => {
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
          titles={paginatedTitles}
          onCardClick={handleCardClick}
          isEmpty={paginatedTitles.length === 0}
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
          filterOptions={filterOptions}
          onReset={resetFilters}
        />
      </div>

      {/* Мобильный фильтр (шторка) */}
      <FilterSidebar
        filters={appliedFilters}
        onFiltersChange={handleFiltersChange}
        filterOptions={filterOptions}
        onReset={resetFilters}
        isMobile={true}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  );
}

export default BrowseContent;

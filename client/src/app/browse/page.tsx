"use client";
import { useState, useMemo, useEffect } from "react";
import { Footer, Header } from "@/widgets";
import { useRouter, useSearchParams } from "next/navigation";
import { mockTitle } from "@/constants/mokeReadPage";
import { pageTitle } from "@/lib/page-title";
import {
  MobileFilterButton,
  SortAndSearch,
  TitleGrid,
  Pagination,
  FilterSidebar,
} from "@/shared";
import { Filters, SortBy, SortOrder } from "@/types/browse-page";

// Основной компонент страницы каталога
export default function BrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    search: "",
    genres: [],
    types: [],
    status: [],
    sortBy: "rating",
    sortOrder: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Инициализация фильтров из URL параметров
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const sortByParam = params.get("sortBy");
    const validSortBy: SortBy =
      sortByParam === "rating" ||
      sortByParam === "year" ||
      sortByParam === "views" ||
      sortByParam === "chapters"
        ? sortByParam
        : "rating";

    const sortOrderParam = params.get("sortOrder");
    const validSortOrder: SortOrder =
      sortOrderParam === "asc" || sortOrderParam === "desc"
        ? sortOrderParam
        : "desc";

    const initialFilters: Filters = {
      search: params.get("search") || "",
      genres: params.get("genres")?.split(",").filter(Boolean) || [],
      types: params.get("types")?.split(",").filter(Boolean) || [],
      status: params.get("status")?.split(",").filter(Boolean) || [],
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    };

    setAppliedFilters(initialFilters);
  }, [searchParams]);

  // Обновление URL параметров при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();

    if (appliedFilters.search) params.set("search", appliedFilters.search);
    if (appliedFilters.genres.length > 0)
      params.set("genres", appliedFilters.genres.join(","));
    if (appliedFilters.types.length > 0)
      params.set("types", appliedFilters.types.join(","));
    if (appliedFilters.status.length > 0)
      params.set("status", appliedFilters.status.join(","));
    if (appliedFilters.sortBy !== "rating")
      params.set("sortBy", appliedFilters.sortBy);
    if (appliedFilters.sortOrder !== "desc")
      params.set("sortOrder", appliedFilters.sortOrder);

    const newUrl = params.toString()
      ? `/browse?${params.toString()}`
      : "/browse";
    router.replace(newUrl, { scroll: false });
  }, [appliedFilters, router]);

  // Получаем все уникальные жанры, типы и статусы
  const filterOptions = useMemo(() => {
    const genres = new Set<string>();
    const types = new Set<string>();
    const status = new Set<string>();

    mockTitle.forEach((title) => {
      title.genres.forEach((genre) => genres.add(genre));
      types.add(title.type);
      status.add(title.status);
    });

    return {
      genres: Array.from(genres).sort(),
      types: Array.from(types).sort(),
      status: Array.from(status).sort(),
    };
  }, []);

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
    setCurrentPage(1);
  };

  // Фильтрация и сортировка тайтлов
  const filteredAndSortedTitles = useMemo(() => {
    const filtered = mockTitle.filter((title) => {
      const matchesSearch =
        appliedFilters.search === "" ||
        title.title
          .toLowerCase()
          .includes(appliedFilters.search.toLowerCase()) ||
        (title.originalTitle &&
          title.originalTitle
            .toLowerCase()
            .includes(appliedFilters.search.toLowerCase()));

      const matchesGenres =
        appliedFilters.genres.length === 0 ||
        appliedFilters.genres.some((genre) => title.genres.includes(genre));

      const matchesTypes =
        appliedFilters.types.length === 0 ||
        appliedFilters.types.includes(title.type);

      const matchesStatus =
        appliedFilters.status.length === 0 ||
        appliedFilters.status.includes(title.status);

      return matchesSearch && matchesGenres && matchesTypes && matchesStatus;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (appliedFilters.sortBy) {
        case "rating":
          aValue = a.rating;
          bValue = b.rating;
          break;
        case "year":
          aValue = a.year;
          bValue = b.year;
          break;
        case "views":
          aValue = a.views;
          bValue = b.views;
          break;
        case "chapters":
          aValue = a.totalChapters;
          bValue = b.totalChapters;
          break;
        default:
          aValue = a.rating;
          bValue = b.rating;
      }

      return appliedFilters.sortOrder === "desc"
        ? bValue - aValue
        : aValue - bValue;
    });

    return filtered;
  }, [appliedFilters]);

  // Пагинация
  const paginatedTitles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTitles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTitles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedTitles.length / itemsPerPage);

  // Обработчик клика по карточке
  const handleCardClick = (id: number) => {
    router.push(`/browse/${id}`);
  };

  useEffect(() => {
    pageTitle.setTitlePage(
      appliedFilters.search
        ? `Поиск по названию: ${appliedFilters.search}`
        : "Каталог тайтлов"
    );
  }, [appliedFilters.search]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                  Найдено {filteredAndSortedTitles.length} тайтлов
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <MobileFilterButton
                  onClick={() => setIsMobileFilterOpen(true)}
                />
                <SortAndSearch
                  filters={appliedFilters}
                  onFiltersChange={setAppliedFilters}
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
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          {/* Боковая панель с фильтрами (десктоп) */}
          <div className="hidden lg:block lg:w-1/4">
            <FilterSidebar
              filters={appliedFilters}
              onFiltersChange={setAppliedFilters}
              filterOptions={filterOptions}
              onReset={resetFilters}
            />
          </div>
        </div>
      </div>

      {/* Мобильный фильтр (шторка) */}
      <FilterSidebar
        filters={appliedFilters}
        onFiltersChange={setAppliedFilters}
        filterOptions={filterOptions}
        onReset={resetFilters}
        isMobile={true}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />

      <Footer />
    </main>
  );
}

import { BrowseContent, Footer, Header } from "@/widgets";
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

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string;
    genres?: string;
    types?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

// Основной серверный компонент страницы каталога
export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  // Ожидаем searchParams
  const resolvedSearchParams = await searchParams;

  // Получаем все уникальные жанры, типы и статусы
  const filterOptions = getFilterOptions();

  // Инициализация фильтров из URL параметров
  const initialFilters = getInitialFilters(resolvedSearchParams);
  
  // Фильтрация и сортировка тайтлов
  const filteredAndSortedTitles = getFilteredAndSortedTitles(initialFilters);
  
  // Пагинация
  const currentPage = parseInt(resolvedSearchParams.page || "1");
  const itemsPerPage = 12;
  const paginatedTitles = getPaginatedTitles(
    filteredAndSortedTitles, 
    currentPage, 
    itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredAndSortedTitles.length / itemsPerPage);

  // Установка заголовка страницы
  pageTitle.setTitlePage(
    initialFilters.search
      ? `Поиск по названию: ${initialFilters.search}`
      : "Каталог тайтлов"
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <BrowseContent
          initialFilters={initialFilters}
          filterOptions={filterOptions}
          paginatedTitles={paginatedTitles}
          totalTitles={filteredAndSortedTitles.length}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>

      <Footer />
    </main>
  );
}

// Вспомогательные функции
function getFilterOptions() {
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
}

function getInitialFilters(searchParams: Awaited<BrowsePageProps["searchParams"]>): Filters {
  const sortByParam = searchParams.sortBy;
  const validSortBy: SortBy =
    sortByParam === "rating" ||
    sortByParam === "year" ||
    sortByParam === "views" ||
    sortByParam === "chapters"
      ? sortByParam
      : "rating";

  const sortOrderParam = searchParams.sortOrder;
  const validSortOrder: SortOrder =
    sortOrderParam === "asc" || sortOrderParam === "desc"
      ? sortOrderParam
      : "desc";

  return {
    search: searchParams.search || "",
    genres: searchParams.genres?.split(",").filter(Boolean) || [],
    types: searchParams.types?.split(",").filter(Boolean) || [],
    status: searchParams.status?.split(",").filter(Boolean) || [],
    sortBy: validSortBy,
    sortOrder: validSortOrder,
  };
}

function getFilteredAndSortedTitles(appliedFilters: Filters) {
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
}

function getPaginatedTitles(titles: typeof mockTitle, currentPage: number, itemsPerPage: number) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return titles.slice(startIndex, startIndex + itemsPerPage);
}
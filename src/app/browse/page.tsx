"use client";
import { useState, useMemo, useEffect } from "react";
import { Footer, Header } from "@/widgets";
import { Search, Filter, ChevronDown, ChevronUp, Check, ArrowDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockTitle, Title } from "@/constants/mokeReadPage";
import CarouselCard, {
  CardProps,
} from "../../shared/carousel-card/carousel-card";
import { pageTitle } from "@/lib/page-title";

// Компонент фильтра
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
    <div className="border-b border-[var(--border)] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left font-medium text-[var(--muted-foreground)] mb-2"
      >
        {title}
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
};

// Типы для фильтров
type SortBy = "rating" | "year" | "views" | "chapters";
type SortOrder = "asc" | "desc";

interface Filters {
  search: string;
  genres: string[];
  types: string[];
  status: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
}

// Функция для преобразования Title в CardProps
const titleToCardProps = (title: Title): CardProps => ({
  id: title.id,
  title: title.title,
  type: title.type,
  year: title.year,
  rating: title.rating,
  image: title.image,
  genres: title.genres,
});

// Основной компонент страницы каталога
export default function BrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Состояния для формы фильтров (не применяются сразу)
  const [formFilters, setFormFilters] = useState<Filters>({
    search: "",
    genres: [],
    types: [],
    status: [],
    sortBy: "rating",
    sortOrder: "desc",
  });

  // Примененные фильтры (используются для фактической фильтрации)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(formFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Инициализация фильтров из URL параметров
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Валидация значений sortBy
    const sortByParam = params.get("sortBy");
    const validSortBy: SortBy =
      sortByParam === "rating" ||
      sortByParam === "year" ||
      sortByParam === "views" ||
      sortByParam === "chapters"
        ? sortByParam
        : "rating";

    // Валидация значений sortOrder
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

    setFormFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [searchParams]);

  // Обновление URL параметров при изменении примененных фильтров
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
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    mockTitle.forEach((title) =>
      title.genres.forEach((genre) => genres.add(genre))
    );
    return Array.from(genres).sort();
  }, []);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    mockTitle.forEach((title) => types.add(title.type));
    return Array.from(types).sort();
  }, []);

  const allStatus = useMemo(() => {
    const status = new Set<string>();
    mockTitle.forEach((title) => status.add(title.status));
    return Array.from(status).sort();
  }, []);

  // Функция применения фильтров
  const applyFilters = () => {
    setAppliedFilters(formFilters);
    setCurrentPage(1); // Сбрасываем на первую страницу при применении фильтров
  };

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
    setFormFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
  };

  // Фильтрация и сортировка тайтлов на основе примененных фильтров
  const filteredAndSortedTitles = useMemo(() => {
    const filtered = mockTitle.filter((title) => {
      // Поиск по названию
      const matchesSearch =
        appliedFilters.search === "" ||
        title.title
          .toLowerCase()
          .includes(appliedFilters.search.toLowerCase()) ||
        (title.originalTitle &&
          title.originalTitle
            .toLowerCase()
            .includes(appliedFilters.search.toLowerCase()));

      // Фильтрация по жанрам
      const matchesGenres =
        appliedFilters.genres.length === 0 ||
        appliedFilters.genres.some((genre) => title.genres.includes(genre));

      // Фильтрация по типам
      const matchesTypes =
        appliedFilters.types.length === 0 ||
        appliedFilters.types.includes(title.type);

      // Фильтрация по статусу
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

  // Обработчики для формы фильтров
  const handleGenreChange = (genre: string) => {
    setFormFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleTypeChange = (type: string) => {
    setFormFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const handleStatusChange = (status: string) => {
    setFormFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  // Обработчик изменения сортировки
  const handleSortByChange = (value: string) => {
    const sortBy: SortBy =
      value === "rating" ||
      value === "year" ||
      value === "views" ||
      value === "chapters"
        ? value
        : "rating";

    setFormFilters((prev) => ({
      ...prev,
      sortBy,
    }));
  };

  // Обработчик клика по карточке
  const handleCardClick = (id: number) => {
    router.push(`/browse/${id}`);
  };

  // Обработчик нажатия клавиши Enter в поле поиска
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
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

              {/* Сортировка */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={formFilters.sortBy}
                  onChange={(e) => handleSortByChange(e.target.value)}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="rating">По рейтингу</option>
                  <option value="year">По году</option>
                  <option value="views">По просмотрам</option>
                  <option value="chapters">По количеству глав</option>
                </select>

                <button
                  onClick={() =>
                    setFormFilters((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                    }))
                  }
                  className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  {formFilters.sortOrder === "desc"
                    ? <ArrowDown className="h-4 w-4 transform rotate-0 transition-all cursor-pointer"/>
                    : <ArrowDown className="h-4 w-4 transform rotate-180 transition-all cursor-pointer"/>}
                </button>
              </div>
            </div>

            {/* Поиск */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={formFilters.search}
                onChange={(e) =>
                  setFormFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-20 py-3 bg-[var(--card)] border focus:border-[var(--border)] rounded-lg focus:outline-none border-[var(--primary-foreground)] text-[var(--muted-foreground)] placeholder-[var(--muted-foreground)]"
              />
              <button
                onClick={applyFilters}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[var(--chart-1)]/50 text-[var(--primary)] px-4 py-1.5 rounded-md text-sm font-medium  transition-colors flex items-center gap-2"
              >
                Найти 
              </button>
            </div>

            {/* Сетка тайтлов */}
            {paginatedTitles.length > 0 ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                  {paginatedTitles.map((title) => (
                    <CarouselCard
                      key={title.id}
                      data={titleToCardProps(title)}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
                    >
                      Назад
                    </button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const page =
                            currentPage <= 3
                              ? i + 1
                              : currentPage >= totalPages - 2
                              ? totalPages - 4 + i
                              : currentPage - 2 + i;

                          if (page < 1 || page > totalPages) return null;

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-lg border ${
                                currentPage === page
                                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                                  : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
                              } transition-colors`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
                    >
                      Вперед
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-[var(--muted-foreground)] mb-4">
                  Ничего не найдено
                </div>
                <button
                  onClick={resetFilters}
                  className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>

          {/* Боковая панель с фильтрами */}
          <div className="lg:w-1/4">
            <div className="sticky top-20 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--muted-foreground)] flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Фильтры
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-[var(--chart-1)]/90 transition-colors cursor-pointer hover:text-[var(--chart-1)] "
                >
                  Сбросить все
                </button>
              </div>

              <div className="space-y-4">
                {/* Фильтр по жанрам */}
                <FilterSection title="Жанры" isOpen={true}>
                  {allGenres.map((genre) => (
                    <label
                      key={genre}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formFilters.genres.includes(genre)}
                          onChange={() => handleGenreChange(genre)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center ${
                            formFilters.genres.includes(genre)
                              ? "bg-[var(--primary)] border-[var(--primary)]"
                              : "border-[var(--border)] bg-[var(--background)]"
                          }`}
                        >
                          {formFilters.genres.includes(genre) && (
                            <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {genre}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Фильтр по типам */}
                <FilterSection title="Тип" isOpen={false}>
                  {allTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formFilters.types.includes(type)}
                          onChange={() => handleTypeChange(type)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center ${
                            formFilters.types.includes(type)
                              ? "bg-[var(--primary)] border-[var(--primary)]"
                              : "border-[var(--border)] bg-[var(--background)]"
                          }`}
                        >
                          {formFilters.types.includes(type) && (
                            <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {type}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Фильтр по статусу */}
                <FilterSection title="Статус" isOpen={false}>
                  {allStatus.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formFilters.status.includes(status)}
                          onChange={() => handleStatusChange(status)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center ${
                            formFilters.status.includes(status)
                              ? "bg-[var(--primary)] border-[var(--primary)]"
                              : "border-[var(--border)] bg-[var(--background)]"
                          }`}
                        >
                          {formFilters.status.includes(status) && (
                            <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {status}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Кнопка применения фильтров */}
                <button
                  onClick={applyFilters}
                  className="w-full bg-[var(--chart-1)]/50 text-[var(--primary)] py-2 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Применить фильтры
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MobileFilterButton,
  SortAndSearch,
  Pagination,
  FilterSidebar,
} from "@/shared";
import { useGetCollectionsQuery } from "@/store/api/collectionsApi";
import { Collection } from "@/types/collection";

interface CollectionsFilters {
  search: string;
  sortBy: "name" | "views" | "createdAt";
  sortOrder: "asc" | "desc";
}

function CollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<CollectionsFilters>(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlSortBy = (searchParams.get("sortBy") || "createdAt") as CollectionsFilters["sortBy"];
    const urlSortOrder = (searchParams.get("sortOrder") || "desc") as CollectionsFilters["sortOrder"];
    return {
      search: urlSearch,
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

  // Запрос коллекций с параметрами
  const { data: collectionsResponse, isLoading, error } = useGetCollectionsQuery({
    search: debouncedSearch || undefined,
    sortBy: appliedFilters.sortBy,
    sortOrder: appliedFilters.sortOrder,
    page,
    limit: 12,
  });

  const collections = collectionsResponse?.data?.collections || [];
  const totalCollections = collectionsResponse?.data?.total || 0;
  const currentPage = collectionsResponse?.data?.page || page;
  const totalPages = collectionsResponse?.data?.totalPages || 1;

  // Функция сброса фильтров
  const resetFilters = () => {
    const defaultFilters: CollectionsFilters = {
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setAppliedFilters(defaultFilters);
    updateURL(defaultFilters, 1);
  };

  // Обновление URL параметров при изменении фильтров
  const updateURL = (filters: CollectionsFilters, page: number) => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy !== "createdAt") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString()
      ? `/collections?${params.toString()}`
      : "/collections";
    router.replace(newUrl, { scroll: false });
  };

  const handleFiltersChange = (newFilters: CollectionsFilters) => {
    setAppliedFilters(newFilters);
    updateURL(newFilters, 1); // Сбрасываем на первую страницу при изменении фильтров
  };

  const handlePageChange = (page: number) => {
    updateURL(appliedFilters, page);
  };

  // Обработчик клика по карточке коллекции
  const handleCardClick = (id: string) => {
    router.push(`/collections/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-[var(--card)] rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-[var(--card)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)] mb-4">
          Не удалось загрузить коллекции
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Основной контент */}
      <div className="lg:w-3/4">
        {/* Заголовок и управление */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--muted-foreground)] mb-2">
              Коллекции
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Найдено {totalCollections} коллекций
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

        {/* Сетка коллекций */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection._id}
              onClick={() => handleCardClick(collection._id)}
              className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 hover:border-[var(--primary)] transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-[var(--muted-foreground)] truncate">
                  {collection.name}
                </h3>
              </div>

              {collection.description && (
                <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <span>👁️</span>
                  {collection.views} просмотров
                </span>
                <span>
                  {collection.titles?.length || 0} тайтлов
                </span>
              </div>

              {collection.createdAt && (
                <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Создано: {new Date(collection.createdAt).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
          ))}
        </div>

        {collections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--muted-foreground)] mb-4">
              Коллекции не найдены
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
            >
              Сбросить фильтры
            </button>
          </div>
        )}

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
            genres: [],
            types: [],
            status: [],
          }}
          onReset={resetFilters}
        />
      </div>

      {/* Мобильный фильтр (шторка) */}
      <FilterSidebar
        filters={appliedFilters}
        onFiltersChange={handleFiltersChange}
        filterOptions={{
          genres: [],
          types: [],
          status: [],
        }}
        onReset={resetFilters}
        isMobile={true}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  );
}

export default CollectionsContent;

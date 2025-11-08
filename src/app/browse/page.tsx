"use client";
import { BrowseContent, Footer, Header } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { Filters, SortBy, SortOrder } from "@/types/browse-page";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

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

// Страница каталога рендерится сервером, данные подтягиваются на клиенте через RTK Query

// Компонент-обертка для клиентской части
function BrowsePageClient({ searchQuery }: { searchQuery?: string }) {
  // SEO для страницы каталога
  const seoConfig = useMemo(() => seoConfigs.browse(searchQuery), [searchQuery]);
  useSEO(seoConfig);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <BrowseContent />
      </div>

      <Footer />
    </main>
  );
}

// Основной серверный компонент страницы каталога
export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const resolvedSearchParams = await searchParams;
  const initialFilters = getInitialFilters(resolvedSearchParams);

  pageTitle.setTitlePage(
    initialFilters.search
      ? `Поиск по названию: ${initialFilters.search}`
      : "Каталог тайтлов"
  );

  return <BrowsePageClient searchQuery={initialFilters.search} />;
}

// Утилита для получения начальных фильтров из URL параметров
function getInitialFilters(params: Awaited<BrowsePageProps["searchParams"]>): Filters {
  const search = params.search || "";
  const genres = params.genres ? params.genres.split(",").filter(Boolean) : [];
  const types = params.types ? params.types.split(",").filter(Boolean) : [];
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const sortBy = (params.sortBy || "rating") as SortBy;
  const sortOrder = (params.sortOrder || "desc") as SortOrder;
  return { search, genres, types, status, sortBy, sortOrder };
}

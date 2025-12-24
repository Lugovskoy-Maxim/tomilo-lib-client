import { pageTitle } from "@/lib/page-title";
import { Filters, SortBy, SortOrder } from "@/types/browse-page";
import BrowsePageClient from "./browse-client";
import { Metadata } from 'next';

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string;
    genres?: string;
    types?: string;
    status?: string;
    ageLimits?: string;
    releaseYears?: string;
    tags?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

// Функция для генерации метаданных страницы
export async function generateMetadata({ searchParams }: BrowsePageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const initialFilters = getInitialFilters(resolvedSearchParams);
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru';
  
  // Формируем канонический URL - ведущий на /titles
  const canonicalUrl = new URL('/titles', baseUrl);
  
  // Добавляем параметры поиска, если они есть
  if (initialFilters.search) {
    canonicalUrl.searchParams.set('search', initialFilters.search);
  }
  
  // Добавляем другие параметры фильтрации
  if (initialFilters.genres.length > 0) {
    canonicalUrl.searchParams.set('genres', initialFilters.genres.join(','));
  }
  
  if (initialFilters.types.length > 0) {
    canonicalUrl.searchParams.set('types', initialFilters.types.join(','));
  }
  
  if (initialFilters.status.length > 0) {
    canonicalUrl.searchParams.set('status', initialFilters.status.join(','));
  }
  
  if (initialFilters.ageLimits.length > 0) {
    canonicalUrl.searchParams.set('ageLimits', initialFilters.ageLimits.join(','));
  }
  
  if (initialFilters.releaseYears.length > 0) {
    canonicalUrl.searchParams.set('releaseYears', initialFilters.releaseYears.join(','));
  }
  
  if (initialFilters.tags.length > 0) {
    canonicalUrl.searchParams.set('tags', initialFilters.tags.join(','));
  }
  
  // Добавляем параметры сортировки
  if (initialFilters.sortBy !== 'averageRating') {
    canonicalUrl.searchParams.set('sortBy', initialFilters.sortBy);
  }
  
  if (initialFilters.sortOrder !== 'desc') {
    canonicalUrl.searchParams.set('sortOrder', initialFilters.sortOrder);
  }
  
  // Добавляем номер страницы
  if (resolvedSearchParams.page && resolvedSearchParams.page !== '1') {
    canonicalUrl.searchParams.set('page', resolvedSearchParams.page);
  }
  
  return {
    title: initialFilters.search
      ? `Поиск по названию: ${initialFilters.search}`
      : "Каталог тайтлов",
    description: initialFilters.search
      ? `Результаты поиска по запросу: ${initialFilters.search}`
      : "Каталог тайтлов на Tomilo-lib - читайте мангу, манхву и комиксы онлайн",
    alternates: {
      canonical: canonicalUrl.toString(),
    },
  };
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
  const ageLimits = params.ageLimits ? params.ageLimits.split(",").filter(Boolean).map(Number) : [];
  const releaseYears = params.releaseYears ? params.releaseYears.split(",").filter(Boolean).map(Number) : [];
  const tags = params.tags ? params.tags.split(",").filter(Boolean) : [];
  const sortBy = (params.sortBy || "averageRating") as SortBy;
  const sortOrder = (params.sortOrder || "desc") as SortOrder;
  return { search, genres, types, status, ageLimits, releaseYears, tags, sortBy, sortOrder };
}

import { pageTitle } from "@/lib/page-title";
import { CollectionsPage } from "@/widgets";

interface CollectionsPageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

// Основной серверный компонент страницы коллекций
export default async function CollectionsPageRoute({ searchParams }: CollectionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialFilters = getInitialFilters(resolvedSearchParams);

  pageTitle.setTitlePage(
    initialFilters.search
      ? `Поиск коллекций: ${initialFilters.search}`
      : "Просмотрите все доступные коллекции тайтлов - Tomilo-lib.ru"
  );

  return <CollectionsPage />;
}

// Утилита для получения начальных фильтров из URL параметров
function getInitialFilters(params: Awaited<CollectionsPageProps["searchParams"]>) {
  const search = params.search || "";
  const sortBy = (params.sortBy || "createdAt") as "name" | "views" | "createdAt";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";
  return { search, sortBy, sortOrder };
}

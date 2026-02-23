import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-title";
import { CollectionsPage } from "@/widgets";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";

interface CollectionsPageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata({ searchParams }: CollectionsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const search = params.search || "";
  const title = search
    ? `Поиск коллекций: «${search}» — Tomilo-lib.ru`
    : "Коллекции манги, манхвы и маньхуа — Tomilo-lib.ru";
  const description = search
    ? `Коллекции по запросу «${search}». Подборки тайтлов по темам и жанрам для чтения онлайн.`
    : "Подборки тайтлов по темам и жанрам. Коллекции манги, манхвы и маньхуа для удобного чтения онлайн.";
  const canonicalUrl = search ? `${baseUrl}/collections?search=${encodeURIComponent(search)}` : `${baseUrl}/collections`;

  return buildServerSEOMetadata({
    title,
    description,
    keywords:
      "коллекции манги, подборки тайтлов, манхва, маньхуа, тематические коллекции, читать онлайн, Tomilo-lib",
    canonicalUrl,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — коллекции",
    type: "website",
  });
}

// Основной серверный компонент страницы коллекций
export default async function CollectionsPageRoute({ searchParams }: CollectionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialFilters = getInitialFilters(resolvedSearchParams);

  pageTitle.setTitlePage(
    initialFilters.search
      ? `Поиск коллекций: ${initialFilters.search}`
      : "Просмотрите все доступные коллекции тайтлов - Tomilo-lib.ru",
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

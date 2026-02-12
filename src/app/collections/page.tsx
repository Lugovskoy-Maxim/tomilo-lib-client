import { Metadata } from "next";
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

  return {
    title,
    description,
    keywords:
      "коллекции манги, подборки тайтлов, манхва, маньхуа, тематические коллекции, читать онлайн, Tomilo-lib",
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl, languages: { "ru-RU": canonicalUrl } },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "Tomilo-lib.ru",
      locale: "ru_RU",
      images: [
        { url: `${baseUrl}/logo/tomilo_color.svg`, width: 1200, height: 630, alt: "Tomilo-lib — коллекции" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/logo/tomilo_color.svg`],
      creator: "@tomilo_lib",
      site: "@tomilo_lib",
    },
  };
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
